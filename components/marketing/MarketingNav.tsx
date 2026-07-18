/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

'use client'

import Link from 'next/link'

export default function MarketingNav() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-[60px] flex items-center justify-between border-b border-white/[0.06] bg-zinc-950/85 backdrop-blur-md px-4 sm:px-10"
    >
      <Link href="/" className="flex items-center gap-2.5 no-underline">
        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #C88A3D, #E8C084)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800', color: '#fff' }}>R</div>
        <span style={{ fontSize: '15px', fontWeight: '700', color: '#fff', letterSpacing: '-0.3px' }}>RoadMaper</span>
      </Link>
      <div className="hidden md:flex items-center gap-8">
        <Link href="/#features" className="text-sm text-white/60 hover:text-white transition no-underline">Features</Link>
        <Link href="/pricing" className="text-sm text-white/60 hover:text-white transition no-underline">Pricing</Link>
        <Link href="/about" className="text-sm text-white/60 hover:text-white transition no-underline">About</Link>
      </div>
      <div className="flex items-center gap-1 sm:gap-3">
        <Link href="/login" className="text-xs sm:text-sm text-white/60 hover:text-white transition no-underline py-1.5 px-2 sm:px-4">Sign in</Link>
        <Link href="/login" className="text-[11px] sm:text-sm font-medium text-white no-underline py-1.5 px-3 sm:px-4.5 cta-brass rounded-lg transition shrink-0 whitespace-nowrap">Get started free</Link>
      </div>
    </nav>
  )
}
