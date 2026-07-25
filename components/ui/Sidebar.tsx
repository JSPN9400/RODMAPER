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
import { LayoutDashboard, Zap, Map, Plus, Bell, BarChart2, Settings, LogOut, Brain, Sun, Moon, MessageCircle } from 'lucide-react'
import { useTheme } from '@/lib/theme-client'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, tile: 'cobalt' },
  { href: '/today', label: 'Today', icon: Zap, badge: 'LIVE', tile: 'mint' },
  { href: '/mentor', label: 'AI Mentor', icon: MessageCircle, badge: 'NEW', tile: 'pink' },
  { href: '/roadmap', label: 'Roadmaps', icon: Map, tile: 'sky' },
  { href: '/create', label: 'New Roadmap', icon: Plus, tile: 'mint' },
  { href: '/insights', label: 'AI Insights', icon: Brain, tile: 'teal' },
  { href: '/reminders', label: 'Reminders', icon: Bell, tile: 'amber' },
  { href: '/reports', label: 'Reports', icon: BarChart2, tile: 'sky' },
  { href: '/settings', label: 'Settings', icon: Settings, tile: 'gray' },
]

const MOBILE_NAV = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard, tile: 'cobalt' },
  { href: '/today', label: 'Today', icon: Zap, tile: 'mint' },
  { href: '/mentor', label: 'Mentor', icon: MessageCircle, tile: 'pink' },
  { href: '/create', label: 'Create', icon: Plus, tile: 'mint' },
  { href: '/settings', label: 'Settings', icon: Settings, tile: 'gray' },
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
        background: 'var(--bg2-solid)', borderRight: '1px solid var(--border)',
        boxShadow: '4px 0 24px -8px rgba(0,0,0,0.35)',
        flexDirection: 'column', zIndex: 40, backdropFilter: 'blur(20px)'
      }}>
        {/* Logo */}
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #4F6BFF, #93A5FF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: '700', color: '#FFFFFF'
            }}>R</div>
            <div>
              <div className="font-display" style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text1)', letterSpacing: '-0.3px' }}>RoadMaper</div>
              <div style={{ fontSize: '10px', color: 'var(--text4)' }}>AI Learning System</div>
            </div>
          </div>
        </div>

        {/* Nav — each item gets its own colored icon tile, iOS Settings-style */}
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {NAV.map(({ href, label, icon: Icon, badge, tile }: any) => {
            const active = isActive(href)
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '6px 8px', borderRadius: '10px',
                fontSize: '13px', fontWeight: active ? '600' : '500',
                color: active ? 'var(--text1)' : 'var(--text3)',
                background: active ? 'var(--bg4)' : 'transparent',
                textDecoration: 'none', transition: 'background 0.25s cubic-bezier(0.16,1,0.3,1), color 0.2s ease',
              }}>
                <div className={`icon-tile sm ${tile}`} style={{ opacity: active ? 1 : 0.55, transition: 'opacity 0.2s ease' }}>
                  <Icon size={14} />
                </div>
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
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #4F6BFF, #93A5FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: '#FFFFFF' }}>
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
        {MOBILE_NAV.map(({ href, label, icon: Icon, tile }) => {
          const active = isActive(href)
          const activeColor = `var(--cat-${tile})`
          return (
            <Link key={href} href={href} style={{
              position: 'relative',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              padding: '6px 14px', textDecoration: 'none', minWidth: '48px',
              color: active ? activeColor : 'var(--text4)',
              transition: 'color 0.2s ease',
            }}>
              <span style={{
                position: 'absolute', top: '-1px', left: '50%',
                width: active ? '18px' : '0px', height: '2.5px', borderRadius: '999px',
                background: activeColor, transform: 'translateX(-50%)',
                transition: 'width 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s ease',
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
