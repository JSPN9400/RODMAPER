/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import LandingPage from './home/page'
import MarketingLayout from '@/components/marketing/MarketingLayout'

export default async function RootPage() {
  const session = await getServerSession(authOptions)
  if (session) redirect('/dashboard')
  
  return (
    <MarketingLayout>
      <LandingPage />
    </MarketingLayout>
  )
}
