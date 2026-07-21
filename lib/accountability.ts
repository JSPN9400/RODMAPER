/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

import Groq from 'groq-sdk'
import { prisma } from './prisma'

const OVERDUE_GRACE_DAYS = 1
const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function localDateKey(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
  } catch {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
  }
}

function localHour(date: Date, timeZone: string): number {
  try {
    const h = new Intl.DateTimeFormat('en-US', { timeZone, hour: '2-digit', hour12: false }).format(date)
    const n = parseInt(h, 10)
    return n === 24 ? 0 : n
  } catch {
    return date.getUTCHours()
  }
}

function formatHour(h: number): string {
  const period = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12} ${period}`
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00Z').getTime()
  const db = new Date(b + 'T00:00:00Z').getTime()
  return Math.round((db - da) / 86400000)
}

export interface AccountabilityStats {
  reliabilityScore: number // % of tasks that "should" be done by now, that actually are
  tasksReachedByNow: number
  tasksOverdue: number
  weekdayPattern: { day: string; count: number }[] // completions grouped by weekday, all-time
  weakestWeekday: string | null
  trend: 'improving' | 'declining' | 'steady' | 'not_enough_data'
  longestGapDays: number // biggest gap between consecutive active days, in days
  hourlyPattern: { hour: number; count: number }[] // completions grouped by hour-of-day (0-23), all-time
  typicalWindow: string | null // readable label for the busiest 3-hour block, e.g. "7 PM – 10 PM"
  todayStatus: 'on_pattern' | 'off_pattern' | 'too_early' | 'not_enough_data' // is today's activity (or lack of it) consistent with the user's own typical timing
  calendarHeatmap: { date: string; count: number }[] // last 84 days, one entry per day, oldest first
}

// Computes reliability + behavior patterns from real Task data — no
// separate tracking table needed, since Task.doneAt and Task.day (plus
// Roadmap.createdAt to establish "expected pace") are enough to derive
// all of this after the fact.
export async function computeAccountability(userId: string): Promise<AccountabilityStats> {
  const settings = await prisma.settings.findUnique({ where: { userId } })
  const tz = settings?.timezone || 'Asia/Kolkata'

  const roadmaps = await prisma.roadmap.findMany({
    where: { userId, status: 'ACTIVE' },
    include: { tasks: true },
  })

  let tasksReachedByNow = 0
  let tasksOverdue = 0
  const doneDates: string[] = []
  const doneTimestamps: Date[] = []

  for (const rm of roadmaps) {
    const elapsedDays = Math.floor((Date.now() - rm.createdAt.getTime()) / 86400000) + 1
    const expectedDay = Math.min(elapsedDays, rm.totalDays)
    for (const t of rm.tasks) {
      if (t.day <= expectedDay) {
        tasksReachedByNow++
        if (!t.done) {
          if (t.day <= expectedDay - OVERDUE_GRACE_DAYS) tasksOverdue++
        }
      }
      if (t.done && t.doneAt) {
        doneDates.push(localDateKey(t.doneAt, tz))
        doneTimestamps.push(t.doneAt)
      }
    }
  }

  const reliabilityScore = tasksReachedByNow > 0
    ? Math.round(((tasksReachedByNow - tasksOverdue) / tasksReachedByNow) * 100)
    : 100

  // Weekday distribution of completions (all-time, across all roadmaps)
  const weekdayCounts = [0, 0, 0, 0, 0, 0, 0]
  for (const key of doneDates) {
    const d = new Date(key + 'T00:00:00Z')
    weekdayCounts[d.getUTCDay()]++
  }
  const weekdayPattern = WEEKDAY_NAMES.map((day, i) => ({ day, count: weekdayCounts[i] }))
  const totalCompletions = doneDates.length
  const weakestWeekday = totalCompletions >= 7
    ? weekdayPattern.reduce((min, cur) => (cur.count < min.count ? cur : min)).day
    : null

  // Trend: completions in the last 7 days vs the 7 days before that
  const uniqueDates = Array.from(new Set(doneDates)).sort()
  const today = localDateKey(new Date(), tz)
  let last7 = 0
  let prev7 = 0
  for (const key of uniqueDates) {
    const diff = daysBetween(key, today)
    if (diff >= 0 && diff < 7) last7++
    else if (diff >= 7 && diff < 14) prev7++
  }
  let trend: AccountabilityStats['trend'] = 'not_enough_data'
  if (uniqueDates.length >= 4) {
    if (last7 > prev7) trend = 'improving'
    else if (last7 < prev7) trend = 'declining'
    else trend = 'steady'
  }

  // Longest gap between consecutive active (completion) days
  let longestGapDays = 0
  for (let i = 1; i < uniqueDates.length; i++) {
    const gap = daysBetween(uniqueDates[i - 1], uniqueDates[i])
    longestGapDays = Math.max(longestGapDays, gap)
  }

  // Hour-of-day distribution — when during the day this user actually
  // does the work, not just which weekday.
  const hourCounts = new Array(24).fill(0)
  for (const ts of doneTimestamps) hourCounts[localHour(ts, tz)]++
  const hourlyPattern = hourCounts.map((count, hour) => ({ hour, count }))

  // Busiest 3-hour rolling window, treated as the user's "typical" study time.
  let typicalWindow: string | null = null
  let bestStartHour = -1
  if (doneTimestamps.length >= 5) {
    let bestSum = -1
    for (let h = 0; h < 24; h++) {
      const sum = hourCounts[h] + hourCounts[(h + 1) % 24] + hourCounts[(h + 2) % 24]
      if (sum > bestSum) {
        bestSum = sum
        bestStartHour = h
      }
    }
    if (bestSum > 0) {
      typicalWindow = `${formatHour(bestStartHour)} – ${formatHour((bestStartHour + 3) % 24)}`
    }
  }

  // Is today's activity (or the current lack of it) consistent with how
  // this user normally behaves? Gives a plain answer to "am I on my usual
  // schedule right now" rather than just a historical chart.
  let todayStatus: AccountabilityStats['todayStatus'] = 'not_enough_data'
  if (bestStartHour >= 0) {
    const nowHour = localHour(new Date(), tz)
    const doneToday = doneDates.filter((d) => d === today).length > 0
    if (doneToday) {
      todayStatus = 'on_pattern'
    } else {
      // How many hours (wrapping midnight) is "now" past the start of the
      // typical window? If we're not there yet, it's simply too early to
      // call it off-pattern.
      const hoursPastWindowStart = (nowHour - bestStartHour + 24) % 24
      todayStatus = hoursPastWindowStart <= 3 ? 'too_early' : 'off_pattern'
    }
  }

  // Calendar heatmap — last 12 weeks, oldest first, for a GitHub-style view.
  const heatmapDays = 84
  const dateCounts = new Map<string, number>()
  for (const key of doneDates) dateCounts.set(key, (dateCounts.get(key) || 0) + 1)
  const calendarHeatmap: { date: string; count: number }[] = []
  for (let i = heatmapDays - 1; i >= 0; i--) {
    const key = localDateKey(new Date(Date.now() - i * 86400000), tz)
    calendarHeatmap.push({ date: key, count: dateCounts.get(key) || 0 })
  }

  return {
    reliabilityScore, tasksReachedByNow, tasksOverdue, weekdayPattern, weakestWeekday,
    trend, longestGapDays, hourlyPattern, typicalWindow, todayStatus, calendarHeatmap,
  }
}

function ruleBasedChallenge(stats: AccountabilityStats, overdueTitle: string | null): { title: string; description: string } {
  if (overdueTitle) {
    return {
      title: `Get back to "${overdueTitle}"`,
      description: `This one's been sitting for a bit — no pressure, just pick it back up today. Even 15 focused minutes counts.`,
    }
  }
  return {
    title: 'Do one thing today',
    description: `Your streak reset recently. Pick any one task from an active roadmap and check it off — starting is the only hard part.`,
  }
}

