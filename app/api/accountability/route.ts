/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { computeAccountability, getOrCreateChallenge } from '@/lib/accountability'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [stats, challenge] = await Promise.all([
    computeAccountability(session.user.id),
    getOrCreateChallenge(session.user.id),
  ])

  return NextResponse.json(
    { ...stats, challenge },
    { headers: { 'Cache-Control': 'private, max-age=30' } }
  )
}
