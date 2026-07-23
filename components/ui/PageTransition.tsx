/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

'use client'
import { usePathname } from 'next/navigation'

// Wraps page content and keys it by pathname — React unmounts/remounts the
// subtree on every route change, which retriggers the `.page-enter` CSS
// animation in globals.css. No animation library needed: this is a plain
// CSS keyframe, so it works in every browser without feature-detection.
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  )
}