async function geminiChallenge(prompt: string): Promise<{ title: string; description: string } | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null
  try {
    const { GoogleGenAI } = require('@google/genai')
    const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } })
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: { temperature: 0.9 },
    })
    const text = (response.text || '').replace(/```json|```/g, '').trim()
    return JSON.parse(text)
  } catch (err) {
    console.warn('[accountability] Gemini challenge generation also failed, using rule-based fallback:', err)
    return null
  }
}

async function aiChallenge(stats: AccountabilityStats, overdueTitle: string | null): Promise<{ title: string; description: string } | null> {
  const hasGroq = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== ''
  const prompt = `A student using a learning-roadmap app has fallen behind pace (reliability score ${stats.reliabilityScore}/100, ${stats.tasksOverdue} tasks overdue${overdueTitle ? `, most pressing: "${overdueTitle}"` : ''}). Write ONE small, achievable "recovery challenge" to nudge them back on track today. Tone: warm, encouraging, zero shame or guilt-tripping — like a good friend, not a scold. Return ONLY JSON, no markdown: {"title":"short punchy title, under 8 words","description":"1-2 encouraging sentences, specific and doable today"}`

  if (hasGroq) {
    try {
      const client = new Groq({ apiKey: process.env.GROQ_API_KEY! })
      const res = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 200,
        temperature: 0.9,
        messages: [{ role: 'user', content: prompt }],
      })
      const text = (res.choices[0]?.message?.content || '').replace(/```json|```/g, '').trim()
      return JSON.parse(text)
    } catch (err) {
      console.warn('[accountability] Groq challenge generation failed, trying Gemini:', err)
      return geminiChallenge(prompt)
    }
  }
  return geminiChallenge(prompt)
}

