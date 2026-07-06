import Groq from 'groq-sdk'
import { AIRoadmapInput, AIGeneratedRoadmap, StudyDomain } from '@/types'

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
    messages: [{ role: 'user', content: prompt }],
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

type ParsedIntent = {
  goal: string
  background: string
  days: number
  hoursPerDay: number
  focusAreas: string
  studyDomain: StudyDomain
  confidence: number
  suggestions: string[]
}

export async function parseUserIntent(rawInput: string): Promise<ParsedIntent> {
  const text = await groqCall(`You are an NLU system for a universal learning roadmap app.
User input: "${rawInput}"

Fix spelling, understand the intent, and return ONLY valid JSON:
{"goal":"cleaned goal","background":"background if mentioned else empty","days":30,"hoursPerDay":3,"focusAreas":"focus areas","studyDomain":"technology","confidence":0.9,"suggestions":["tip1","tip2"]}

Allowed studyDomain values:
technology, science, mathematics, medical, commerce, arts, language, business, exam, other

Choose the best matching domain from the input.
Return ONLY JSON.`, 900)

  try {
    return parseJSON(text)
  } catch {
    return {
      goal: rawInput,
      background: '',
      days: 30,
      hoursPerDay: 3,
      focusAreas: '',
      studyDomain: 'other',
      confidence: 0.5,
      suggestions: ['Add your class, field, or target exam for a more precise roadmap'],
    }
  }
}

export async function generateRoadmapWithAI(input: AIRoadmapInput): Promise<AIGeneratedRoadmap> {
  const domain = input.studyDomain || 'other'

  const prompt = `You are an expert learning roadmap designer for students and professionals across all sectors.

Create a personalized ${input.days}-day roadmap for this learner.

GOAL: ${input.goal}
DOMAIN: ${domain}
BACKGROUND: ${input.background}
FOCUS: ${input.focusAreas || 'Based on the goal and learner profile'}
HOURS_PER_DAY: ${input.hoursPerDay}

The learner could be anyone from class 10, class 12, college, competitive exam preparation, working professional, or PhD level.

Return ONLY valid JSON:
{
  "title": "${input.days}-Day ${input.goal} Roadmap",
  "goal": "${input.goal}",
  "description": "2 sentence learner-friendly description",
  "days": ${input.days},
  "projects": [
    {"name": "Foundation", "color": "violet", "startDay": 1, "endDay": 8}
  ],
  "tasks": [
    {
      "day": 1,
      "projectIndex": 0,
      "title": "Topic Name",
      "description": "What to study, practice, revise, solve, write, observe, or create today",
      "techStack": [{"name": "Algebra", "type": "mathematics"}],
      "resources": [{"name": "Resource (Free)", "url": "https://real-url.com"}]
    }
  ]
}

RULES:
- This app is for all sectors and all learner levels, not just tech
- Make the roadmap practical and easy to follow
- Use the learner's background to tune the difficulty
- Daily tasks must match the domain:
  technology: coding, projects, debugging, portfolio, interview prep
  science: concepts, derivations, numericals, experiments, notes, revision
  mathematics: theory, worked examples, problem sets, revision, tests
  medical: concepts, diagrams, MCQs, case review, recall, revision
  commerce: accounts, economics, business studies, numericals, case practice
  arts: reading, writing, analysis, memory work, answer practice
  language: grammar, vocabulary, reading, listening, speaking, writing
  business: strategy, analysis, finance basics, market study, execution tasks
  exam: syllabus split, topic study, revision, mock tests, answer practice
  other: adapt intelligently to the learner's field
- Keep the workload realistic for ${input.hoursPerDay} hours/day
- Include revision checkpoints and lighter review days when helpful
- "projects" means phases/modules/tracks. For non-project learning use labels like Foundation, Core Concepts, Practice Phase, Revision Sprint, Mock Test Phase, Final Review
- techStack is a generic tags array, not just software tech
- Allowed tag types: sql, python, bi, ai, git, js, design, physics, chemistry, biology, mathematics, medical, commerce, language, research, other
- Use real free resource URLs only
- Use colors from: violet, blue, green, amber, red, teal, pink
- Return ONLY JSON, no markdown`

  const text = await groqCall(prompt, 8000)
  return parseJSON(text) as AIGeneratedRoadmap
}

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
  const text = await groqCall(`You are a learning coach AI. Analyze this student's progress:
Roadmap: ${data.roadmapTitle}
Completion: ${data.completionRate}%
Days Done: ${data.doneDays.length}, Max Streak: ${data.streakMax}
Days Skipped: ${data.skippedDays.slice(0, 10).join(',')}
Skills/Topics: ${data.topSkills.join(', ')}

Return ONLY valid JSON:
{"insights":["insight1","insight2"],"adjustments":[{"day":5,"suggestion":"tip"}],"nextSteps":["step1","step2"],"motivationScore":75,"learningStyle":"Consistent Learner"}`, 1200)

  try {
    return parseJSON(text)
  } catch {
    return {
      insights: ['Keep going and stay consistent.'],
      adjustments: [],
      nextSteps: ['Complete today’s task', 'Review one previously difficult topic'],
      motivationScore: 70,
      learningStyle: 'Active Learner',
    }
  }
}

export async function suggestNextTask(context: {
  completedTopics: string[]
  skippedTopics: string[]
  goal: string
  daysLeft: number
}): Promise<{ suggestedTopic: string; reason: string; resources: { name: string; url: string }[]; estimatedHours: number }> {
  const text = await groqCall(`Learning coach AI. Suggest the best next task.
Goal: ${context.goal}
Completed: ${context.completedTopics.slice(-5).join(', ')}
Struggled: ${context.skippedTopics.join(', ')}
Days left: ${context.daysLeft}
Return ONLY JSON: {"suggestedTopic":"topic","reason":"why","resources":[{"name":"name","url":"https://url.com"}],"estimatedHours":2}`, 600)

  try {
    return parseJSON(text)
  } catch {
    return {
      suggestedTopic: 'Review and practice',
      reason: 'Consolidate learning before moving ahead',
      resources: [{ name: 'Khan Academy', url: 'https://www.khanacademy.org' }],
      estimatedHours: 2,
    }
  }
}

export async function generateCaseStudy(projectName: string, tasks: string[], techStack: string[]): Promise<string> {
  return groqCall(`Write a professional portfolio case study:
Project: ${projectName}, Tasks: ${tasks.join(', ')}, Topics: ${techStack.join(', ')}
3 paragraphs: 1) Problem & Objective 2) What was done 3) Results & impact. Be concise.`, 700)
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
Roadmap: ${title}, Completion: ${completionRate}% (${done}/${total} days), Skills/Topics: ${topSkills.join(', ')}
2 paragraphs: accomplishments and next steps. Be encouraging but realistic.`, 450)
}
