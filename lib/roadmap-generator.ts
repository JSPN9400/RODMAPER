/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

import Groq from 'groq-sdk'

export type GoalType = 'short_term' | 'long_term'
export type CurrentLevel = 'beginner' | 'intermediate' | 'advanced'
export type FocusType = 'practice' | 'theory' | 'mixed'
export type ExamType = 'competitive_exam' | 'degree' | 'certification' | 'career' | 'research'

export type ShortTermRoadmapInput = {
  goal: string
  currentLevel: CurrentLevel
  daysAvailable: number
  hoursPerDay: number
  background: string
  focusType: FocusType
}

export type LongTermRoadmapInput = {
  goal: string
  targetDate: string
  currentLevel: CurrentLevel
  hoursPerDay: number
  background: string
  examType?: ExamType
}

export type DailyRoadmapTask = {
  day: number
  topic: string
  exercises: string[]
  miniProject: string
  resources: { name: string; url: string; type?: string }[]
  estimatedHours: number
  difficulty: 1 | 2 | 3 | 4 | 5
  schedule: {
    morning: string
    afternoon: string
    evening: string
  }
}

export type ShortTermRoadmap = {
  roadmapType: 'SHORT_TERM'
  title: string
  goal: string
  summary: string
  daysAvailable: number
  hoursPerDay: number
  currentLevel: CurrentLevel
  focusType: FocusType
  tasks: DailyRoadmapTask[]
}

export type WeeklyMilestone = {
  week: number
  focus: string
  milestone: string
  practiceTest?: string
  review: string
}

export type LongTermPhase = {
  name: string
  order: number
  startWeek: number
  endWeek: number
  weeklyMilestones: WeeklyMilestone[]
  keyTopicsChecklist: string[]
  mockTestSchedule: string[]
  resources: { name: string; type?: string; url?: string }[]
  progressCheckpoints: string[]
}

export type LongTermRoadmap = {
  roadmapType: 'LONG_TERM'
  title: string
  goal: string
  summary: string
  targetDate: string
  hoursPerDay: number
  currentLevel: CurrentLevel
  examType?: ExamType
  phases: LongTermPhase[]
}

function getClient() {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured')
  return new Groq({ apiKey })
}

// LLMs reliably hallucinate specific deep-link URLs — they don't have live
// web access, so a URL that "looks right" for a real course/article/video
// is frequently wrong or dead. Rather than trust whatever URL the model
// returns, every resource gets its URL rebuilt here from its name (and a
// light heuristic on platform), pointing at a search results page that is
// *guaranteed* to load and land the user on genuinely relevant results —
// strictly better than a broken 404 from an invented deep link.
function buildResourceUrl(name: string, hint?: string): string {
  const q = encodeURIComponent(name)
  const text = `${name} ${hint || ''}`.toLowerCase()
  if (text.includes('youtube') || text.includes('video') || text.includes('playlist')) {
    return `https://www.youtube.com/results?search_query=${q}`
  }
  if (text.includes('book') || text.includes('textbook')) {
    return `https://www.google.com/search?tbm=bks&q=${q}`
  }
  if (text.includes('docs') || text.includes('documentation') || text.includes('official')) {
    return `https://www.google.com/search?q=${q}+official+documentation`
  }
  return `https://www.google.com/search?q=${q}`
}

function fixResourceUrls<T extends { name: string; url?: string; type?: string }>(resources: T[] | undefined): T[] {
  if (!Array.isArray(resources)) return []
  return resources.map((r) => ({ ...r, url: buildResourceUrl(r.name, r.type) }))
}

async function geminiJSON<T>(systemPrompt: string, userPrompt: string): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('Neither GROQ_API_KEY nor GEMINI_API_KEY is configured')
  
  const { GoogleGenAI } = require('@google/genai')
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  })

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.4,
      responseMimeType: 'application/json',
    }
  })

  const raw = response.text || ''
  const clean = raw.replace(/```json|```/g, '').trim()
  const start = clean.indexOf('{') !== -1 ? clean.indexOf('{') : clean.indexOf('[')
  const end = Math.max(clean.lastIndexOf('}'), clean.lastIndexOf(']'))
  return JSON.parse(start >= 0 && end >= 0 ? clean.slice(start, end + 1) : clean) as T
}

async function groqJSON<T>(systemPrompt: string, userPrompt: string, maxTokens = 8000): Promise<T> {
  const hasGroq = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== ''
  if (!hasGroq) {
    console.log("[AI Studio] GROQ_API_KEY not configured, falling back to Gemini")
    return geminiJSON<T>(systemPrompt, userPrompt)
  }

  try {
    const client = getClient()
    const res = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    })

    const raw = res.choices[0]?.message?.content || ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const start = clean.indexOf('{') !== -1 ? clean.indexOf('{') : clean.indexOf('[')
    const end = Math.max(clean.lastIndexOf('}'), clean.lastIndexOf(']'))
    return JSON.parse(start >= 0 && end >= 0 ? clean.slice(start, end + 1) : clean) as T
  } catch (err) {
    console.warn("[AI Studio] Groq API failed, falling back to Gemini:", err)
    return geminiJSON<T>(systemPrompt, userPrompt)
  }
}

