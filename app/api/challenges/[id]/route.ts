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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const challenge = await prisma.challenge.findFirst({ where: { id, userId: session.user.id } })
  if (!challenge) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.challenge.update({
    where: { id },
    data: { completed: true, completedAt: new Date() },
  })
  return NextResponse.json(updated)
}

// Dismiss without completing — the user gets to decide this isn't useful
// right now rather than being stuck with it; a new one can still be
// generated later if the underlying signal (overdue tasks / broken streak)
// is still there.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const challenge = await prisma.challenge.findFirst({ where: { id, userId: session.user.id } })
  if (!challenge) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.challenge.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
