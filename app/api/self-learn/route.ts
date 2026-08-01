/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Groq from 'groq-sdk'

async function geminiCall(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('Neither GROQ_API_KEY nor GEMINI_API_KEY is configured')
  const { GoogleGenAI } = require('@google/genai')
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  })
  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: prompt,
    config: { temperature: 0.7 },
  })
  return response.text || ''
}

// Groq primary, Gemini fallback — including when Groq is configured but
// the call itself fails (invalid/expired key, rate limit, outage), not
// just when the key is entirely absent. Every other AI call in this app
// follows this same pattern (see lib/mentor.ts, lib/adaptive.ts,
// lib/reflection.ts) — this route was the one place it was missing,
// making it more fragile than the rest of the app for no reason.
async function groqCall(prompt: string): Promise<string> {
  const hasGroq = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== ''
  if (hasGroq) {
    try {
      const client = new Groq({ apiKey: process.env.GROQ_API_KEY! })
      const res = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1200,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      })
      const text = res.choices[0]?.message?.content
      if (text) return text
      throw new Error('Groq returned an empty response')
    } catch (err) {
      console.warn('[self-learn] Groq failed, trying Gemini:', err)
      return geminiCall(prompt)
    }
  }
  return geminiCall(prompt)
}

function parseJSON(text: string): any {
  let c = text.replace(/```json|```/g, '').trim()
  const s = Math.max(c.indexOf('{'), c.indexOf('['))
  const e = Math.max(c.lastIndexOf('}'), c.lastIndexOf(']'))
  if (s !== -1 && e !== -1) c = c.slice(s, e + 1)
  return JSON.parse(c)
}

// Same reasoning as lib/roadmap-generator.ts's buildResourceUrl: an LLM
// reliably hallucinates specific URLs since it has no live web access, so
// asking it for a resource name is fine, asking it for a working link is
// not. This route used to ask the model for a direct "url" field, which
// was frequently a dead link — resolved server-side instead now.
function buildResourceUrl(name: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(name)}`
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { roadmapId, action } = await req.json()
  const roadmap = await prisma.roadmap.findFirst({
    where: { id: roadmapId, userId: session.user.id },
    include: { tasks: true }
  })
  if (!roadmap) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const tasks = roadmap.tasks
  const done = tasks.filter((t: any) => t.done)
  const doneDays = done.map((t: any) => t.day).sort((a: any, b: any) => a - b)
  const completionRate = tasks.length > 0 ? Math.round(done.length / tasks.length * 100) : 0

  let streakMax = 0, cur = 0
  for (let i = 0; i < doneDays.length; i++) {
    if (i === 0 || doneDays[i] - doneDays[i-1] === 1) { cur++; streakMax = Math.max(streakMax, cur) } else cur = 1
  }

  const skillCount: Record<string,number> = {}
  tasks.forEach((t: any) => { if (t.techStack && Array.isArray(t.techStack)) (t.techStack as any[]).forEach((s:any) => { if (s.name) skillCount[s.name] = (skillCount[s.name]||0)+1 }) })
  const topSkills = Object.entries(skillCount).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([n])=>n)

  if (action === 'suggest') {
    const completed = done.map((t: any) => t.title).slice(-5)
    const skipped = tasks.filter((t: any) => !t.done).slice(0,5).map((t: any) => t.title)
    try {
      const text = await groqCall(`Learning coach. Suggest the single best next task for this student.
Goal: ${roadmap.goal}
Completed: ${completed.join(', ')}
Struggling: ${skipped.join(', ')}
Days left: ${tasks.filter((t: any)=>!t.done).length}
Return ONLY JSON, no markdown: {"suggestedTopic":"topic","reason":"why, specific to their situation","resourceName":"one specific, real, well-known resource — do not include a URL, just its name","estimatedHours":2}`)
      const parsed = parseJSON(text)
      return NextResponse.json({
        suggestedTopic: parsed.suggestedTopic,
        reason: parsed.reason,
        resources: parsed.resourceName ? [{ name: parsed.resourceName, url: buildResourceUrl(parsed.resourceName) }] : [],
        estimatedHours: parsed.estimatedHours || 2,
      })
    } catch (err) {
      console.error('[self-learn] suggestion generation failed:', err)
      return NextResponse.json(
        { error: 'The AI suggestion is unavailable right now — check that GROQ_API_KEY or GEMINI_API_KEY is configured, then try again.' },
        { status: 502 }
      )
    }
  }

  // Full analysis
  try {
    const text = await groqCall(`Learning coach. Analyze student progress.
Roadmap: ${roadmap.title}
Completion: ${completionRate}%
Days done: ${done.length}, Max streak: ${streakMax}
Skipped days: ${tasks.filter((t: any)=>!t.done).length}
Skills: ${topSkills.join(', ')}
Return ONLY JSON, no markdown: {"insights":["insight1","insight2"],"adjustments":[],"nextSteps":["step1","step2"],"motivationScore":75,"learningStyle":"Consistent Learner"}`)
    return NextResponse.json({ ...parseJSON(text), completionRate, streakMax, topSkills })
  } catch (err) {
    console.error('[self-learn] analysis generation failed:', err)
    return NextResponse.json(
      { error: 'AI analysis is unavailable right now — check that GROQ_API_KEY or GEMINI_API_KEY is configured, then try again.' },
      { status: 502 }
    )
  }
}