export function detectGoalType(goal: string): GoalType {
  const normalized = goal.toLowerCase()
  const longTermHints = [
    'upsc', 'neet', 'jee', 'gate', 'cat', 'gmat', 'gre', 'bar exam', 'ca', 'cfa',
    'phd', 'degree', 'masters', 'mbbs', 'civil services', 'research', 'thesis',
    'certification', 'career', '2 years', '3 years', '4 years', '5 years',
  ]
  if (longTermHints.some((hint) => normalized.includes(hint))) return 'long_term'
  return 'short_term'
}

export async function generateShortTermRoadmap(input: ShortTermRoadmapInput): Promise<ShortTermRoadmap> {
  const systemPrompt = `You are an expert learning coach. Create a practical, detailed day-by-day roadmap.
CRITICAL: Every day must have HANDS-ON practice, not just reading.
Difficulty must increase gradually with this distribution: easy 30%, medium 50%, hard 20%.
Use this daily split: Morning theory 30%, Afternoon practice problems 50%, Evening mini project or review 20%.
Be specific, not generic — name actual subtopics, actual tools/libraries, actual problem types, not vague placeholders like "practice basics". Each day's topic should read like a real lesson plan, not a one-line label: 2-3 sentences covering what's being learned and why it matters at this point in the sequence.
Give 2-3 resources per day (not just 1), each with a "name" (a specific, real, well-known resource — e.g. "freeCodeCamp Python course", "official React docs: Hooks") and a "type" (one of: youtube, docs, book, course, article). Do not invent a "url" — the app resolves a working link from name+type itself, so just describe the resource accurately and specifically.
Return ONLY valid JSON, no markdown fences.`

  const userPrompt = `Create a short-term roadmap for:
Goal: ${input.goal}
Current level: ${input.currentLevel}
Days available: ${input.daysAvailable}
Hours per day: ${input.hoursPerDay}
Background: ${input.background}
Focus type: ${input.focusType}

Return exactly this JSON shape:
{
  "roadmapType": "SHORT_TERM",
  "title": "string",
  "goal": "string",
  "summary": "string",
  "daysAvailable": ${input.daysAvailable},
  "hoursPerDay": ${input.hoursPerDay},
  "currentLevel": "${input.currentLevel}",
  "focusType": "${input.focusType}",
  "tasks": [
    {
      "day": 1,
      "topic": "string, 2-3 sentences, specific",
      "exercises": ["string, specific and concrete, not generic"],
      "miniProject": "string, a real small deliverable for the day",
      "resources": [{"name":"specific real resource name","type":"youtube|docs|book|course|article"}],
      "estimatedHours": ${input.hoursPerDay},
      "difficulty": 1,
      "schedule": {
        "morning": "string",
        "afternoon": "string",
        "evening": "string"
      }
    }
  ]
}`

  const result = await groqJSON<ShortTermRoadmap>(systemPrompt, userPrompt, 16000)
  result.tasks = result.tasks.map((t) => ({ ...t, resources: fixResourceUrls(t.resources) }))
  return result
}

export async function generateLongTermRoadmap(input: LongTermRoadmapInput): Promise<LongTermRoadmap> {
  const systemPrompt = `You are an expert academic and career coach. Create a structured, detailed long-term study plan.
CRITICAL: Include mock test schedules, revision cycles, and realistic milestones.
Weekly structure should be: Mon-Fri new topics, Saturday practice tests/problems, Sunday revision and review.
Be specific, not generic — name actual subtopics, actual exam sections/chapters, actual skills, not vague placeholders. Each phase's weekly milestones should read like a real study plan: what's being covered, why it matters at this stage, and a concrete, checkable milestone.
Give 2-4 resources per phase (not just 1), each with a "name" (a specific, real, well-known resource — e.g. "NCERT Physics Class 12", "official exam syllabus PDF") and a "type" (one of: youtube, docs, book, course, article). Do not invent a "url" — the app resolves a working link from name+type itself, so just describe the resource accurately and specifically.
Return ONLY valid JSON, no markdown fences.`

  const userPrompt = `Create a long-term roadmap for:
Goal: ${input.goal}
Target date or duration: ${input.targetDate}
Current level: ${input.currentLevel}
Hours per day: ${input.hoursPerDay}
Background: ${input.background}
Exam type: ${input.examType || 'career'}

Return exactly this JSON shape:
{
  "roadmapType": "LONG_TERM",
  "title": "string",
  "goal": "string",
  "summary": "string",
  "targetDate": "${input.targetDate}",
  "hoursPerDay": ${input.hoursPerDay},
  "currentLevel": "${input.currentLevel}",
  "examType": "${input.examType || 'career'}",
  "phases": [
    {
      "name": "Foundation",
      "order": 1,
      "startWeek": 1,
      "endWeek": 8,
      "weeklyMilestones": [
        {
          "week": 1,
          "focus": "string, specific",
          "milestone": "string, 2-3 sentences, concrete and checkable",
          "practiceTest": "string",
          "review": "string"
        }
      ],
      "keyTopicsChecklist": ["string, specific subtopics"],
      "mockTestSchedule": ["string"],
      "resources": [{"name":"specific real resource name","type":"youtube|docs|book|course|article"}],
      "progressCheckpoints": ["string"]
    }
  ]
}`

  const result = await groqJSON<LongTermRoadmap>(systemPrompt, userPrompt, 16000)
  result.phases = result.phases.map((p) => ({ ...p, resources: fixResourceUrls(p.resources) }))
  return result
}
