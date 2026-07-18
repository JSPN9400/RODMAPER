/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

'use client'
import { SessionProvider as NextSessionProvider } from 'next-auth/react'
export default function SessionProvider({ children, session }: { children: React.ReactNode; session: any }) {
  return <NextSessionProvider session={session}>{children}</NextSessionProvider>
}
