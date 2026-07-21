/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateClarifyingQuestions } from '@/lib/roadmap-generator'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const goal = (body.goal || '').trim()
  if (!goal) return NextResponse.json({ error: 'goal is required' }, { status: 400 })

  const questions = await generateClarifyingQuestions(goal, body.background || '')
  return NextResponse.json({ questions })
}
