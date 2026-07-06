import { NextResponse } from 'next/server'

type JsonInit = ResponseInit & {
  headers?: HeadersInit
}

export function privateJson(data: unknown, init: JsonInit = {}, maxAge = 30) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...init.headers,
      'Cache-Control': `private, max-age=${maxAge}`,
    },
  })
}
