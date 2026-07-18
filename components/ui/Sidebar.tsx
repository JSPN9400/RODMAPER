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
import { LayoutDashboard, Zap, Map, Plus, Bell, BarChart2, Settings, LogOut, Brain, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/lib/theme-client'

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
  const [theme, setTheme] = useTheme()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="desktop-only" style={{
        position: 'fixed', left: 0, top: 0, height: '100vh', width: '220px',
        background: 'rgba(20,18,15,0.95)', borderRight: '1px solid var(--border)',
        flexDirection: 'column', zIndex: 40, backdropFilter: 'blur(20px)'
      }}>
        {/* Logo */}
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #C88A3D, #E8C084)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: '700', color: '#1A1410'
            }}>R</div>
            <div>
              <div className="font-display" style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text1)', letterSpacing: '-0.3px' }}>RoadMaper</div>
              <div style={{ fontSize: '10px', color: 'var(--text4)' }}>AI Learning System</div>
            </div>
          </div>
        </div>

        {/* Nav — laid out as waypoints along a route, echoing the brand */}
        <nav className="route-line" style={{ flex: 1, padding: '14px 8px 10px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {NAV.map(({ href, label, icon: Icon, badge }: any) => {
            const active = isActive(href)
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '6px 10px 6px 4px', borderRadius: '8px',
                fontSize: '13px', fontWeight: active ? '600' : '400',
                color: active ? 'var(--text1)' : 'var(--text3)',
                background: active ? 'rgba(200,138,61,0.13)' : 'transparent',
                textDecoration: 'none', transition: 'all 0.12s',
                border: active ? '1px solid var(--accent-border)' : '1px solid transparent'
              }}>
                <span className={`route-dot ${active ? 'done' : ''}`} />
                <Icon size={14} style={{ color: active ? '#E8C084' : 'inherit', flexShrink: 0 }} />
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
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #C88A3D, #E8C084)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: '#1A1410' }}>
                {(user?.name || user?.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || user?.email?.split('@')[0]}</div>
              <div style={{ fontSize: '10px', color: 'var(--text4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
            </div>
            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} title={theme === 'light' ? 'Switch to dark' : 'Switch to light'} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text4)', display: 'flex' }}>
              {theme === 'light' ? <Moon size={13} /> : <Sun size={13} />}
            </button>
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
              position: 'relative',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              padding: '6px 14px', textDecoration: 'none', minWidth: '48px',
              color: active ? '#E8C084' : 'var(--text4)',
              transition: 'color 0.2s ease',
            }}>
              <span style={{
                position: 'absolute', top: '-1px', left: '50%',
                width: active ? '18px' : '0px', height: '2.5px', borderRadius: '999px',
                background: 'var(--grad)', transform: 'translateX(-50%)',
                transition: 'width 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }} />
              <Icon size={20} style={{ transform: active ? 'translateY(-1px) scale(1.06)' : 'none', transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
              <span style={{ fontSize: '10px', fontWeight: active ? '600' : '400', transition: 'font-weight 0.15s' }}>{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
