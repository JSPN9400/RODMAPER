/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function localDateKey(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
  } catch {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
  }
}

function addDaysKey(key: string, delta: number): string {
  const d = new Date(key + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + delta)
  return d.toISOString().slice(0, 10)
}

// GET /api/stats — real, computed learning stats for the signed-in user:
// current streak, longest streak ever, tasks done today, and all-time done
// count. Replaces what used to be a hardcoded placeholder formula on the
// dashboard (`Math.min(9, active.length + 2)`), which wasn't actually
// tracking anything the user did.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [settings, doneTasks] = await Promise.all([
    prisma.settings.findUnique({ where: { userId: session.user.id } }),
    prisma.task.findMany({
      where: { done: true, doneAt: { not: null }, roadmap: { userId: session.user.id } },
      select: { doneAt: true },
    }),
  ])

  const tz = settings?.timezone || 'Asia/Kolkata'
  const dateKeys = new Set<string>()
  for (const t of doneTasks) {
    if (t.doneAt) dateKeys.add(localDateKey(t.doneAt, tz))
  }

  const todayKey = localDateKey(new Date(), tz)
  const yesterdayKey = addDaysKey(todayKey, -1)

  // Current streak: start from today if it has a completion, otherwise from
  // yesterday (grace period — a streak shouldn't visibly break just because
  // it's still "today" and the user hasn't done today's task yet), then
  // walk backward through consecutive days.
  let streak = 0
  let cursor = dateKeys.has(todayKey) ? todayKey : (dateKeys.has(yesterdayKey) ? yesterdayKey : null)
  while (cursor && dateKeys.has(cursor)) {
    streak++
    cursor = addDaysKey(cursor, -1)
  }

  // Longest streak ever, scanning every completed date.
  const sortedKeys = Array.from(dateKeys).sort()
  let longestStreak = 0
  let run = 0
  let prevKey: string | null = null
  for (const key of sortedKeys) {
    if (prevKey && addDaysKey(prevKey, 1) === key) {
      run++
    } else {
      run = 1
    }
    longestStreak = Math.max(longestStreak, run)
    prevKey = key
  }

  const todayDone = await prisma.task.count({
    where: { done: true, roadmap: { userId: session.user.id }, doneAt: { gte: new Date(todayKey + 'T00:00:00Z') } },
  })
  const totalDone = doneTasks.length

  return NextResponse.json(
    { streak, longestStreak, todayDone, totalDone, activeDays: dateKeys.size },
    { headers: { 'Cache-Control': 'private, max-age=30' } }
  )
}
