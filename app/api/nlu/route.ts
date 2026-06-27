// app/api/nlu/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { parseUserIntent } from '@/lib/ai-generator'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { input } = await req.json()
  if (!input?.trim()) return NextResponse.json({ error: 'Input required' }, { status: 400 })

  try {
    const parsed = await parseUserIntent(input)
    return NextResponse.json(parsed)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
