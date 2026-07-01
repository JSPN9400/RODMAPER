// lib/ai-generator.ts — Using Groq (FREE: 14,400 req/day)
import Groq from 'groq-sdk'
import { AIRoadmapInput, AIGeneratedRoadmap } from '@/types'

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
  const start = clean.indexOf('{') !== -1 ? clean.indexOf('{') : clean.indexOf('[')
  const endObj = clean.lastIndexOf('}')
  const endArr = clean.lastIndexOf(']')
  const end = Math.max(endObj, endArr)
  if (start !== -1 && end !== -1) clean = clean.slice(start, end + 1)
  return JSON.parse(clean)
}

// ─── NLU: Parse user intent ──────────────────────────────────────────────────
export async function parseUserIntent(rawInput: string): Promise<{
  goal: string; background: string; days: number;
  hoursPerDay: number; focusAreas: string; confidence: number; suggestions: string[]
}> {
  const text = await groqCall(`You are an NLU system for a learning roadmap app.
User input: "${rawInput}"
Fix spelling, parse intent, return ONLY valid JSON:
{"goal":"cleaned goal","background":"background if mentioned else empty","days":30,"hoursPerDay":4,"focusAreas":"focus areas","confidence":0.9,"suggestions":["tip1","tip2"]}
Return ONLY JSON.`, 800)
  try { return parseJSON(text) }
  catch { return { goal: rawInput, background: '', days: 30, hoursPerDay: 4, focusAreas: '', confidence: 0.5, suggestions: ['Be more specific about your target role'] } }
}

// ─── Main roadmap generator ──────────────────────────────────────────────────
export async function generateRoadmapWithAI(input: AIRoadmapInput): Promise<AIGeneratedRoadmap> {
  const prompt = `You are an expert learning roadmap designer. Create a personalized ${input.days}-day roadmap.

GOAL: ${input.goal}
BACKGROUND: ${input.background}
FOCUS: ${input.focusAreas || 'Based on goal'}
HOURS/DAY: ${input.hoursPerDay}

Return ONLY valid JSON:
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
      "day": 1, "projectIndex": 0,
      "title": "Topic Name",
      "description": "What to learn and build today",
      "techStack": [{"name": "Python", "type": "python"}],
      "resources": [{"name": "Resource (Free)", "url": "https://real-url.com"}]
    }
  ]
}

RULES:
- Use person background — make it relevant
- Every day = learn + build something real
- tech types: sql, python, bi, ai, git, js, other
- Real free resource URLs only
- Last project = Final Sprint (resume + job hunt)
- colors: violet, blue, green, amber, red, teal, pink
- Return ONLY JSON, no markdown`

  const text = await groqCall(prompt, 8000)
  return parseJSON(text) as AIGeneratedRoadmap
}

// ─── Self-learning analysis ──────────────────────────────────────────────────
export async function selfLearnFromProgress(data: {
  roadmapTitle: string; completionRate: number; skippedDays: number[];
  doneDays: number[]; topSkills: string[]; streakMax: number; avgDaysPerWeek: number
}): Promise<{
  insights: string[]; adjustments: { day: number; suggestion: string }[];
  nextSteps: string[]; motivationScore: number; learningStyle: string
}> {
  const text = await groqCall(`You are a learning coach AI. Analyze this student's progress:
Roadmap: ${data.roadmapTitle}
Completion: ${data.completionRate}%
Days Done: ${data.doneDays.length}, Max Streak: ${data.streakMax}
Days Skipped: ${data.skippedDays.slice(0,10).join(',')}
Skills: ${data.topSkills.join(', ')}

Return ONLY valid JSON:
{"insights":["insight1","insight2"],"adjustments":[{"day":5,"suggestion":"tip"}],"nextSteps":["step1","step2"],"motivationScore":75,"learningStyle":"Consistent Learner"}`, 1200)
  try { return parseJSON(text) }
  catch { return { insights: ['Keep going!'], adjustments: [], nextSteps: ['Complete today task'], motivationScore: 70, learningStyle: 'Active Learner' } }
}

// ─── Smart next task suggestion ──────────────────────────────────────────────
export async function suggestNextTask(context: {
  completedTopics: string[]; skippedTopics: string[]; goal: string; daysLeft: number
}): Promise<{ suggestedTopic: string; reason: string; resources: { name: string; url: string }[]; estimatedHours: number }> {
  const text = await groqCall(`Learning coach AI. Suggest best next task.
Goal: ${context.goal}
Completed: ${context.completedTopics.slice(-5).join(', ')}
Struggled: ${context.skippedTopics.join(', ')}
Days left: ${context.daysLeft}
Return ONLY JSON: {"suggestedTopic":"topic","reason":"why","resources":[{"name":"name","url":"https://url.com"}],"estimatedHours":2}`, 600)
  try { return parseJSON(text) }
  catch { return { suggestedTopic: 'Review and practice', reason: 'Consolidate learning', resources: [{ name: 'Khan Academy', url: 'https://khanacademy.org' }], estimatedHours: 2 } }
}

// ─── Other helpers ───────────────────────────────────────────────────────────
export async function generateCaseStudy(projectName: string, tasks: string[], techStack: string[]): Promise<string> {
  return groqCall(`Write a professional portfolio case study:
Project: ${projectName}, Tasks: ${tasks.join(', ')}, Tech: ${techStack.join(', ')}
3 paragraphs: 1) Problem & Objective 2) What was built 3) Results & impact. Be concise.`, 700)
}

export async function generateResumeBullets(role: string, experience: string, projects: string[]): Promise<string> {
  return groqCall(`Generate ATS-optimized resume content:
Role: ${role}, Experience: ${experience}, Projects: ${projects.join(', ')}
Include: Professional Summary, 4 experience bullets, 4 project bullets, Skills section. Use action verbs and metrics.`, 900)
}

export async function generateLinkedInPost(milestone: string, skills: string[]): Promise<string> {
  return groqCall(`Write a LinkedIn post about: "${milestone}". Skills: ${skills.join(', ')}.
3-4 short paragraphs, professional but human. End with 3 hashtags. Max 200 words.`, 350)
}

export async function generateCompletionSummary(title: string, completionRate: number, topSkills: string[], done: number, total: number): Promise<string> {
  return groqCall(`Write a learning journey analysis:
Roadmap: ${title}, Completion: ${completionRate}% (${done}/${total} days), Skills: ${topSkills.join(', ')}
2 paragraphs: accomplishments and next steps. Be encouraging but realistic.`, 450)
}
