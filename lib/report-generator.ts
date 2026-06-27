// lib/report-generator.ts
import { prisma } from './prisma'
import { generateCompletionSummary } from './ai-generator'
import { TimelinePoint, ProjectReportData } from '@/types'

export async function generateReport(roadmapId: string) {
  const roadmap = await prisma.roadmap.findUnique({
    where: { id: roadmapId },
    include: { tasks: true, projects: true }
  })
  if (!roadmap) throw new Error('Roadmap not found')

  const tasks = roadmap.tasks
  const totalDays = roadmap.totalDays
  const doneTasks = tasks.filter(t => t.done)
  const completedDays = doneTasks.length
  const completionRate = Math.round((completedDays / totalDays) * 100)

  // Calculate max streak
  const doneDays = doneTasks.map(t => t.day).sort((a, b) => a - b)
  let streakMax = 0, currentStreak = 0
  for (let i = 0; i < doneDays.length; i++) {
    if (i === 0 || doneDays[i] - doneDays[i - 1] === 1) {
      currentStreak++
      streakMax = Math.max(streakMax, currentStreak)
    } else {
      currentStreak = 1
    }
  }

  // Top skills from tech stack
  const skillCount: Record<string, number> = {}
  tasks.forEach(task => {
    if (task.techStack && Array.isArray(task.techStack)) {
      (task.techStack as any[]).forEach((tech: any) => {
        if (tech.name) skillCount[tech.name] = (skillCount[tech.name] || 0) + 1
      })
    }
  })
  const topSkills = Object.entries(skillCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name]) => name)

  // Projects data
  const projectsData: ProjectReportData[] = roadmap.projects.map(p => {
    const projTasks = tasks.filter(t => t.projectId === p.id)
    return {
      name: p.name,
      completed: projTasks.filter(t => t.done).length,
      total: projTasks.length,
      color: p.color
    }
  })

  // Timeline
  const timelineData: TimelinePoint[] = tasks.map(t => ({
    day: t.day,
    done: t.done,
    doneAt: t.doneAt?.toISOString()
  }))

  // AI summary
  let summary = ''
  try {
    summary = await generateCompletionSummary(
      roadmap.title, completionRate, topSkills, completedDays, totalDays
    )
  } catch (e) {
    summary = `You completed ${completionRate}% of ${roadmap.title}. ${completedDays} out of ${totalDays} days done with a max streak of ${streakMax} days.`
  }

  // Upsert report
  const report = await prisma.report.upsert({
    where: { roadmapId },
    create: {
      roadmapId,
      totalDays,
      completedDays,
      completionRate,
      streakMax,
      topSkills,
      projectsData,
      timelineData,
      summary
    },
    update: {
      completedDays,
      completionRate,
      streakMax,
      topSkills,
      projectsData,
      timelineData,
      summary,
      generatedAt: new Date()
    }
  })

  // Update roadmap status if 100%
  if (completionRate === 100) {
    await prisma.roadmap.update({
      where: { id: roadmapId },
      data: { status: 'COMPLETED', completedAt: new Date() }
    })
  }

  return report
}
