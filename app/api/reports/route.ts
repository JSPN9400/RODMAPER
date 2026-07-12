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
import { generateCompletionSummary } from '@/lib/ai-generator'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { roadmapId } = await req.json()

  const roadmap = await prisma.roadmap.findFirst({
    where: { id: roadmapId, userId: session.user.id },
    include: { tasks: true, projects: true }
  })
  if (!roadmap) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const tasks = roadmap.tasks
  const done = tasks.filter(t => t.done)
  const completionRate = Math.round((done.length / tasks.length) * 100)

  // Streak
  const days = done.map(t => t.day).sort((a,b) => a-b)
  let streakMax = 0, cur = 0
  for (let i = 0; i < days.length; i++) {
    if (i === 0 || days[i] - days[i-1] === 1) { cur++; streakMax = Math.max(streakMax, cur) } else cur = 1
  }

  // Skills
  const skillCount: Record<string,number> = {}
  tasks.forEach(t => { if (t.techStack && Array.isArray(t.techStack)) (t.techStack as any[]).forEach((s:any) => { if (s.name) skillCount[s.name] = (skillCount[s.name]||0)+1 }) })
  const topSkills = Object.entries(skillCount).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([n])=>n)

  const projectsData = roadmap.projects.map(p => {
    const pT = tasks.filter(t => t.projectId === p.id)
    return { name: p.name, color: p.color, completed: pT.filter(t=>t.done).length, total: pT.length }
  })

  const timelineData = tasks.map(t => ({ day: t.day, done: t.done, doneAt: t.doneAt?.toISOString() }))

  let summary = ''
  try { summary = await generateCompletionSummary(roadmap.title, completionRate, topSkills, done.length, tasks.length) }
  catch { summary = `You completed ${completionRate}% of ${roadmap.title}.` }

  const report = await prisma.report.upsert({
    where: { roadmapId },
    create: { roadmapId, totalDays: roadmap.totalDays, completedDays: done.length, completionRate, streakMax, topSkills, projectsData, timelineData, summary },
    update: { completedDays: done.length, completionRate, streakMax, topSkills, projectsData, timelineData, summary, generatedAt: new Date() }
  })
  return NextResponse.json(report)
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const roadmapId = searchParams.get('roadmapId')
  if (!roadmapId) return NextResponse.json({ error: 'Missing roadmapId' }, { status: 400 })

  const report = await prisma.report.findUnique({
    where: { roadmapId },
    include: { roadmap: { select: { title: true, goal: true, userId: true } } }
  })
  if (!report || report.roadmap.userId !== session.user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(report)
}
