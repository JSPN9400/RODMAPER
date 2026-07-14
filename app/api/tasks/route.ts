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
    const { roadmapId, projectId, day, title, description, techStack, resources } = body

    if (!roadmapId || !title || day === undefined) {
      return NextResponse.json({ error: 'roadmapId, title, and day are required' }, { status: 400 })
    }

    // Verify roadmap ownership
    const roadmap = await prisma.roadmap.findFirst({
      where: { id: roadmapId, userId: session.user.id }
    })
    if (!roadmap) {
      return NextResponse.json({ error: 'Roadmap not found or unauthorized' }, { status: 404 })
    }

    const created = await prisma.task.create({
      data: {
        roadmapId,
        projectId: projectId || null,
        day: parseInt(day),
        title,
        description: description || '',
        techStack: techStack || [],
        resources: resources || [],
      }
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create task' }, { status: 500 })
  }
}
