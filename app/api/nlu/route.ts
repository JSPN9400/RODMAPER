// app/api/nlu/route.ts
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { privateJson } from '@/lib/api-response'
import { authOptions } from '@/lib/auth'
import { parseUserIntent } from '@/lib/ai-generator'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return privateJson({ error: 'Unauthorized' }, { status: 401 })

  const { input } = await req.json()
  if (!input?.trim()) return privateJson({ error: 'Input required' }, { status: 400 })

  try {
    const parsed = await parseUserIntent(input)
    return privateJson(parsed)
  } catch (error: any) {
    return privateJson({ error: error.message }, { status: 500 })
  }
}
