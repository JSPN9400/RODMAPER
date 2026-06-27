import type { Metadata } from 'next'
import './globals.css'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Sidebar from '@/components/ui/Sidebar'
import SessionProvider from '@/components/ui/SessionProvider'

export const metadata: Metadata = {
  title: 'RoadMaper — AI Learning System',
  description: 'Build personalized learning roadmaps, track daily progress, land your dream role',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <meta name="theme-color" content="#09090b" />
      </head>
      <body>
        <SessionProvider session={session}>
          {session ? (
            <div style={{ display: 'flex', minHeight: '100vh' }}>
              <Sidebar user={session.user} />
              <main style={{ flex: 1, marginLeft: '220px', minHeight: '100vh', overflowY: 'auto', background: 'var(--bg)' }}>
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
