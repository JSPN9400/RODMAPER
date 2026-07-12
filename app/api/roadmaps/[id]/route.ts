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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const roadmap = await prisma.roadmap.findFirst({
    where: { id, userId: session.user.id },
    include: { projects: { orderBy: { order: 'asc' } }, tasks: { orderBy: { day: 'asc' } }, reminders: true, report: true, phases: { orderBy: { order: 'asc' } } }
  })
  if (!roadmap) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(roadmap)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const roadmap = await prisma.roadmap.findFirst({ where: { id, userId: session.user.id } })
  if (!roadmap) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.roadmap.update({
    where: { id },
    data: {
      ...(body.title && { title: body.title }),
      ...(body.goal && { goal: body.goal }),
      ...(body.status && { status: body.status }),
      ...(body.color && { color: body.color }),
    }
  })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const roadmap = await prisma.roadmap.findFirst({ where: { id, userId: session.user.id } })
  if (!roadmap) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.roadmap.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
