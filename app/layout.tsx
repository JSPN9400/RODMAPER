/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

import type { Metadata } from 'next'
import './globals.css'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Sidebar from '@/components/ui/Sidebar'
import SessionProvider from '@/components/ui/SessionProvider'

export const metadata: Metadata = {
  title: 'RoadMaper — AI Learning System',
  description: 'Build personalized learning roadmaps for any subject, skill or exam.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#000000" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body suppressHydrationWarning>
        <SessionProvider session={session}>
          {session ? (
            <div style={{ display: 'flex', minHeight: '100vh' }}>
              <Sidebar user={session.user} />
              <main className="page-shell" style={{
                flex: 1, marginLeft: '220px',
                minHeight: '100vh', background: 'var(--bg)'
              }}>
                {children}
              </main>
            </div>
          ) : (
            <main>{children}</main>
          )}
        </SessionProvider>
      </body>
    </html>
  )
}
