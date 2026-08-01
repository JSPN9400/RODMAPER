/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

import Groq from 'groq-sdk'
import { prisma } from './prisma'

function localDateKey(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
  } catch {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
  }
}

// Monday of the week containing `date`, as a date key in the given timezone.
function weekStartKey(date: Date, timeZone: string): string {
  const key = localDateKey(date, timeZone)
  const d = new Date(key + 'T00:00:00Z')
  const dow = d.getUTCDay() // 0=Sun..6=Sat
  const diffToMonday = dow === 0 ? -6 : 1 - dow
  d.setUTCDate(d.getUTCDate() + diffToMonday)
  return d.toISOString().slice(0, 10)
}

async function aiReflection(stats: any): Promise<string> {
  const prompt = `Write a short, warm weekly reflection for a student using a learning-roadmap app, based on this week's real activity data:
- Tasks completed: ${stats.tasksDone}
- Active days: ${stats.activeDays}/7
- Roadmaps touched: ${stats.roadmapsTouched}
- Skills practiced: ${stats.skillsTouched.join(', ') || 'none logged'}
- Current streak: ${stats.streak} days
- Compared to the previous week: ${stats.vsLastWeek}

Write 2 short paragraphs: first, what actually happened this week (specific, using the numbers above, not generic praise). Second, one concrete, encouraging note about next week — a suggestion, not a demand. Plain language, like a mentor who's actually looked at the data, not a template. No headers, no bullet points, no markdown.`

  const hasGroq = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== ''
  try {
    if (hasGroq) {
      const client = new Groq({ apiKey: process.env.GROQ_API_KEY! })
      const res = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 350,
        temperature: 0.8,
        messages: [{ role: 'user', content: prompt }],
      })
      const text = (res.choices[0]?.message?.content || '').trim()
      if (text) return text
    }
  } catch (err) {
    console.warn('[reflection] Groq failed, trying Gemini:', err)
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (apiKey) {
    try {
      const { GoogleGenAI } = require('@google/genai')
      const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } })
      const response = await ai.models.generateContent({ model: 'gemini-3.5-flash', contents: prompt, config: { temperature: 0.8 } })
      const text = (response.text || '').trim()
      if (text) return text
    } catch (err) {
      console.warn('[reflection] Gemini also failed:', err)
    }
  }

  // Rule-based fallback so the feature still works with no AI provider configured.
  return `This week you completed ${stats.tasksDone} task${stats.tasksDone === 1 ? '' : 's'} across ${stats.roadmapsTouched} roadmap${stats.roadmapsTouched === 1 ? '' : 's'}, active on ${stats.activeDays} of the last 7 days. ${stats.vsLastWeek}\n\nKeep going — consistency compounds more than intensity does. Pick one thing to focus on next week rather than trying to catch up on everything at once.`
}

// Generates (or returns the cached) reflection for the week containing
// `forDate` (defaults to now). Caches per (user, weekStart) so revisiting
// the same week doesn't call the AI again or lose the original text.
export async function getOrGenerateReflection(userId: string, forDate: Date = new Date()) {
  const settings = await prisma.settings.findUnique({ where: { userId } })
  const tz = settings?.timezone || 'Asia/Kolkata'
  const weekStart = weekStartKey(forDate, tz)

  const existing = await prisma.reflection.findUnique({ where: { userId_weekStart: { userId, weekStart } } })
  if (existing) return existing

  const weekStartDate = new Date(weekStart + 'T00:00:00Z')
  const weekEndDate = new Date(weekStartDate.getTime() + 7 * 86400000)
  const prevWeekStartDate = new Date(weekStartDate.getTime() - 7 * 86400000)

  const [thisWeekTasks, prevWeekTasks] = await Promise.all([
    prisma.task.findMany({
      where: { done: true, doneAt: { gte: weekStartDate, lt: weekEndDate }, roadmap: { userId } },
      select: { doneAt: true, roadmapId: true, techStack: true },
    }),
    prisma.task.count({
      where: { done: true, doneAt: { gte: prevWeekStartDate, lt: weekStartDate }, roadmap: { userId } },
    }),
  ])

  const activeDays = new Set(thisWeekTasks.map((t) => localDateKey(t.doneAt!, tz))).size
  const roadmapsTouched = new Set(thisWeekTasks.map((t) => t.roadmapId)).size
  const skillsTouched = Array.from(new Set(
    thisWeekTasks.flatMap((t) => ((t.techStack as any[]) || []).map((s) => s?.name).filter(Boolean))
  )).slice(0, 8)

  const diff = thisWeekTasks.length - prevWeekTasks
  const vsLastWeek = prevWeekTasks === 0
    ? "No comparison yet — this is the first week with real activity."
    : diff > 0
      ? `That's ${diff} more than last week.`
      : diff < 0
        ? `That's ${Math.abs(diff)} fewer than last week — worth noticing, not worth panicking over.`
        : "That's the same pace as last week."

  // Current streak — reuse the same logic as /api/stats for consistency,
  // duplicated minimally here rather than importing to avoid pulling in
  // the full stats route's unrelated aggregation.
  const allDone = await prisma.task.findMany({ where: { done: true, doneAt: { not: null }, roadmap: { userId } }, select: { doneAt: true } })
  const dateKeys = new Set(allDone.map((t) => localDateKey(t.doneAt!, tz)))
  const todayKey = localDateKey(new Date(), tz)
  function addDays(key: string, delta: number) {
    const d = new Date(key + 'T00:00:00Z')
    d.setUTCDate(d.getUTCDate() + delta)
    return d.toISOString().slice(0, 10)
  }
  let streak = 0
  let cursor: string | null = dateKeys.has(todayKey) ? todayKey : (dateKeys.has(addDays(todayKey, -1)) ? addDays(todayKey, -1) : null)
  while (cursor && dateKeys.has(cursor)) { streak++; cursor = addDays(cursor, -1) }

  const stats = { tasksDone: thisWeekTasks.length, activeDays, roadmapsTouched, skillsTouched, streak, vsLastWeek }
  const content = await aiReflection(stats)

  return prisma.reflection.create({ data: { userId, weekStart, content, stats } })
}

export async function listReflections(userId: string, take = 12) {
  return prisma.reflection.findMany({ where: { userId }, orderBy: { weekStart: 'desc' }, take })
}
