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

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const roadmaps = await prisma.roadmap.findMany({
    where: { userId: session.user.id, status: 'ACTIVE' },
    include: { projects: true, tasks: { orderBy: { day: 'asc' } } }
  })

  const items = roadmaps.map(rm => {
    const done = rm.tasks.filter(t => t.done).length
    const total = rm.tasks.length
    const nextTask = rm.tasks.find(t => !t.done)
    const project = nextTask ? rm.projects.find(p => p.id === nextTask.projectId) : null

    return {
      roadmapId: rm.id,
      roadmapTitle: rm.title,
      roadmapColor: rm.color,
      totalDone: done,
      totalTasks: total,
      progressPct: total > 0 ? Math.round((done / total) * 100) : 0,
      nextTask: nextTask ? {
        id: nextTask.id,
        day: nextTask.day,
        title: nextTask.title,
        description: nextTask.description,
        techStack: nextTask.techStack,
        resources: nextTask.resources,
        done: nextTask.done,
        projectName: project?.name || null,
        projectColor: project?.color || null,
      } : null
    }
  })

  return NextResponse.json(items, {
    headers: { 'Cache-Control': 'private, max-age=10' }
  })
}
