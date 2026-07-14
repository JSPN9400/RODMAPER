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
// for the current AI generation flow) or POST /api/roadmaps (for manual roadmap creation).
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
  const enriched = await Promise.all(roadmaps.map(async (rm: any) => {
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

  try {
    const body = await req.json()
    const { title, goal, description, totalDays, roadmapType, color } = body

    if (!title || !goal) {
      return NextResponse.json({ error: 'Title and Goal are required' }, { status: 400 })
    }

    const created = await prisma.roadmap.create({
      data: {
        userId: session.user.id,
        title,
        goal,
        description: description || '',
        totalDays: totalDays ? parseInt(totalDays) : 30,
        roadmapType: roadmapType === 'LONG_TERM' ? 'LONG_TERM' : 'SHORT_TERM',
        createdBy: 'MANUAL',
        color: color || 'violet',
        projects: {
          create: [
            {
              name: 'Getting Started',
              color: color || 'violet',
              order: 0,
              startDay: 1,
              endDay: totalDays ? parseInt(totalDays) : 30,
            }
          ]
        }
      },
      include: {
        projects: true
      }
    })

    // Create a few initial template tasks so the roadmap isn't completely blank
    const days = totalDays ? parseInt(totalDays) : 30
    const initialTasks = [
      {
        roadmapId: created.id,
        projectId: created.projects[0]?.id || null,
        day: 1,
        title: 'Define goals and gather study resources',
        description: 'Detail exactly what skills, books, tutorials, or documentation you need to explore first.',
        techStack: [{ name: 'Planning', type: 'other' }],
        resources: [{ name: 'Google Search', url: 'https://google.com' }],
      },
      {
        roadmapId: created.id,
        projectId: created.projects[0]?.id || null,
        day: 2,
        title: 'Set up tools and environments',
        description: 'Download, configure, and initialize all software platforms or workspaces needed for this topic.',
        techStack: [{ name: 'Setup', type: 'other' }],
        resources: [],
      },
      {
        roadmapId: created.id,
        projectId: created.projects[0]?.id || null,
        day: 3,
        title: 'Core Basics Exploration',
        description: 'Read first chapter or view introduction tutorials of the chosen topic.',
        techStack: [{ name: 'Intro', type: 'other' }],
        resources: [],
      }
    ]

    await prisma.task.createMany({
      data: initialTasks.map(t => ({
        ...t,
        techStack: t.techStack as any,
        resources: t.resources as any,
      }))
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create roadmap' }, { status: 500 })
  }
}
