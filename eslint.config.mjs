/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

// ESLint 9 dropped support for the legacy .eslintrc.json format in favor
// of "flat config" (this file). FlatCompat bridges older shareable
// configs like "next/core-web-vitals" (which still ship in the legacy
// format) into something ESLint 9 understands. This replaces the previous
// .eslintrc.json, which was silently crashing the linter during
// `next build` (a circular-structure error when Next tried to merge it) —
// the build kept succeeding anyway because Next treats a crashing linter
// as non-fatal, but no linting was actually running.

import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends('next/core-web-vitals'),
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**'],
  },
]

export default eslintConfig
