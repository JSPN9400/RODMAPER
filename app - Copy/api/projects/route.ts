/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { roadmapId, name, color, order, startDay, endDay } = body

    if (!roadmapId || !name || startDay === undefined || endDay === undefined) {
      return NextResponse.json({ error: 'roadmapId, name, startDay, and endDay are required' }, { status: 400 })
    }

    const roadmap = await prisma.roadmap.findFirst({
      where: { id: roadmapId, userId: session.user.id }
    })
    if (!roadmap) {
      return NextResponse.json({ error: 'Roadmap not found or unauthorized' }, { status: 404 })
    }

    const created = await prisma.project.create({
      data: {
        roadmapId,
        name,
        color: color || 'blue',
        order: order !== undefined ? parseInt(order) : 0,
        startDay: parseInt(startDay),
        endDay: parseInt(endDay),
      }
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create project' }, { status: 500 })
  }
}
