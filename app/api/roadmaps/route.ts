import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateRoadmapWithAI } from '@/lib/ai-generator'

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

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { mode, ...data } = body

  if (mode === 'ai') {
    try {
      const generated = await generateRoadmapWithAI({
        goal: data.goal,
        background: data.background,
        days: data.days || 30,
        hoursPerDay: data.hoursPerDay || 4,
        focusAreas: data.focusAreas,
        currentLevel: data.currentLevel || 'beginner',
        goalType: data.goalType || 'short_term',
      })

      const roadmap = await prisma.roadmap.create({
        data: {
          userId: session.user.id,
          title: generated.title,
          goal: generated.goal,
          description: generated.description,
          totalDays: generated.days,
          createdBy: 'AI',
          color: data.color || 'violet',
          roadmapType: data.goalType === 'long_term' ? 'LONG_TERM' : 'SHORT_TERM',
          projects: {
            create: generated.projects.map((p, i) => ({
              name: p.name, color: p.color,
              order: i, startDay: p.startDay, endDay: p.endDay
            }))
          }
        },
        include: { projects: true }
      })

      const taskData = generated.tasks.map(t => ({
        roadmapId: roadmap.id,
        projectId: roadmap.projects[t.projectIndex]?.id || null,
        day: t.day, title: t.title, description: t.description,
        techStack: t.techStack as any,
        resources: t.resources as any
      }))
      await prisma.task.createMany({ data: taskData })

      await prisma.reminder.create({
        data: { roadmapId: roadmap.id, time: '09:00', enabled: true, days: [1,2,3,4,5,6,7] }
      })

      const full = await prisma.roadmap.findUnique({
        where: { id: roadmap.id },
        include: { projects: true, tasks: true, reminders: true }
      })
      return NextResponse.json(full, { status: 201 })
    } catch (err: any) {
      return NextResponse.json({ error: err.message || 'AI generation failed' }, { status: 500 })
    }
  }

  // Manual mode
  const roadmap = await prisma.roadmap.create({
    data: {
      userId: session.user.id,
      title: data.title, goal: data.goal,
      description: data.description,
      totalDays: +data.totalDays || 30,
      color: data.color || 'violet',
      createdBy: 'MANUAL',
      projects: {
        create: (data.projects || []).map((p: any, i: number) => ({
          name: p.name, color: p.color || 'blue',
          order: i, startDay: +p.startDay, endDay: +p.endDay
        }))
      }
    },
    include: { projects: true }
  })

  if (data.tasks?.length) {
    await prisma.task.createMany({
      data: data.tasks.map((t: any) => ({
        roadmapId: roadmap.id,
        projectId: roadmap.projects[t.projectIndex || 0]?.id || null,
        day: +t.day, title: t.title,
        description: t.description || '',
        techStack: [], resources: []
      }))
    })
  }

  await prisma.reminder.create({
    data: { roadmapId: roadmap.id, time: '09:00', enabled: true, days: [1,2,3,4,5,6,7] }
  })

  const full = await prisma.roadmap.findUnique({
    where: { id: roadmap.id },
    include: { projects: true, tasks: true, reminders: true }
  })
  return NextResponse.json(full, { status: 201 })
}
