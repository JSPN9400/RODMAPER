/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getOrGenerateReflection, listReflections } from '@/lib/reflection'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const reflections = await listReflections(session.user.id)
  return NextResponse.json(reflections)
}

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const reflection = await getOrGenerateReflection(session.user.id)
    return NextResponse.json(reflection)
  } catch (err) {
    console.error('[reflection] generation failed:', err)
    return NextResponse.json({ error: 'Could not generate a reflection right now' }, { status: 502 })
  }
}
