// app/api/today/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get all active roadmaps
  const roadmaps = await prisma.roadmap.findMany({
    where: { userId: session.user.id, status: 'ACTIVE' },
    include: {
      tasks: { orderBy: { day: 'asc' } },
      projects: true
    }
  })

  const todayItems = roadmaps.map(rm => {
    // Find the next undone task (today's task)
    const nextTask = rm.tasks.find(t => !t.done)
    const totalDone = rm.tasks.filter(t => t.done).length
    const totalTasks = rm.tasks.length
    const project = nextTask
      ? rm.projects.find(p => p.id === nextTask.projectId)
      : null

    return {
      roadmapId: rm.id,
      roadmapTitle: rm.title,
      roadmapColor: rm.color,
      totalDone,
      totalTasks,
      progressPct: totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0,
      nextTask: nextTask ? {
        id: nextTask.id,
        day: nextTask.day,
        title: nextTask.title,
        description: nextTask.description,
        techStack: nextTask.techStack,
        resources: nextTask.resources,
        done: nextTask.done,
        projectName: project?.name || null,
        projectColor: project?.color || null
      } : null
    }
  })

  return NextResponse.json(todayItems)
}
