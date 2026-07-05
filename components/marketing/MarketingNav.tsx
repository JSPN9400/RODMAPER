'use client'

import Link from 'next/link'

export default function MarketingNav() {
  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(9,9,11,0.85)',
        backdropFilter: 'blur(12px)',
        padding: '0 40px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Link href="/home" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800', color: '#fff' }}>R</div>
        <span style={{ fontSize: '15px', fontWeight: '700', color: '#fff', letterSpacing: '-0.3px' }}>RoadMaper</span>
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <Link href="/home#features" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Features</Link>
        <Link href="/pricing" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Pricing</Link>
        <Link href="/about" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>About</Link>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Link href="/login" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', padding: '7px 16px' }}>Sign in</Link>
        <Link href="/login" style={{ fontSize: '14px', fontWeight: '500', color: '#fff', textDecoration: 'none', padding: '7px 18px', background: '#7c3aed', borderRadius: '8px' }}>Get started free</Link>
      </div>
    </nav>
  )
}
