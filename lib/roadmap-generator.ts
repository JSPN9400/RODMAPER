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
  resources: { name: string; url: string }[]
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
  resources: { name: string; type: 'book' | 'online'; url?: string }[]
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

async function groqJSON<T>(systemPrompt: string, userPrompt: string, maxTokens = 8000): Promise<T> {
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
  const systemPrompt = `You are an expert learning coach. Create a practical day-by-day roadmap.
CRITICAL: Every day must have HANDS-ON practice, not just reading.
Difficulty must increase gradually with this distribution: easy 30%, medium 50%, hard 20%.
Use this daily split: Morning theory 30%, Afternoon practice problems 50%, Evening mini project or review 20%.
Return ONLY valid JSON. Use real free URLs only.`

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
      "topic": "string",
      "exercises": ["string"],
      "miniProject": "string",
      "resources": [{"name":"string","url":"https://..."}],
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

  return groqJSON<ShortTermRoadmap>(systemPrompt, userPrompt, 7000)
}

export async function generateLongTermRoadmap(input: LongTermRoadmapInput): Promise<LongTermRoadmap> {
  const systemPrompt = `You are an expert academic and career coach. Create a structured long-term study plan.
CRITICAL: Include mock test schedules, revision cycles, and realistic milestones.
Weekly structure should be: Mon-Fri new topics, Saturday practice tests/problems, Sunday revision and review.
Return ONLY valid JSON.`

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
          "focus": "string",
          "milestone": "string",
          "practiceTest": "string",
          "review": "string"
        }
      ],
      "keyTopicsChecklist": ["string"],
      "mockTestSchedule": ["string"],
      "resources": [{"name":"string","type":"book","url":"https://..."}],
      "progressCheckpoints": ["string"]
    }
  ]
}`

  return groqJSON<LongTermRoadmap>(systemPrompt, userPrompt, 8000)
}
