/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

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
