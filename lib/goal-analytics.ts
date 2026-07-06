import { RoadmapType } from '@prisma/client'
import { prisma } from '@/lib/prisma'

function toGoalKey(goal: string, type: RoadmapType) {
  return `${type}:${goal.trim().toLowerCase().replace(/\s+/g, ' ')}`
}

export async function trackGoalPopularity(goal: string, type: RoadmapType, duration: number) {
  const goalKey = toGoalKey(goal, type)

  await prisma.goalAnalytics.upsert({
    where: { goalKey },
    create: {
      goalKey,
      goal,
      type,
      durationDays: duration,
      popularityCount: 1,
    },
    update: {
      popularityCount: { increment: 1 },
      durationDays: duration,
    },
  })
}

export async function updateSuccessRate(
  goal: string,
  completionRate: number,
  daysActuallyTaken: number,
  type: RoadmapType = 'SHORT_TERM',
) {
  const goalKey = toGoalKey(goal, type)

  await prisma.goalAnalytics.upsert({
    where: { goalKey },
    create: {
      goalKey,
      goal,
      type,
      durationDays: daysActuallyTaken,
      popularityCount: 1,
      completedCount: completionRate >= 100 ? 1 : 0,
      totalCompletionRate: completionRate,
      totalDaysTaken: daysActuallyTaken,
    },
    update: {
      completedCount: completionRate >= 100 ? { increment: 1 } : undefined,
      totalCompletionRate: { increment: completionRate },
      totalDaysTaken: { increment: daysActuallyTaken },
    },
  })
}
