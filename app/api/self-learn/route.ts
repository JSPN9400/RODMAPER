// app/api/self-learn/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { selfLearnFromProgress, suggestNextTask } from '@/lib/ai-generator'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { roadmapId, action } = await req.json()

  const roadmap = await prisma.roadmap.findFirst({
    where: { id: roadmapId, userId: session.user.id },
    include: { tasks: true }
  })
  if (!roadmap) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const tasks = roadmap.tasks
  const doneTasks = tasks.filter(t => t.done)
  const skippedDays = tasks.filter(t => !t.done).map(t => t.day)
  const doneDays = doneTasks.map(t => t.day).sort((a, b) => a - b)

  // Calculate streak
  let streakMax = 0, cur = 0
  for (let i = 0; i < doneDays.length; i++) {
    if (i === 0 || doneDays[i] - doneDays[i-1] === 1) { cur++; streakMax = Math.max(streakMax, cur) }
    else cur = 1
  }

  // Skills from tech stack
  const skillCount: Record<string, number> = {}
  tasks.forEach(t => {
    if (t.techStack && Array.isArray(t.techStack)) {
      (t.techStack as any[]).forEach((tech: any) => {
        if (tech.name) skillCount[tech.name] = (skillCount[tech.name] || 0) + 1
      })
    }
  })
  const topSkills = Object.entries(skillCount).sort((a,b) => b[1]-a[1]).slice(0,6).map(([n]) => n)

  const completionRate = Math.round(doneTasks.length / tasks.length * 100)
  const avgDaysPerWeek = doneDays.length > 0 ? Math.round(doneDays.length / Math.max(1, Math.ceil(roadmap.totalDays / 7))) : 0

  if (action === 'suggest') {
    const completedTopics = doneTasks.map(t => t.title)
    const skippedTopics = tasks.filter(t => !t.done).slice(0, 5).map(t => t.title)
    const daysLeft = tasks.filter(t => !t.done).length
    const suggestion = await suggestNextTask({ completedTopics, skippedTopics, goal: roadmap.goal, daysLeft })
    return NextResponse.json(suggestion)
  }

  // Default: full self-learn analysis
  const analysis = await selfLearnFromProgress({
    roadmapTitle: roadmap.title,
    completionRate,
    skippedDays,
    doneDays,
    topSkills,
    streakMax,
    avgDaysPerWeek
  })

  return NextResponse.json({ ...analysis, completionRate, streakMax, topSkills })
}
