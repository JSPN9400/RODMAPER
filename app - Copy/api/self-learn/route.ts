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

function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY || 'mock_key' })
}

async function groqCall(prompt: string): Promise<string> {
  const hasGroq = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== ''
  if (!hasGroq) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('Neither GROQ_API_KEY nor GEMINI_API_KEY is configured')
    const { GoogleGenAI } = require('@google/genai')
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    })
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    })
    return response.text || ''
  }

  const res = await getGroq().chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 1200, temperature: 0.7,
    messages: [{ role: 'user', content: prompt }]
  })
  return res.choices[0]?.message?.content || ''
}

function parseJSON(text: string): any {
  let c = text.replace(/```json|```/g, '').trim()
  const s = Math.max(c.indexOf('{'), c.indexOf('['))
  const e = Math.max(c.lastIndexOf('}'), c.lastIndexOf(']'))
  if (s !== -1 && e !== -1) c = c.slice(s, e + 1)
  return JSON.parse(c)
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
      const text = await groqCall(`Learning coach. Suggest best next task.
Goal: ${roadmap.goal}
Completed: ${completed.join(', ')}
Struggling: ${skipped.join(', ')}
Days left: ${tasks.filter((t: any)=>!t.done).length}
Return ONLY JSON: {"suggestedTopic":"topic","reason":"why","resources":[{"name":"name","url":"https://url.com"}],"estimatedHours":2}`)
      return NextResponse.json(parseJSON(text))
    } catch {
      return NextResponse.json({ suggestedTopic: 'Review previous topics', reason: 'Consolidate your learning', resources: [], estimatedHours: 2 })
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
Return ONLY JSON: {"insights":["insight1","insight2"],"adjustments":[],"nextSteps":["step1","step2"],"motivationScore":75,"learningStyle":"Consistent Learner"}`)
    return NextResponse.json({ ...parseJSON(text), completionRate, streakMax, topSkills })
  } catch {
    return NextResponse.json({ insights:['Keep going!'], adjustments:[], nextSteps:['Complete today task'], motivationScore:70, learningStyle:'Active Learner', completionRate, streakMax, topSkills })
  }
}
