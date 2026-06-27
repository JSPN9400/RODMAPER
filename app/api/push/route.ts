// app/api/push/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sub = await req.json()

  await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    create: {
      userId: session.user.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth
    },
    update: {
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth
    }
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { endpoint } = await req.json()
  await prisma.pushSubscription.deleteMany({
    where: { endpoint, userId: session.user.id }
  })
  return NextResponse.json({ success: true })
}
