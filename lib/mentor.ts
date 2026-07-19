/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

import Groq from 'groq-sdk'
import { prisma } from './prisma'

const MEMORY_TURNS = 20 // how many past messages to include as conversation history
const OVERDUE_GRACE_DAYS = 1 // how many days behind pace before a task counts as "overdue"

function getGroqClient() {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('GROQ_API_KEY not set')
  return new Groq({ apiKey: key })
}

async function geminiChat(systemPrompt: string, history: { role: string; content: string }[], userMessage: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('Neither GROQ_API_KEY nor GEMINI_API_KEY is configured')

  const { GoogleGenAI } = require('@google/genai')
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  })

  // Fold system + history + new message into one prompt — this SDK's
  // multi-turn `contents` shape isn't verified against the pinned
  // @google/genai version here, so a flattened transcript is the safer
  // choice for the fallback path (still gives the model full context).
  const transcript = history.map((m) => `${m.role === 'user' ? 'Student' : 'Mentor'}: ${m.content}`).join('\n\n')
  const prompt = `${systemPrompt}\n\n${transcript ? transcript + '\n\n' : ''}Student: ${userMessage}\n\nMentor:`

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: prompt,
    config: { temperature: 0.8 },
  })
  return (response.text || '').trim()
}

async function groqChat(systemPrompt: string, history: { role: string; content: string }[], userMessage: string): Promise<string> {
  const hasGroq = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== ''
  if (!hasGroq) return geminiChat(systemPrompt, history, userMessage)

  try {
    const client = getGroqClient()
    const res = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 500,
      temperature: 0.8,
      messages: [
        { role: 'system', content: systemPrompt },
        ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user', content: userMessage },
      ],
    })
    return (res.choices[0]?.message?.content || '').trim()
  } catch (err) {
    console.warn('[mentor] Groq call failed, falling back to Gemini:', err)
    return geminiChat(systemPrompt, history, userMessage)
  }
}

// Builds a plain-English snapshot of the user's current standing —
// active roadmaps, progress, streak, and anything overdue — so the
// mentor can reference specifics ("your SQL roadmap") instead of
// generic advice, and can naturally ask about a missed task rather than
// requiring the user to bring it up first.
async function buildContext(userId: string): Promise<string> {
  const roadmaps = await prisma.roadmap.findMany({
    where: { userId, status: 'ACTIVE' },
    include: { tasks: true },
  })

  if (roadmaps.length === 0) {
    return 'This student has no active roadmaps yet — they may be here to ask for guidance on getting started.'
  }

  const lines: string[] = []
  const overdueLines: string[] = []

  for (const rm of roadmaps) {
    const total = rm.tasks.length
    const done = rm.tasks.filter((t) => t.done).length
    const pct = total > 0 ? Math.round((done / total) * 100) : 0
    const elapsedDays = Math.floor((Date.now() - rm.createdAt.getTime()) / 86400000) + 1
    const expectedDay = Math.min(elapsedDays, rm.totalDays)

    lines.push(`- "${rm.title}" (goal: ${rm.goal}): ${done}/${total} tasks done (${pct}%), day ${expectedDay} of ${rm.totalDays}.`)

    const overdue = rm.tasks
      .filter((t) => !t.done && t.day <= expectedDay - OVERDUE_GRACE_DAYS)
      .sort((a, b) => a.day - b.day)
      .slice(0, 3)
    for (const t of overdue) {
      const daysBehind = expectedDay - t.day
      overdueLines.push(`- "${t.title}" from "${rm.title}" (day ${t.day}), about ${daysBehind} day${daysBehind === 1 ? '' : 's'} behind pace.`)
    }
  }

  let context = `Active roadmaps:\n${lines.join('\n')}`
  if (overdueLines.length > 0) {
    context += `\n\nTasks that look overdue/skipped (behind the roadmap's expected pace):\n${overdueLines.join('\n')}\nIf the conversation hasn't already addressed these, it's natural to gently ask about one of them — why it was missed, and whether anything's blocking progress. Don't interrogate about all of them at once.`
  } else {
    context += `\n\nNothing looks overdue right now — the student is on pace.`
  }
  return context
}

const SYSTEM_PROMPT_BASE = `You are the AI Mentor inside RoadMaper, a learning roadmap app. You act as a supportive but honest study coach/accountability partner for a student working through a self-paced learning plan.

Tone: warm, direct, conversational — like a good mentor, not a corporate assistant. Keep replies short (2-5 sentences typically) unless the student asks for something detailed. Ask one focused question at a time rather than a checklist. Use specifics from their actual roadmap/task data given below rather than generic encouragement. It's fine to be honest that something is behind schedule — don't be falsely cheerful, but stay constructive and never shaming.

You have real memory of this conversation via the message history provided — refer back to things the student has told you earlier in this chat when relevant, rather than treating every message as the first one.`

export async function askMentor(userId: string, roadmapId: string | null, userMessage: string): Promise<string> {
  const [context, historyRows] = await Promise.all([
    buildContext(userId),
    prisma.message.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: MEMORY_TURNS,
    }),
  ])

  const history = historyRows.reverse().map((m) => ({ role: m.role, content: m.content }))
  const systemPrompt = `${SYSTEM_PROMPT_BASE}\n\nCurrent student status:\n${context}`

  const reply = await groqChat(systemPrompt, history, userMessage)

  await prisma.message.createMany({
    data: [
      { userId, roadmapId, role: 'user', content: userMessage },
      { userId, roadmapId, role: 'assistant', content: reply || "Sorry, I couldn't come up with a reply just now — try asking again." },
    ],
  })

  return reply
}
