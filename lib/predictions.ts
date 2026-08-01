/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

import { prisma } from './prisma'
import { computeAccountability } from './accountability'

// ---------------------------------------------------------------------
// Skill graph — aggregates Task.techStack (already generated per task,
// see lib/roadmap-generator.ts) across every completed task the user has.
// No new tracking needed: the tags were already there, just never
// rolled up into a single picture before.
// ---------------------------------------------------------------------

export interface SkillNode {
  name: string
  count: number // how many completed tasks touched this skill
  roadmaps: number // how many distinct roadmaps it appeared in
}

export async function computeSkillGraph(userId: string): Promise<SkillNode[]> {
  const tasks = await prisma.task.findMany({
    where: { done: true, roadmap: { userId } },
    select: { techStack: true, roadmapId: true },
  })

  const bySkill = new Map<string, { count: number; roadmaps: Set<string> }>()
  for (const t of tasks) {
    const stack = (t.techStack as any[]) || []
    for (const item of stack) {
      const name = (item?.name || '').trim()
      if (!name) continue
      const entry = bySkill.get(name) || { count: 0, roadmaps: new Set<string>() }
      entry.count++
      entry.roadmaps.add(t.roadmapId)
      bySkill.set(name, entry)
    }
  }

  return Array.from(bySkill.entries())
    .map(([name, v]) => ({ name, count: v.count, roadmaps: v.roadmaps.size }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30)
}

// ---------------------------------------------------------------------
// Career readiness score — a composite of breadth (distinct skills),
// depth (completed tasks per skill, rewards actually finishing things
// over skimming many), and consistency (reuses the Accountability
// Engine's reliability score, since "readiness" should reflect real
// follow-through, not just activity). Each factor is shown separately
// so the number isn't a black box.
// ---------------------------------------------------------------------

export interface CareerReadiness {
  score: number // 0-100
  breadthScore: number
  depthScore: number
  consistencyScore: number
  completedRoadmaps: number
  totalSkills: number
  label: string
}

export async function computeCareerReadiness(userId: string): Promise<CareerReadiness> {
  const [skills, completedRoadmaps, accountability] = await Promise.all([
    computeSkillGraph(userId),
    prisma.roadmap.count({ where: { userId, status: 'COMPLETED' } }),
    computeAccountability(userId),
  ])

  // Breadth: distinct skills touched, capped — 15+ distinct skills = full marks.
  const breadthScore = Math.min(100, Math.round((skills.length / 15) * 100))

  // Depth: average completions per skill, rewards finishing what's started
  // over shallow exposure. 4+ completions per skill on average = full marks.
  const avgDepth = skills.length > 0 ? skills.reduce((s, x) => s + x.count, 0) / skills.length : 0
  const depthScore = Math.min(100, Math.round((avgDepth / 4) * 100))

  const consistencyScore = accountability.reliabilityScore

  // Weighted composite — consistency matters most (follow-through is the
  // actual predictor of real-world readiness), then depth, then breadth.
  const score = Math.round(consistencyScore * 0.45 + depthScore * 0.3 + breadthScore * 0.25)

  const label = score >= 75 ? 'Strong' : score >= 50 ? 'Building' : score >= 25 ? 'Early stage' : 'Just starting'

  return { score, breadthScore, depthScore, consistencyScore, completedRoadmaps, totalSkills: skills.length, label }
}

// ---------------------------------------------------------------------
// Predictive completion date + learning curve — per roadmap. Uses the
// student's own actual completion velocity (tasks/day over the last two
// weeks) rather than the nominal pace implied by totalDays, so the
// prediction reflects how they're really doing, not how the plan
// assumed they'd do.
// ---------------------------------------------------------------------

export interface CompletionPrediction {
  hasEnoughData: boolean
  remainingTasks: number
  recentVelocity: number // tasks completed per day, last 14 days
  predictedDaysRemaining: number | null
  predictedDate: string | null // ISO date
  targetDate: string | null // ISO date, roadmap.createdAt + totalDays
  aheadOrBehindDays: number | null // negative = predicted to finish early
  learningCurve: 'accelerating' | 'steady' | 'slowing' | 'not_enough_data'
}

export async function predictCompletion(roadmapId: string, userId: string): Promise<CompletionPrediction | null> {
  const roadmap = await prisma.roadmap.findFirst({
    where: { id: roadmapId, userId },
    include: { tasks: true },
  })
  if (!roadmap) return null

  const total = roadmap.tasks.length
  const doneTasks = roadmap.tasks.filter((t) => t.done && t.doneAt)
  const remainingTasks = total - doneTasks.length

  const targetDate = new Date(roadmap.createdAt.getTime() + roadmap.totalDays * 86400000).toISOString()

  if (doneTasks.length < 4 || remainingTasks === 0) {
    return {
      hasEnoughData: false, remainingTasks, recentVelocity: 0,
      predictedDaysRemaining: null, predictedDate: null, targetDate,
      aheadOrBehindDays: null, learningCurve: 'not_enough_data',
    }
  }

  const now = Date.now()
  const last14 = doneTasks.filter((t) => now - t.doneAt!.getTime() <= 14 * 86400000)
  const prev14 = doneTasks.filter((t) => {
    const age = now - t.doneAt!.getTime()
    return age > 14 * 86400000 && age <= 28 * 86400000
  })

  const recentVelocity = last14.length / 14
  const predictedDaysRemaining = recentVelocity > 0 ? Math.ceil(remainingTasks / recentVelocity) : null
  const predictedDate = predictedDaysRemaining !== null
    ? new Date(now + predictedDaysRemaining * 86400000).toISOString()
    : null

  const aheadOrBehindDays = predictedDate
    ? Math.round((new Date(predictedDate).getTime() - new Date(targetDate).getTime()) / 86400000)
    : null

  let learningCurve: CompletionPrediction['learningCurve'] = 'not_enough_data'
  if (prev14.length >= 2) {
    const prevVelocity = prev14.length / 14
    const change = (recentVelocity - prevVelocity) / Math.max(prevVelocity, 0.01)
    learningCurve = change > 0.15 ? 'accelerating' : change < -0.15 ? 'slowing' : 'steady'
  }

  return {
    hasEnoughData: true, remainingTasks, recentVelocity: Math.round(recentVelocity * 100) / 100,
    predictedDaysRemaining, predictedDate, targetDate, aheadOrBehindDays, learningCurve,
  }
}
