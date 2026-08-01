/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

import Groq from 'groq-sdk'
import { prisma } from './prisma'

async function callAI(prompt: string, maxTokens = 1500): Promise<string> {
  const hasGroq = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== ''
  if (hasGroq) {
    try {
      const client = new Groq({ apiKey: process.env.GROQ_API_KEY! })
      const res = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: maxTokens,
        temperature: 0.6,
        messages: [{ role: 'user', content: prompt }],
      })
      const text = res.choices[0]?.message?.content
      if (text) return text
    } catch (err) {
      console.warn('[adaptive] Groq failed, trying Gemini:', err)
    }
  }
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('Neither GROQ_API_KEY nor GEMINI_API_KEY is configured')
  const { GoogleGenAI } = require('@google/genai')
  const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } })
  const response = await ai.models.generateContent({ model: 'gemini-3.5-flash', contents: prompt, config: { temperature: 0.6 } })
  return response.text || ''
}

function parseJSON(text: string): any {
  const clean = text.replace(/```json|```/g, '').trim()
  const start = clean.indexOf('{') !== -1 ? clean.indexOf('{') : clean.indexOf('[')
  const end = Math.max(clean.lastIndexOf('}'), clean.lastIndexOf(']'))
  return JSON.parse(clean.slice(start, end + 1))
}

// ---------------------------------------------------------------------
// Dynamic roadmap adjustment ("replan") — when a student has fallen
// meaningfully behind pace, redistribute the *remaining, incomplete*
// tasks across the days actually left, instead of leaving a pile-up of
// overdue items with no realistic path forward. Never touches completed
// tasks or their dates.
// ---------------------------------------------------------------------

export interface ReplanResult {
  updatedCount: number
  droppedCount: number
  note: string
}

export async function replanRemainingTasks(roadmapId: string, userId: string): Promise<ReplanResult> {
  const roadmap = await prisma.roadmap.findFirst({
    where: { id: roadmapId, userId },
    include: { tasks: true },
  })
  if (!roadmap) throw new Error('Roadmap not found')

  const incomplete = roadmap.tasks.filter((t) => !t.done).sort((a, b) => a.day - b.day)
  if (incomplete.length === 0) return { updatedCount: 0, droppedCount: 0, note: 'Nothing left to replan — every task is already done.' }

  const elapsedDays = Math.floor((Date.now() - roadmap.createdAt.getTime()) / 86400000) + 1
  const daysRemaining = Math.max(3, roadmap.totalDays - elapsedDays + 7) // always leave at least a week of runway

  // Continue day numbering after whatever's already completed, instead of
  // restarting at 1 — otherwise a replanned "day 3" could sit alongside an
  // already-completed "day 40," which reads as nonsensical in the UI.
  const doneDays = roadmap.tasks.filter((t) => t.done).map((t) => t.day)
  const startDay = doneDays.length > 0 ? Math.max(...doneDays) + 1 : 1

  const taskList = incomplete.map((t) => ({ id: t.id, title: t.title, currentDay: t.day }))
  const prompt = `A student's learning roadmap has ${taskList.length} remaining (incomplete) tasks, but only about ${daysRemaining} realistic days left before they'd want to reasonably finish. Re-plan the remaining tasks:
- Combine or drop the least essential/lowest-priority tasks if there genuinely isn't room for all of them — better to finish a slightly shorter plan than abandon an overwhelming one.
- Spread what remains evenly and sensibly across day ${startDay} through day ${startDay + daysRemaining - 1} (these are absolute day numbers continuing on from the roadmap's existing numbering — every assigned day must be ${startDay} or higher).
- Keep the most foundational/prerequisite topics early.

Remaining tasks (id, title, original day):
${taskList.map((t) => `${t.id}: "${t.title}" (was day ${t.currentDay})`).join('\n')}

Return ONLY JSON, no markdown: {"assignments":[{"id":"taskid","newDay":${startDay}}],"dropIds":["taskid-if-any-should-be-dropped"],"note":"one encouraging sentence explaining what changed"}`

  const raw = await callAI(prompt, 2000)
  const parsed = parseJSON(raw) as { assignments: { id: string; newDay: number }[]; dropIds?: string[]; note?: string }

  const validIds = new Set(incomplete.map((t) => t.id))
  const assignments = (parsed.assignments || []).filter((a) => validIds.has(a.id) && Number.isFinite(a.newDay) && a.newDay >= startDay)
  const dropIds = (parsed.dropIds || []).filter((id) => validIds.has(id))

  await prisma.$transaction([
    ...assignments.map((a) =>
      prisma.task.update({ where: { id: a.id }, data: { day: Math.round(a.newDay) } })
    ),
    ...(dropIds.length > 0 ? [prisma.task.deleteMany({ where: { id: { in: dropIds } } })] : []),
  ])

  return {
    updatedCount: assignments.length,
    droppedCount: dropIds.length,
    note: parsed.note || 'Replanned the rest of your roadmap around the time you actually have left.',
  }
}

// ---------------------------------------------------------------------
// Personalized revision planning — picks a handful of already-covered
// topics and generates short spaced-revision tasks for them, appended
// after the current last day. Only looks at what the student has
// actually completed, so the revision content matches what they've
// really been taught, not the roadmap's original plan.
// ---------------------------------------------------------------------

export async function generateRevisionTasks(roadmapId: string, userId: string): Promise<{ created: number }> {
  const roadmap = await prisma.roadmap.findFirst({
    where: { id: roadmapId, userId },
    include: { tasks: true },
  })
  if (!roadmap) throw new Error('Roadmap not found')

  const completed = roadmap.tasks.filter((t) => t.done)
  if (completed.length < 3) return { created: 0 }

  const topics = completed.map((t) => t.title).slice(-25) // most recent ~25 covered topics
  const maxDay = Math.max(...roadmap.tasks.map((t) => t.day), 0)
  // Group revision tasks with whichever phase/project the student most
  // recently worked in, so they're findable under a specific tab too, not
  // just the "All Days" catch-all view.
  const mostRecentDone = [...completed].sort((a, b) => (b.doneAt?.getTime() || 0) - (a.doneAt?.getTime() || 0))[0]
  const revisionProjectId = mostRecentDone?.projectId ?? null

  const prompt = `A student has covered these topics in "${roadmap.title}" (${roadmap.goal}):
${topics.map((t) => `- ${t}`).join('\n')}

Pick 3-4 topics that would most benefit from spaced revision right now (mix of foundational topics from a while ago and anything that tends to be forgotten quickly). For each, write a short, specific revision task — a quick recall/practice exercise, not "re-read the topic."

Return ONLY JSON, no markdown: {"revisions":[{"topic":"which topic this revises","title":"short task title","description":"1-2 sentences, a specific exercise"}]}`

  const raw = await callAI(prompt, 900)
  const parsed = parseJSON(raw) as { revisions: { topic: string; title: string; description: string }[] }
  const revisions = (parsed.revisions || []).slice(0, 4)
  if (revisions.length === 0) return { created: 0 }

  await prisma.task.createMany({
    data: revisions.map((r, i) => ({
      roadmapId,
      projectId: revisionProjectId,
      day: maxDay + 1 + i,
      title: `Revision: ${r.title}`,
      description: r.description,
      techStack: [{ name: r.topic, type: 'other' }],
    })),
  })

  return { created: revisions.length }
}
