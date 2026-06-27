// lib/ai-generator.ts
// Uses Google Gemini API (FREE) instead of Anthropic

import { GoogleGenerativeAI } from '@google/generative-ai'
import { AIRoadmapInput, AIGeneratedRoadmap } from '@/types'

function getClient() {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY not set in .env.local')
  return new GoogleGenerativeAI(key)
}

async function geminiCall(prompt: string, maxTokens = 8000): Promise<string> {
  const genAI = getClient()
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash', // free tier model
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 }
  })
  const result = await model.generateContent(prompt)
  return result.response.text()
}

// ─── NLU: Parse user intent from raw input ───────────────────────────────────
export async function parseUserIntent(rawInput: string): Promise<{
  goal: string
  background: string
  days: number
  hoursPerDay: number
  focusAreas: string
  confidence: number
  suggestions: string[]
}> {
  const prompt = `You are an NLU (Natural Language Understanding) system for a learning roadmap app.

User said: "${rawInput}"

Parse this and return ONLY valid JSON:
{
  "goal": "cleaned target role/goal",
  "background": "inferred background if mentioned, else empty string",
  "days": 30,
  "hoursPerDay": 4,
  "focusAreas": "inferred focus areas",
  "confidence": 0.9,
  "suggestions": ["suggestion to improve the goal", "another tip"]
}

Rules:
- Fix spelling mistakes (pyrthon → Python, pyhoin → Python)
- Infer realistic days/hours if not specified
- confidence: 0.0 to 1.0 (how clear the intent was)
- suggestions: helpful tips to make the goal more specific
- Return ONLY JSON, no explanation`

  try {
    const text = await geminiCall(prompt, 1000)
    const clean = text.replace(/```json|```/g, '').trim()
    const start = clean.indexOf('{')
    const end = clean.lastIndexOf('}')
    return JSON.parse(clean.slice(start, end + 1))
  } catch {
    return {
      goal: rawInput,
      background: '',
      days: 30,
      hoursPerDay: 4,
      focusAreas: '',
      confidence: 0.5,
      suggestions: ['Be more specific about your target role', 'Mention your current skill level']
    }
  }
}

// ─── Main roadmap generator ──────────────────────────────────────────────────
export async function generateRoadmapWithAI(input: AIRoadmapInput): Promise<AIGeneratedRoadmap> {
  const prompt = `You are an expert learning roadmap designer. Create a highly personalized ${input.days}-day learning roadmap.

GOAL: ${input.goal}
BACKGROUND: ${input.background}
FOCUS: ${input.focusAreas || 'Based on goal'}
HOURS/DAY: ${input.hoursPerDay}

Return ONLY valid JSON with this exact structure:
{
  "title": "${input.days}-Day ${input.goal} Roadmap",
  "goal": "${input.goal}",
  "description": "2 sentence description",
  "days": ${input.days},
  "projects": [
    {"name": "Project Name", "color": "violet", "startDay": 1, "endDay": 8}
  ],
  "tasks": [
    {
      "day": 1,
      "projectIndex": 0,
      "title": "Topic",
      "description": "What to learn and build today",
      "techStack": [{"name": "Python", "type": "python"}],
      "resources": [
        {"name": "Resource Name (Free)", "url": "https://real-url.com"}
      ]
    }
  ]
}

RULES:
- Use person's background — make it relevant to their experience
- Every day = learn concept + build something real
- tech types: sql, python, bi, ai, git, js, design, other
- Resources must be REAL free URLs
- Last project = "Final Sprint" with resume + job hunt tasks
- color options: violet, blue, green, amber, red, teal, pink
- Return ONLY JSON, no markdown, no explanation`

  const text = await geminiCall(prompt, 8000)
  let clean = text.replace(/```json|```/g, '').trim()
  const start = clean.indexOf('{')
  const end = clean.lastIndexOf('}')
  if (start !== -1 && end !== -1) clean = clean.slice(start, end + 1)
  return JSON.parse(clean) as AIGeneratedRoadmap
}

