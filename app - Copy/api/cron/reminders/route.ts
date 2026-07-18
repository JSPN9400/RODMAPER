/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

import { NextRequest, NextResponse } from 'next/server'
import { scheduleReminders } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

// GET /api/cron/reminders — sends due reminder push notifications.
// Called on a schedule by either vercel.json's cron (Vercel Hobby plan only
// guarantees once/day — fine as a baseline, but too coarse for real
// per-minute reminder times) or, recommended, the GitHub Actions workflow
// at .github/workflows/reminders.yml (runs every 5 minutes, free, works
// regardless of Vercel plan tier).
//
// Protected by CRON_SECRET so the public internet can't trigger pushes.
// Set the same value for CRON_SECRET in both Vercel env vars and the
// repo's GitHub Actions secrets.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')

  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured on the server' }, { status: 500 })
  }
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await scheduleReminders()
  return NextResponse.json({ ok: true, ...result })
}
