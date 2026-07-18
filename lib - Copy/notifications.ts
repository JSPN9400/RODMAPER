/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

// lib/notifications.ts
import { prisma } from './prisma'

// Lazy initialize web-push only if VAPID keys are set
function getWebPush() {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return null
  }
  const webpush = require('web-push')
  webpush.setVapidDetails(
    'mailto:' + (process.env.VAPID_EMAIL || 'admin@roadmaper.com'),
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
  return webpush
}

export async function sendPushToUser(userId: string, title: string, body: string, url = '/today') {
  const webpush = getWebPush()
  if (!webpush) return 0

  const subs = await prisma.pushSubscription.findMany({ where: { userId } })
  const payload = JSON.stringify({ title, body, icon: '/icon-192.png', url, timestamp: Date.now() })

  const results = await Promise.allSettled(
    subs.map((sub: any) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  )

  const failed = results
    .map((r: any, i: number) => ({ r, sub: subs[i] }))
    .filter(({ r }: any) => r.status === 'rejected')

  for (const { sub } of failed) {
    await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
  }

  return results.filter((r: any) => r.status === 'fulfilled').length
}

// Returns { hh, mm, dayOfWeek } for "now" in the given IANA timezone.
// dayOfWeek is 1=Monday..7=Sunday, matching Reminder.days' convention.
function getLocalTimeParts(timeZone: string) {
  const now = new Date()
  let parts: Intl.DateTimeFormatPart[]
  try {
    parts = new Intl.DateTimeFormat('en-US', {
      timeZone, hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short',
    }).formatToParts(now)
  } catch {
    // Invalid/unknown timezone string stored for a user — fall back to UTC
    // rather than throwing and skipping every reminder for every other user.
    parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC', hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short',
    }).formatToParts(now)
  }
  const map: Record<string, string> = {}
  for (const p of parts) map[p.type] = p.value
  const weekdayMap: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }
  // Intl can format midnight as "24" in the `hour: '2-digit', hour12: false`
  // combination depending on runtime; normalize that back to 0.
  const hh = map.hour === '24' ? 0 : parseInt(map.hour, 10)
  return { hh, mm: parseInt(map.minute, 10), dayOfWeek: weekdayMap[map.weekday] || 1 }
}

// Sends a push notification for every enabled reminder whose configured
// local time (in the reminder's user's own timezone) falls within the last
// `windowMinutes` minutes. Call this on a schedule — see
// app/api/cron/reminders/route.ts and the GitHub Actions / vercel.json cron
// that hit it. windowMinutes should match (or exceed) how often the cron
// actually runs, so every reminder gets exactly one matching run per day.
export async function scheduleReminders(windowMinutes = 5) {
  const webpush = getWebPush()
  if (!webpush) return { sent: 0, checked: 0, skipped: 'VAPID keys not configured' }

  const reminders = await prisma.reminder.findMany({
    where: { enabled: true, roadmap: { status: 'ACTIVE' } },
    include: {
      roadmap: {
        include: {
          user: { include: { settings: true } },
          tasks: { where: { done: false }, orderBy: { day: 'asc' }, take: 1 },
        },
      },
    },
  })

  let sent = 0
  for (const reminder of reminders) {
    const roadmap = reminder.roadmap
    const tz = roadmap.user.settings?.timezone || 'Asia/Kolkata'
    const local = getLocalTimeParts(tz)

    const days = reminder.days as number[]
    if (!Array.isArray(days) || !days.includes(local.dayOfWeek)) continue

    const [rh, rm] = reminder.time.split(':').map((n) => parseInt(n, 10))
    if (Number.isNaN(rh) || Number.isNaN(rm)) continue

    const reminderMinutes = rh * 60 + rm
    const nowMinutes = local.hh * 60 + local.mm
    // How many minutes ago (within the same day, wrapping midnight) was the
    // reminder due? 0 = due exactly now, windowMinutes = due one cron cycle ago.
    const diff = (nowMinutes - reminderMinutes + 1440) % 1440
    if (diff >= windowMinutes) continue

    const nextTask = roadmap.tasks[0]
    if (!nextTask) continue

    const body = reminder.message || `Day ${nextTask.day}: ${nextTask.title}`
    await sendPushToUser(roadmap.userId, `⏰ Time to learn! — ${roadmap.title}`, body, `/roadmap/${roadmap.id}`)
    sent++
  }

  return { sent, checked: reminders.length }
}
