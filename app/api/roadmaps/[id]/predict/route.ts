/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { predictCompletion } from '@/lib/predictions'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const prediction = await predictCompletion(id, session.user.id)
  if (!prediction) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(prediction, { headers: { 'Cache-Control': 'private, max-age=60' } })
}
