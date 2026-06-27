// app/api/roadmaps/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateRoadmapWithAI } from '@/lib/ai-generator'
import { AIRoadmapInput } from '@/types'

// GET /api/roadmaps - get all roadmaps for user
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const roadmaps = await prisma.roadmap.findMany({
    where: { userId: session.user.id },
    include: {
      projects: { orderBy: { order: 'asc' } },
      tasks: { select: { id: true, day: true, done: true } },
      reminders: true,
      report: { select: { completionRate: true, completedDays: true } }
    },
    orderBy: { updatedAt: 'desc' }
  })

  return NextResponse.json(roadmaps)
}

// POST /api/roadmaps - create roadmap (manual or AI)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { mode, ...data } = body

  if (mode === 'ai') {
    // AI Generation
    const input: AIRoadmapInput = {
      goal: data.goal,
      background: data.background,
      days: data.days || 30,
      hoursPerDay: data.hoursPerDay || 7,
      focusAreas: data.focusAreas
    }

    const generated = await generateRoadmapWithAI(input)

    // Save to DB
    const roadmap = await prisma.roadmap.create({
      data: {
        userId: session.user.id,
        title: generated.title,
        goal: generated.goal,
        description: generated.description,
        totalDays: generated.days,
        createdBy: 'AI',
        color: data.color || 'violet',
        projects: {
          create: generated.projects.map((p, i) => ({
            name: p.name,
            color: p.color,
            order: i,
            startDay: p.startDay,
            endDay: p.endDay
          }))
        }
      },
      include: { projects: true }
    })

    // Create tasks linked to projects
    const taskCreates = generated.tasks.map(t => ({
      roadmapId: roadmap.id,
      projectId: roadmap.projects[t.projectIndex]?.id || null,
      day: t.day,
      title: t.title,
      description: t.description,
      techStack: t.techStack as any,
      resources: t.resources as any
    }))

    await prisma.task.createMany({ data: taskCreates })

    // Create default reminder
    await prisma.reminder.create({
      data: {
        roadmapId: roadmap.id,
        time: '09:00',
        enabled: true,
        message: `Time to learn! Today's task is waiting.`,
        days: [1, 2, 3, 4, 5, 6, 7]
      }
    })

    const full = await prisma.roadmap.findUnique({
      where: { id: roadmap.id },
      include: { projects: true, tasks: true, reminders: true }
    })
    return NextResponse.json(full, { status: 201 })

  } else {
    // Manual creation
    const roadmap = await prisma.roadmap.create({
      data: {
        userId: session.user.id,
        title: data.title,
        goal: data.goal,
        description: data.description,
        totalDays: data.totalDays || 30,
        color: data.color || 'violet',
        createdBy: 'MANUAL',
        projects: {
          create: (data.projects || []).map((p: any, i: number) => ({
            name: p.name,
            color: p.color || 'blue',
            order: i,
            startDay: p.startDay,
            endDay: p.endDay
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
          day: t.day,
          title: t.title,
          description: t.description || '',
          techStack: t.techStack || [],
          resources: t.resources || []
        }))
      })
    }

    await prisma.reminder.create({
      data: {
        roadmapId: roadmap.id,
        time: '09:00',
        enabled: true,
        days: [1, 2, 3, 4, 5, 6, 7]
      }
    })

    const full = await prisma.roadmap.findUnique({
      where: { id: roadmap.id },
      include: { projects: true, tasks: true, reminders: true }
    })
    return NextResponse.json(full, { status: 201 })
  }
}
