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

// GET /api/roadmaps — list the signed-in user's roadmaps for the dashboard.
// Roadmap creation happens via POST /api/roadmaps/generate (see that route
// for the current AI generation flow). The old POST handler that used to
// live here (manual + legacy "mode: 'ai'" creation via lib/ai-generator.ts)
// was unused by the frontend and has been removed to avoid drift between
// this file and the schema/generator that's actually wired up.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const roadmaps = await prisma.roadmap.findMany({
    where: { userId: session.user.id },
    include: {
      projects: { orderBy: { order: 'asc' } },
      reminders: true,
      _count: { select: { tasks: true } },
    },
    orderBy: { updatedAt: 'desc' }
  })

  // Add doneCount and nextTask for each roadmap efficiently
  const enriched = await Promise.all(roadmaps.map(async rm => {
    const doneCount = await prisma.task.count({ where: { roadmapId: rm.id, done: true } })
    const nextTask = await prisma.task.findFirst({
      where: { roadmapId: rm.id, done: false },
      orderBy: { day: 'asc' },
      select: { day: true, title: true }
    })
    return {
      ...rm,
      doneCount,
      nextTaskDay: nextTask?.day,
      nextTaskTitle: nextTask?.title,
    }
  }))

  return NextResponse.json(enriched, {
    headers: { 'Cache-Control': 'private, max-age=30' }
  })
}
