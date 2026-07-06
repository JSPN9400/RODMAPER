// app/api/today/route.ts
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { privateJson } from '@/lib/api-response'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return privateJson({ error: 'Unauthorized' }, { status: 401 }, 10)

  const roadmaps = await prisma.roadmap.findMany({
    where: { userId: session.user.id, status: 'ACTIVE' },
    select: {
      id: true,
      title: true,
      color: true,
      projects: {
        select: { id: true, name: true, color: true },
      },
      _count: {
        select: { tasks: true },
      },
    },
  })

  const roadmapIds = roadmaps.map((roadmap) => roadmap.id)
  const [doneCounts, nextTasks] = await Promise.all([
    prisma.task.groupBy({
      by: ['roadmapId'],
      where: {
        roadmapId: { in: roadmapIds },
        done: true,
      },
      _count: { _all: true },
    }),
    prisma.task.findMany({
      where: {
        roadmapId: { in: roadmapIds },
        done: false,
      },
      select: {
        id: true,
        roadmapId: true,
        projectId: true,
        day: true,
        title: true,
        description: true,
        techStack: true,
        resources: true,
        done: true,
      },
      orderBy: [
        { roadmapId: 'asc' },
        { day: 'asc' },
      ],
      distinct: ['roadmapId'],
    }),
  ])

  const doneCountMap = new Map(doneCounts.map((item) => [item.roadmapId, item._count._all]))
  const nextTaskMap = new Map(nextTasks.map((task) => [task.roadmapId, task]))

  const todayItems = roadmaps.map((roadmap) => {
    const nextTask = nextTaskMap.get(roadmap.id) || null
    const totalDone = doneCountMap.get(roadmap.id) || 0
    const totalTasks = roadmap._count.tasks
    const project = nextTask
      ? roadmap.projects.find((item) => item.id === nextTask.projectId)
      : null

    return {
      roadmapId: roadmap.id,
      roadmapTitle: roadmap.title,
      roadmapColor: roadmap.color,
      totalDone,
      totalTasks,
      progressPct: totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0,
      nextTask: nextTask ? {
        ...nextTask,
        projectName: project?.name || null,
        projectColor: project?.color || null,
      } : null,
    }
  })

  return privateJson(todayItems, {}, 10)
}
