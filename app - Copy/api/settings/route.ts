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

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const settings = await prisma.settings.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id },
    update: {},
  })
  return NextResponse.json(settings)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const updated = await prisma.settings.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      ...(body.timezone !== undefined && { timezone: body.timezone }),
      ...(body.notificationsEnabled !== undefined && { notificationsEnabled: body.notificationsEnabled }),
      ...(body.defaultReminderTime !== undefined && { defaultReminderTime: body.defaultReminderTime }),
      ...(body.theme !== undefined && { theme: body.theme }),
    },
    update: {
      ...(body.timezone !== undefined && { timezone: body.timezone }),
      ...(body.notificationsEnabled !== undefined && { notificationsEnabled: body.notificationsEnabled }),
      ...(body.defaultReminderTime !== undefined && { defaultReminderTime: body.defaultReminderTime }),
      ...(body.theme !== undefined && { theme: body.theme }),
    },
  })
  return NextResponse.json(updated)
}
