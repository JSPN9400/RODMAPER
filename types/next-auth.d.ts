/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

import 'next-auth'
declare module 'next-auth' {
  interface Session {
    user: { id: string; name?: string | null; email?: string | null; image?: string | null }
  }
}