// Returns the user's current active (incomplete) challenge, generating a
// new one if none exists and the accountability signals warrant it.
// Deliberately conservative about creating new challenges — only one
// active at a time, and only when there's a real signal (meaningfully
// overdue, or a streak that just broke), not on every dashboard load.
export async function getOrCreateChallenge(userId: string) {
  const existing = await prisma.challenge.findFirst({
    where: { userId, completed: false },
    orderBy: { createdAt: 'desc' },
  })
  if (existing) return existing

  const stats = await computeAccountability(userId)
  const streakIsZero = await isStreakZeroAfterProgress(userId)

  const shouldChallenge = stats.tasksOverdue >= 2 || streakIsZero
  if (!shouldChallenge) return null

  const mostOverdue = await mostOverdueTask(userId)
  const generated = (await aiChallenge(stats, mostOverdue?.title || null)) || ruleBasedChallenge(stats, mostOverdue?.title || null)

  return prisma.challenge.create({
    data: {
      userId,
      roadmapId: mostOverdue?.roadmapId || null,
      title: generated.title,
      description: generated.description,
      type: stats.tasksOverdue >= 2 ? 'catchup' : 'streak_save',
    },
  })
}

async function isStreakZeroAfterProgress(userId: string): Promise<boolean> {
  const anyDone = await prisma.task.findFirst({ where: { done: true, roadmap: { userId } } })
  if (!anyDone) return false
  const settings = await prisma.settings.findUnique({ where: { userId } })
  const tz = settings?.timezone || 'Asia/Kolkata'
  const todayKey = localDateKey(new Date(), tz)
  const yesterdayKey = localDateKey(new Date(Date.now() - 86400000), tz)
  const recentDone = await prisma.task.findFirst({
    where: { done: true, roadmap: { userId }, doneAt: { gte: new Date(yesterdayKey + 'T00:00:00Z') } },
  })
  return !recentDone
}

async function mostOverdueTask(userId: string) {
  const roadmaps = await prisma.roadmap.findMany({ where: { userId, status: 'ACTIVE' }, include: { tasks: true } })
  let worst: { title: string; day: number; roadmapId: string; daysBehind: number } | null = null
  for (const rm of roadmaps) {
    const elapsedDays = Math.floor((Date.now() - rm.createdAt.getTime()) / 86400000) + 1
    const expectedDay = Math.min(elapsedDays, rm.totalDays)
    for (const t of rm.tasks) {
      if (!t.done && t.day <= expectedDay - OVERDUE_GRACE_DAYS) {
        const daysBehind = expectedDay - t.day
        if (!worst || daysBehind > worst.daysBehind) {
          worst = { title: t.title, day: t.day, roadmapId: rm.id, daysBehind }
        }
      }
    }
  }
  return worst
}
