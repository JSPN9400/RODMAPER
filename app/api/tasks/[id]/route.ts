// app/api/tasks/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateReport } from '@/lib/report-generator'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Verify ownership
  const task = await prisma.task.findFirst({
    where: { id: params.id, roadmap: { userId: session.user.id } },
    include: { roadmap: { select: { id: true, totalDays: true } } }
  })
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.task.update({
    where: { id: params.id },
    data: {
      ...(body.done !== undefined && {
        done: body.done,
        doneAt: body.done ? new Date() : null
      }),
      ...(body.notes !== undefined && { notes: body.notes }),
    }
  })

  // Check if all tasks done → auto-generate report
  const allTasks = await prisma.task.findMany({
    where: { roadmapId: task.roadmap.id }
  })
  const allDone = allTasks.every(t => t.id === params.id ? body.done : t.done)
  if (allDone) {
    await generateReport(task.roadmap.id).catch(console.error)
    await prisma.roadmap.update({
      where: { id: task.roadmap.id },
      data: { status: 'COMPLETED', completedAt: new Date() }
    })
  }

  return NextResponse.json(updated)
}
