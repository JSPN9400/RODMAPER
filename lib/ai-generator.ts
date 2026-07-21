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

async function geminiCall(prompt: string): Promise<string> {
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
    contents: prompt,
    config: {
      temperature: 0.7,
    }
  })

  return response.text || ''
}

async function groqCall(prompt: string, maxTokens = 8000): Promise<string> {
  const hasGroq = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== ''
  if (!hasGroq) {
    console.log("[AI Studio] GROQ_API_KEY not configured, falling back to Gemini")
    return geminiCall(prompt)
  }

  try {
    const client = getClient()
    const res = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: maxTokens,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    })
    return res.choices[0]?.message?.content || ''
  } catch (err) {
    console.warn("[AI Studio] Groq API failed, falling back to Gemini:", err)
    return geminiCall(prompt)
  }
}

function parseJSON(text: string): any {
  let clean = text.replace(/```json|```/g, '').trim()
  const s = clean.indexOf('{') !== -1 ? clean.indexOf('{') : clean.indexOf('[')
  const e = Math.max(clean.lastIndexOf('}'), clean.lastIndexOf(']'))
  if (s !== -1 && e !== -1) clean = clean.slice(s, e + 1)
  return JSON.parse(clean)
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
