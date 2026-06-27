// lib/notifications.ts
import webpush from 'web-push'
import { prisma } from './prisma'

webpush.setVapidDetails(
  'mailto:' + (process.env.VAPID_EMAIL || 'admin@roadmaper.com'),
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function sendPushToUser(userId: string, title: string, body: string, url = '/today') {
  const subs = await prisma.pushSubscription.findMany({ where: { userId } })

  const payload = JSON.stringify({
    title,
    body,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    url,
    timestamp: Date.now()
  })

  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  )

  // Remove expired subscriptions
  const failed = results
    .map((r, i) => ({ r, sub: subs[i] }))
    .filter(({ r }) => r.status === 'rejected')

  for (const { sub } of failed) {
    await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
  }

  return results.filter(r => r.status === 'fulfilled').length
}

export async function scheduleReminders() {
  // Called by cron job — find all active reminders for current time
  const now = new Date()
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay() // 1=Mon, 7=Sun

  const reminders = await prisma.reminder.findMany({
    where: {
      time: timeStr,
      enabled: true,
      roadmap: { status: 'ACTIVE' }
    },
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

    const body = nextTask
      ? `Day ${nextTask.day}: ${nextTask.title} — ${nextTask.description || ''}`
      : `Keep going on ${roadmap.title}!`

    await sendPushToUser(
      roadmap.userId,
      `⏰ Time to learn! — ${roadmap.title}`,
      body,
      `/roadmap/${roadmap.id}`
    )
  }
}

export function generateVapidKeys() {
  return webpush.generateVAPIDKeys()
}