// ─── Self-learning: Analyze patterns & suggest improvements ──────────────────
export async function selfLearnFromProgress(data: {
  roadmapTitle: string
  completionRate: number
  skippedDays: number[]
  doneDays: number[]
  topSkills: string[]
  streakMax: number
  avgDaysPerWeek: number
}): Promise<{
  insights: string[]
  adjustments: { day: number; suggestion: string }[]
  nextSteps: string[]
  motivationScore: number
  learningStyle: string
}> {
  const prompt = `You are a learning coach AI that analyzes student progress patterns.

Student Data:
- Roadmap: ${data.roadmapTitle}
- Completion: ${data.completionRate}%
- Days Done: ${data.doneDays.length} (days: ${data.doneDays.slice(0, 10).join(', ')})
- Days Skipped: ${data.skippedDays.length} (days: ${data.skippedDays.slice(0, 10).join(', ')})
- Max Streak: ${data.streakMax} days
- Avg days/week: ${data.avgDaysPerWeek}
- Top Skills: ${data.topSkills.join(', ')}

Analyze patterns and return ONLY valid JSON:
{
  "insights": ["insight about their learning pattern", "another insight"],
  "adjustments": [
    {"day": 5, "suggestion": "This topic might need more time — consider splitting it"}
  ],
  "nextSteps": ["concrete next step", "another action"],
  "motivationScore": 75,
  "learningStyle": "Consistent Learner / Weekend Warrior / Sprint Learner / etc"
}

motivationScore: 0-100 based on consistency
Return ONLY JSON`

  try {
    const text = await geminiCall(prompt, 1500)
    const clean = text.replace(/```json|```/g, '').trim()
    const start = clean.indexOf('{')
    const end = clean.lastIndexOf('}')
    return JSON.parse(clean.slice(start, end + 1))
  } catch {
    return {
      insights: ['Keep going — consistency is key!'],
      adjustments: [],
      nextSteps: ['Complete today\'s task', 'Review skipped topics'],
      motivationScore: 70,
      learningStyle: 'Active Learner'
    }
  }
}

// ─── Smart task suggestion based on what user struggled with ─────────────────
export async function suggestNextTask(context: {
  completedTopics: string[]
  skippedTopics: string[]
  goal: string
  daysLeft: number
}): Promise<{
  suggestedTopic: string
  reason: string
  resources: { name: string; url: string }[]
  estimatedHours: number
}> {
  const prompt = `Learning coach AI. Suggest the most impactful next task.

Goal: ${context.goal}
Completed: ${context.completedTopics.slice(-5).join(', ')}
Struggled with: ${context.skippedTopics.join(', ')}
Days left: ${context.daysLeft}

Return ONLY valid JSON:
{
  "suggestedTopic": "topic name",
  "reason": "why this is the best next step",
  "resources": [
    {"name": "Best free resource", "url": "https://real-url.com"}
  ],
  "estimatedHours": 2
}`

  try {
    const text = await geminiCall(prompt, 800)
    const clean = text.replace(/```json|```/g, '').trim()
    const start = clean.indexOf('{')
    const end = clean.lastIndexOf('}')
    return JSON.parse(clean.slice(start, end + 1))
  } catch {
    return {
      suggestedTopic: 'Review and practice',
      reason: 'Consolidate what you have learned so far',
      resources: [{ name: 'Khan Academy', url: 'https://khanacademy.org' }],
      estimatedHours: 2
    }
  }
}

// ─── Other AI helpers ────────────────────────────────────────────────────────
export async function generateCaseStudy(projectName: string, tasks: string[], techStack: string[]): Promise<string> {
  const text = await geminiCall(`Write a professional portfolio case study for:
Project: ${projectName}
Tasks: ${tasks.join(', ')}
Tech: ${techStack.join(', ')}

3 paragraphs: 1) Problem & Objective 2) What was built 3) Results & impact
Keep it concise and portfolio-ready.`, 800)
  return text
}

export async function generateResumeBullets(role: string, experience: string, projects: string[]): Promise<string> {
  const text = await geminiCall(`Generate ATS-optimized resume content:
Role: ${role}
Experience: ${experience}
Projects: ${projects.join(', ')}

Include: Professional Summary, 4 experience bullets, 4 project bullets, Skills section.
Use action verbs and metrics.`, 1000)
  return text
}

export async function generateLinkedInPost(milestone: string, skills: string[]): Promise<string> {
  const text = await geminiCall(`Write a LinkedIn post about: "${milestone}"
Skills used: ${skills.join(', ')}
3-4 short paragraphs, professional but human. End with 3 hashtags. Max 200 words.`, 400)
  return text
}

export async function generateCompletionSummary(
  title: string, completionRate: number, topSkills: string[], done: number, total: number
): Promise<string> {
  const text = await geminiCall(`Write a learning journey completion analysis:
Roadmap: ${title}
Completion: ${completionRate}% (${done}/${total} days)
Skills: ${topSkills.join(', ')}

2 paragraphs: what was accomplished, next steps. Be encouraging but realistic.`, 500)
  return text
}
