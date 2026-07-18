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

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const roadmap = await prisma.roadmap.findFirst({ where: { id: body.roadmapId, userId: session.user.id } })
  if (!roadmap) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const reminder = await prisma.reminder.create({ data: { roadmapId: body.roadmapId, time: body.time||'09:00', enabled: body.enabled??true, message: body.message||null, days: body.days||[1,2,3,4,5,6,7] } })
  return NextResponse.json(reminder, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { id, ...updates } = body
  const reminder = await prisma.reminder.findFirst({ where: { id, roadmap: { userId: session.user.id } } })
  if (!reminder) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const updated = await prisma.reminder.update({ where: { id }, data: { ...(updates.time!==undefined&&{time:updates.time}), ...(updates.enabled!==undefined&&{enabled:updates.enabled}), ...(updates.message!==undefined&&{message:updates.message}), ...(updates.days!==undefined&&{days:updates.days}) } })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const reminder = await prisma.reminder.findFirst({ where: { id, roadmap: { userId: session.user.id } } })
  if (!reminder) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await prisma.reminder.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
