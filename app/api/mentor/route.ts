/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { askMentor } from '@/lib/mentor'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const messages = await prisma.message.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'asc' },
    take: 100,
  })
  return NextResponse.json(messages)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const message = (body.message || '').trim()
  if (!message) return NextResponse.json({ error: 'message is required' }, { status: 400 })
  if (message.length > 2000) return NextResponse.json({ error: 'Message is too long' }, { status: 400 })

  try {
    const reply = await askMentor(session.user.id, body.roadmapId || null, message)
    return NextResponse.json({ reply })
  } catch (err: any) {
    console.error('[mentor] askMentor failed:', err)
    // Don't always blame API keys — that was misleading whenever the real
    // cause was something else (most commonly: the Message/Reflection/
    // Challenge tables not existing yet because `npx prisma db push`
    // hadn't been run after those models were added to the schema).
    const msg = String(err?.message || '')
    const code = err?.code
    let userMessage = 'The mentor hit an unexpected error — try again in a moment.'
    if (code === 'P2021' || msg.includes('does not exist') || msg.includes('Unknown table') || msg.includes('relation') && msg.includes('does not exist')) {
      userMessage = 'The database is missing a required table — run `npx prisma db push` against your production database, then try again.'
    } else if (msg.includes('GROQ_API_KEY') || msg.includes('GEMINI_API_KEY')) {
      userMessage = 'No AI provider is configured — set GROQ_API_KEY or GEMINI_API_KEY in your environment variables and redeploy.'
    } else if (msg.toLowerCase().includes('401') || msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('invalid api key') || msg.toLowerCase().includes('api key not valid')) {
      userMessage = 'The configured AI provider rejected the request — double-check the API key value has no extra spaces or quotes, and that it hasn\u2019t expired.'
    } else if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('quota')) {
      userMessage = 'The AI provider is rate-limited right now — wait a moment and try again.'
    }
    return NextResponse.json({ error: userMessage }, { status: 502 })
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.message.deleteMany({ where: { userId: session.user.id } })
  return NextResponse.json({ success: true })
}
