/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 *
 * Service worker for Web Push. Registered from app/lib/push-client.ts.
 * Handles two things: an incoming push message (show a notification) and a
 * click on that notification (focus/open the app at the reminder's roadmap).
 */

self.addEventListener('push', function (event) {
  let data = { title: 'RoadMaper', body: 'You have a reminder.', url: '/today' }
  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch (e) {
    // Non-JSON push payload — fall back to the defaults above.
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url || '/today' },
    })
  )
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/today'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})
