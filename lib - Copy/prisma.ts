/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

import { PrismaClient } from '@prisma/client'

// A single, reused PrismaClient instance — prevents exhausting database
// connections from hot-reloading in dev, where this module would
// otherwise be re-evaluated on every file change.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Deliberately no fallback to a mock/local database when DATABASE_URL is
// missing. A misconfigured production database should fail loudly at
// startup (a clear Prisma connection error) rather than silently degrade
// to fake, non-persistent data — the latter is much harder to debug and
// far more dangerous for a real deployment with real user accounts.
if (!process.env.DATABASE_URL) {
  console.error(
    '[RoadMaper] DATABASE_URL is not set. Every database-backed feature ' +
    'will fail. Set it in .env.local (dev) or your hosting provider\'s ' +
    'environment variables (production) — see README.md §6.'
  )
}
