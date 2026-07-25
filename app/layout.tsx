/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

import type { Metadata } from 'next'
import { Manrope, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Sidebar from '@/components/ui/Sidebar'
import SessionProvider from '@/components/ui/SessionProvider'
import PageTransition from '@/components/ui/PageTransition'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  weight: ['600', '700', '800'],
  display: 'swap',
})
const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  variable: '--font-plex-sans',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-plex-mono',
  weight: ['400', '500', '600'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'RoadMaper — AI Learning System',
  description: 'Build personalized learning roadmaps for any subject, skill or exam.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  return (
    <html lang="en" suppressHydrationWarning className={`${manrope.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <head>
        <meta name="theme-color" content="#000000" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {/* Runs before paint so the correct theme is set immediately —
            avoids a flash of dark theme for users who picked light. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('rm-theme');if(t==='light'){document.documentElement.setAttribute('data-theme','light');}}catch(e){}})();`,
          }}
        />
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
                <PageTransition>{children}</PageTransition>
              </main>
            </div>
          ) : (
            <main>
              <PageTransition>{children}</PageTransition>
            </main>
          )}
        </SessionProvider>
      </body>
    </html>
  )
}
