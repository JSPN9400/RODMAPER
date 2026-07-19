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
      if (t.done && t.doneAt) doneDates.push(localDateKey(t.doneAt, tz))
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

  return { reliabilityScore, tasksReachedByNow, tasksOverdue, weekdayPattern, weakestWeekday, trend, longestGapDays }
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

async function aiChallenge(stats: AccountabilityStats, overdueTitle: string | null): Promise<{ title: string; description: string } | null> {
  const hasGroq = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== ''
  const prompt = `A student using a learning-roadmap app has fallen behind pace (reliability score ${stats.reliabilityScore}/100, ${stats.tasksOverdue} tasks overdue${overdueTitle ? `, most pressing: "${overdueTitle}"` : ''}). Write ONE small, achievable "recovery challenge" to nudge them back on track today. Tone: warm, encouraging, zero shame or guilt-tripping — like a good friend, not a scold. Return ONLY JSON, no markdown: {"title":"short punchy title, under 8 words","description":"1-2 encouraging sentences, specific and doable today"}`

  try {
    if (hasGroq) {
      const client = new Groq({ apiKey: process.env.GROQ_API_KEY! })
      const res = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 200,
        temperature: 0.9,
        messages: [{ role: 'user', content: prompt }],
      })
      const text = (res.choices[0]?.message?.content || '').replace(/```json|```/g, '').trim()
      return JSON.parse(text)
    }
  } catch (err) {
    console.warn('[accountability] AI challenge generation failed, using rule-based fallback:', err)
  }
  return null
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
