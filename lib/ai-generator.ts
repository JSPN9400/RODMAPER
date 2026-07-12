/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

import Groq from 'groq-sdk'

function getClient() {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('GROQ_API_KEY not set in .env.local')
  return new Groq({ apiKey: key })
}

async function groqCall(prompt: string, maxTokens = 8000): Promise<string> {
  const client = getClient()
  const res = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: maxTokens,
    temperature: 0.7,
    messages: [{ role: 'user', content: prompt }]
  })
  return res.choices[0]?.message?.content || ''
}

function parseJSON(text: string): any {
  let clean = text.replace(/```json|```/g, '').trim()
  const s = clean.indexOf('{') !== -1 ? clean.indexOf('{') : clean.indexOf('[')
  const e = Math.max(clean.lastIndexOf('}'), clean.lastIndexOf(']'))
  if (s !== -1 && e !== -1) clean = clean.slice(s, e + 1)
  return JSON.parse(clean)
}

export interface AIRoadmapInput {
  goal: string
  background: string
  days: number
  hoursPerDay: number
  focusAreas?: string
  currentLevel?: string
  goalType?: string
}

export async function generateRoadmapWithAI(input: AIRoadmapInput) {
  const isLongTerm = input.goalType === 'long_term' || input.days > 90

  const prompt = `You are an expert learning coach. Create a ${isLongTerm ? 'long-term phased' : 'day-by-day'} roadmap for ANY subject.

GOAL: ${input.goal}
BACKGROUND: ${input.background}
LEVEL: ${input.currentLevel || 'beginner'}
DURATION: ${input.days} days
HOURS/DAY: ${input.hoursPerDay}
FOCUS: ${input.focusAreas || 'Based on goal'}
TYPE: ${isLongTerm ? 'Long term - use phases/weeks' : 'Short term - day by day'}

Return ONLY valid JSON:
{
  "title": "${input.days}-Day ${input.goal} Roadmap",
  "goal": "${input.goal}",
  "description": "2 sentence description",
  "days": ${input.days},
  "projects": [
    {"name": "Phase/Project Name", "color": "violet", "startDay": 1, "endDay": 30}
  ],
  "tasks": [
    {
      "day": 1,
      "projectIndex": 0,
      "title": "Topic",
      "description": "What to learn and do today",
      "techStack": [{"name": "Tool", "type": "python"}],
      "resources": [{"name": "Resource (Free)", "url": "https://real-url.com"}]
    }
  ]
}

RULES:
- Works for ANY subject: coding, exams, languages, music, fitness, UPSC, NEET, MBA etc
- Every task must have hands-on practice, not just reading
- For long term (90+ days): group by phases, weekly milestones
- tech types: sql, python, bi, ai, git, js, other
- Real free URLs only (youtube, docs, kaggle, khan academy etc)
- Last project must be "Final Review / Application"
- Difficulty: Easy first 30%, Medium 50%, Hard 20%
- colors: violet, blue, green, amber, red, teal, pink
- Return ONLY JSON, no markdown`

  const text = await groqCall(prompt, 8000)
  return parseJSON(text)
}

export async function parseUserIntent(rawInput: string) {
  const text = await groqCall(`NLU system for learning roadmap app.
User: "${rawInput}"
Return ONLY JSON:
{"goal":"cleaned goal","background":"background if mentioned","days":30,"hoursPerDay":4,"focusAreas":"","confidence":0.9,"suggestions":["tip"]}`, 600)
  try { return parseJSON(text) }
  catch { return { goal: rawInput, background: '', days: 30, hoursPerDay: 4, focusAreas: '', confidence: 0.5, suggestions: [] } }
}

export async function generateCompletionSummary(title: string, rate: number, skills: string[], done: number, total: number): Promise<string> {
  return groqCall(`Write 2 paragraph learning journey analysis:
Roadmap: ${title}, Completion: ${rate}% (${done}/${total} days), Skills: ${skills.join(', ')}
Paragraph 1: What was accomplished. Paragraph 2: Next steps. Be encouraging.`, 400)
}

export async function generateResumeBullets(role: string, experience: string, projects: string[]): Promise<string> {
  return groqCall(`ATS-optimized resume content:
Role: ${role}, Background: ${experience}, Projects: ${projects.join(', ')}
Include: 2-line Summary, 4 experience bullets, 4 project bullets, Skills section. Action verbs + metrics.`, 800)
}
