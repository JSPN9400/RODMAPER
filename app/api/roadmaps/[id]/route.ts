// app/api/roadmaps/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateReport } from '@/lib/report-generator'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const roadmap = await prisma.roadmap.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: {
      projects: { orderBy: { order: 'asc' } },
      tasks: { orderBy: { day: 'asc' } },
      reminders: true,
      report: true
    }
  })

  if (!roadmap) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(roadmap)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const roadmap = await prisma.roadmap.findFirst({
    where: { id: params.id, userId: session.user.id }
  })
  if (!roadmap) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.roadmap.update({
    where: { id: params.id },
    data: {
      ...(body.title && { title: body.title }),
      ...(body.goal && { goal: body.goal }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.status && { status: body.status }),
      ...(body.color && { color: body.color }),
    }
  })

  // Auto-generate report if status changed to COMPLETED
  if (body.status === 'COMPLETED') {
    await generateReport(params.id).catch(console.error)
  }

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const roadmap = await prisma.roadmap.findFirst({
    where: { id: params.id, userId: session.user.id }
  })
  if (!roadmap) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.roadmap.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
