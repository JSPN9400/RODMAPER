import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  detectGoalType,
  generateLongTermRoadmap,
  generateShortTermRoadmap,
  type CurrentLevel,
  type ExamType,
  type FocusType,
  type GoalType,
} from '@/lib/ai-engine/universal-roadmap'
import { trackGoalPopularity } from '@/lib/ai-engine/goal-analytics'
import { Prisma, RoadmapType } from '@prisma/client'

type RequestBody = {
  type?: GoalType
  goal: string
  currentLevel: CurrentLevel
  duration: number
  hoursPerDay: number
  background: string
  focusType?: FocusType
  examType?: ExamType
  targetDate?: string
  color?: string
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as RequestBody
  const goal = body.goal?.trim()
  if (!goal) return NextResponse.json({ error: 'Goal is required' }, { status: 400 })

  const resolvedType = body.type || detectGoalType(goal)
  const color = body.color || 'violet'

  if (resolvedType === 'short_term') {
    const roadmap = await generateShortTermRoadmap({
      goal,
      currentLevel: body.currentLevel || 'beginner',
      daysAvailable: body.duration,
      hoursPerDay: body.hoursPerDay,
      background: body.background || '',
      focusType: body.focusType || 'mixed',
    })

    const created = await prisma.roadmap.create({
      data: {
        userId: session.user.id,
        title: roadmap.title,
        goal: roadmap.goal,
        description: roadmap.summary,
        totalDays: roadmap.daysAvailable,
        roadmapType: 'SHORT_TERM',
        createdBy: 'AI',
        color,
        projects: {
          create: [
            {
              name: 'Daily Plan',
              color,
              order: 0,
              startDay: 1,
              endDay: roadmap.daysAvailable,
            },
          ],
        },
      },
      include: { projects: true },
    })

    await prisma.task.createMany({
      data: roadmap.tasks.map((task) => ({
        roadmapId: created.id,
        projectId: created.projects[0]?.id || null,
        day: task.day,
        title: task.topic,
        description: `${task.schedule.morning}\n\n${task.schedule.afternoon}\n\n${task.schedule.evening}\n\nMini project: ${task.miniProject}`,
        techStack: [{ name: task.topic, type: 'other' }, { name: `Difficulty ${task.difficulty}`, type: 'other' }] as unknown as Prisma.InputJsonValue,
        resources: task.resources as unknown as Prisma.InputJsonValue,
      })),
    })

    await trackGoalPopularity(goal, 'SHORT_TERM', body.duration)
    return NextResponse.json({ type: resolvedType, roadmap, id: created.id }, { status: 201 })
  }

  const roadmap = await generateLongTermRoadmap({
    goal,
    targetDate: body.targetDate || `${body.duration} days`,
    currentLevel: body.currentLevel || 'beginner',
    hoursPerDay: body.hoursPerDay,
    background: body.background || '',
    examType: body.examType,
  })

  const totalDays = Math.max(body.duration, roadmap.phases.at(-1)?.endWeek ? roadmap.phases.at(-1)!.endWeek * 7 : body.duration)

  const created = await prisma.roadmap.create({
    data: {
      userId: session.user.id,
      title: roadmap.title,
      goal: roadmap.goal,
      description: roadmap.summary,
      totalDays,
      roadmapType: 'LONG_TERM',
      targetDate: body.targetDate ? new Date(body.targetDate) : null,
      createdBy: 'AI',
      color,
      phases: {
        create: roadmap.phases.map((phase) => ({
          name: phase.name,
          order: phase.order,
          startWeek: phase.startWeek,
          endWeek: phase.endWeek,
          milestones: phase.weeklyMilestones as unknown as Prisma.InputJsonValue,
          topics: phase.keyTopicsChecklist as unknown as Prisma.InputJsonValue,
        })),
      },
      projects: {
        create: roadmap.phases.map((phase) => ({
          name: phase.name,
          color,
          order: phase.order - 1,
          startDay: (phase.startWeek - 1) * 7 + 1,
          endDay: phase.endWeek * 7,
        })),
      },
    },
    include: { phases: true, projects: true },
  })

  await trackGoalPopularity(goal, 'LONG_TERM', totalDays)
  return NextResponse.json({ type: resolvedType, roadmap, id: created.id }, { status: 201 })
}
