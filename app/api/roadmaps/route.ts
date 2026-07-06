// app/api/roadmaps/route.ts
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { privateJson } from '@/lib/api-response'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/roadmaps - get all roadmaps for user
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return privateJson({ error: 'Unauthorized' }, { status: 401 })

  const roadmaps = await prisma.roadmap.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      title: true,
      goal: true,
      description: true,
      totalDays: true,
      roadmapType: true,
      targetDate: true,
      status: true,
      createdBy: true,
      color: true,
      createdAt: true,
      updatedAt: true,
      completedAt: true,
      reminders: true,
      report: { select: { completionRate: true, completedDays: true } },
      _count: { select: { tasks: true } },
    },
    orderBy: { updatedAt: 'desc' }
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
        roadmapId: true,
        title: true,
        day: true,
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

  return privateJson(
    roadmaps.map((roadmap) => ({
      ...roadmap,
      doneCount: doneCountMap.get(roadmap.id) || 0,
      nextTaskTitle: nextTaskMap.get(roadmap.id)?.title || null,
      nextTaskDay: nextTaskMap.get(roadmap.id)?.day || null,
    }))
  )
}

// POST /api/roadmaps - save a pre-generated/manual roadmap
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return privateJson({ error: 'Unauthorized' }, { status: 401 })

  const data = await req.json()

  const roadmap = await prisma.roadmap.create({
    data: {
      userId: session.user.id,
      title: data.title,
      goal: data.goal,
      description: data.description,
      totalDays: data.totalDays || 30,
      roadmapType: data.roadmapType || 'SHORT_TERM',
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
      color: data.color || 'violet',
      createdBy: data.createdBy || 'MANUAL',
      phases: data.phases?.length
        ? {
            create: data.phases.map((phase: any) => ({
              name: phase.name,
              order: phase.order,
              startWeek: phase.startWeek,
              endWeek: phase.endWeek,
              milestones: phase.milestones || [],
              topics: phase.topics || [],
            })),
          }
        : undefined,
      projects: {
        create: (data.projects || []).map((project: any, index: number) => ({
          name: project.name,
          color: project.color || 'blue',
          order: index,
          startDay: project.startDay,
          endDay: project.endDay,
        })),
      },
    },
    include: { projects: true },
  })

  if (data.tasks?.length) {
    await prisma.task.createMany({
      data: data.tasks.map((task: any) => ({
        roadmapId: roadmap.id,
        projectId: roadmap.projects[task.projectIndex || 0]?.id || null,
        day: task.day,
        title: task.title,
        description: task.description || '',
        techStack: task.techStack || [],
        resources: task.resources || [],
      })),
    })
  }

  await prisma.reminder.create({
    data: {
      roadmapId: roadmap.id,
      time: '09:00',
      enabled: true,
      days: [1, 2, 3, 4, 5, 6, 7],
    },
  })

  const full = await prisma.roadmap.findUnique({
    where: { id: roadmap.id },
    include: { phases: true, projects: true, tasks: true, reminders: true },
  })

  return privateJson(full, { status: 201 })
}
