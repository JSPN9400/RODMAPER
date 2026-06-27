// app/api/reports/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateReport } from '@/lib/report-generator'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { roadmapId } = await req.json()

  const roadmap = await prisma.roadmap.findFirst({
    where: { id: roadmapId, userId: session.user.id }
  })
  if (!roadmap) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const report = await generateReport(roadmapId)
  return NextResponse.json(report)
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const roadmapId = searchParams.get('roadmapId')
  if (!roadmapId) return NextResponse.json({ error: 'Missing roadmapId' }, { status: 400 })

  const report = await prisma.report.findUnique({
    where: { roadmapId },
    include: { roadmap: { select: { title: true, goal: true, userId: true } } }
  })

  if (!report || report.roadmap.userId !== session.user.id)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(report)
}
