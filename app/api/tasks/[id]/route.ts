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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const task = await prisma.task.findFirst({
    where: { id, roadmap: { userId: session.user.id } },
    include: { roadmap: { select: { id: true } } }
  })
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...(body.done !== undefined && { done: body.done, doneAt: body.done ? new Date() : null }),
      ...(body.notes !== undefined && { notes: body.notes }),
    }
  })

  // Check if all done → mark roadmap completed
  const allTasks = await prisma.task.findMany({ where: { roadmapId: task.roadmap.id } })
  const allDone = allTasks.every(t => t.id === id ? body.done : t.done)
  if (allDone) {
    await prisma.roadmap.update({
      where: { id: task.roadmap.id },
      data: { status: 'COMPLETED', completedAt: new Date() }
    })
  }

  return NextResponse.json(updated)
}
