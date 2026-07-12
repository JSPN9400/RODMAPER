/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import Image from 'next/image'
import { LayoutDashboard, Zap, Map, Plus, Bell, BarChart2, Settings, LogOut, Brain } from 'lucide-react'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/today', label: 'Today', icon: Zap, badge: 'LIVE' },
  { href: '/roadmap', label: 'Roadmaps', icon: Map },
  { href: '/create', label: 'New Roadmap', icon: Plus },
  { href: '/insights', label: 'AI Insights', icon: Brain },
  { href: '/reminders', label: 'Reminders', icon: Bell },
  { href: '/reports', label: 'Reports', icon: BarChart2 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

const MOBILE_NAV = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/today', label: 'Today', icon: Zap },
  { href: '/create', label: 'Create', icon: Plus },
  { href: '/reports', label: 'Reports', icon: BarChart2 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ user }: { user: any }) {
  const path = usePathname()
  const isActive = (href: string) => href === '/dashboard' ? path === href : path.startsWith(href)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="desktop-only" style={{
        position: 'fixed', left: 0, top: 0, height: '100vh', width: '220px',
        background: 'rgba(10,10,10,0.95)', borderRight: '1px solid var(--border)',
        flexDirection: 'column', zIndex: 40, backdropFilter: 'blur(20px)'
      }}>
        {/* Logo */}
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: '700', color: '#fff'
            }}>R</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', letterSpacing: '-0.3px' }}>RoadMaper</div>
              <div style={{ fontSize: '10px', color: 'var(--text4)' }}>AI Learning System</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {NAV.map(({ href, label, icon: Icon, badge }: any) => {
            const active = isActive(href)
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: '9px',
                padding: '7px 10px', borderRadius: '8px',
                fontSize: '13px', fontWeight: active ? '500' : '400',
                color: active ? '#fff' : 'var(--text3)',
                background: active ? 'rgba(124,58,237,0.15)' : 'transparent',
                textDecoration: 'none', transition: 'all 0.12s',
                border: active ? '1px solid rgba(124,58,237,0.2)' : '1px solid transparent'
              }}>
                <Icon size={14} style={{ color: active ? '#a78bfa' : 'inherit', flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{label}</span>
                {badge && (
                  <span style={{ fontSize: '9px', fontWeight: '700', padding: '1px 5px', background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid var(--green-border)', borderRadius: '3px' }}>{badge}</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div style={{ padding: '10px 8px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 10px', borderRadius: '8px', background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            {user?.image ? (
              <Image src={user.image} alt="" width={24} height={24} style={{ borderRadius: '50%' }} />
            ) : (
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: '#fff' }}>
                {(user?.name || user?.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: '500', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || user?.email?.split('@')[0]}</div>
              <div style={{ fontSize: '10px', color: 'var(--text4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
            </div>
            <button onClick={() => signOut({ callbackUrl: '/login' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text4)', display: 'flex' }}>
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="bottom-nav mobile-only">
        {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link key={href} href={href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              padding: '6px 12px', textDecoration: 'none',
              color: active ? '#a78bfa' : 'var(--text4)', transition: 'color 0.15s'
            }}>
              <Icon size={20} />
              <span style={{ fontSize: '10px', fontWeight: active ? '600' : '400' }}>{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
