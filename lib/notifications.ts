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

export async function scheduleReminders() {
  const webpush = getWebPush()
  if (!webpush) return

  const now = new Date()
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay()

  const reminders = await prisma.reminder.findMany({
    where: { time: timeStr, enabled: true, roadmap: { status: 'ACTIVE' } },
    include: {
      roadmap: {
        include: {
          user: true,
          tasks: { where: { done: false }, orderBy: { day: 'asc' }, take: 1 }
        }
      }
    }
  })

  for (const reminder of reminders) {
    const days = reminder.days as number[]
    if (!days.includes(dayOfWeek)) continue
    const roadmap = reminder.roadmap
    const nextTask = roadmap.tasks[0]
    if (!nextTask) continue
    const body = `Day ${nextTask.day}: ${nextTask.title}`
    await sendPushToUser(roadmap.userId, `⏰ Time to learn! — ${roadmap.title}`, body, `/roadmap/${roadmap.id}`)
  }
}
