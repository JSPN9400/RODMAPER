'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import Image from 'next/image'
import { LayoutDashboard, Map, Plus, Bell, BarChart2, Settings, LogOut, Zap, Brain } from 'lucide-react'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/today', label: 'Today', icon: Zap, badge: 'LIVE' },
  { href: '/roadmap', label: 'Roadmaps', icon: Map },
  { href: '/create', label: 'New Roadmap', icon: Plus },
  { href: '/insights', label: 'AI Insights', icon: Brain, badge: 'NEW' },
  { href: '/reminders', label: 'Reminders', icon: Bell },
  { href: '/reports', label: 'Reports', icon: BarChart2 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ user }: { user: any }) {
  const path = usePathname()
  const isActive = (href: string) => href === '/dashboard' ? path === href : path.startsWith(href)

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, height: '100vh', width: '220px',
      background: 'var(--bg2)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', zIndex: 40
    }}>
      <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: '700', color: '#fff', flexShrink: 0
          }}>R</div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text1)', letterSpacing: '-0.3px' }}>RoadMaper</div>
            <div style={{ fontSize: '10px', color: 'var(--text4)', marginTop: '1px' }}>AI Learning System</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {NAV.map(({ href, label, icon: Icon, badge }: any) => {
          const active = isActive(href)
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: '9px',
              padding: '7px 10px', borderRadius: '7px',
              fontSize: '13px', fontWeight: active ? '500' : '400',
              color: active ? 'var(--text1)' : 'var(--text3)',
              background: active ? 'var(--bg4)' : 'transparent',
              textDecoration: 'none', transition: 'all 0.12s',
              border: active ? '1px solid var(--border2)' : '1px solid transparent'
            }}>
              <Icon size={14} style={{ flexShrink: 0, color: active ? 'var(--accent3)' : 'inherit' }} />
              <span style={{ flex: 1 }}>{label}</span>
              {badge && (
                <span style={{
                  fontSize: '9px', fontWeight: '600', padding: '1px 5px',
                  background: badge === 'NEW' ? 'var(--accent-bg)' : 'var(--green-bg)',
                  color: badge === 'NEW' ? 'var(--accent3)' : 'var(--green)',
                  border: `1px solid ${badge === 'NEW' ? 'var(--accent-border)' : 'var(--green-border)'}`,
                  borderRadius: '3px', letterSpacing: '0.04em'
                }}>{badge}</span>
              )}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '10px 8px', borderTop: '1px solid var(--border)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '9px',
          padding: '8px 10px', borderRadius: '8px',
          background: 'var(--bg3)', border: '1px solid var(--border)'
        }}>
          {user?.image ? (
            <Image src={user.image} alt="" width={24} height={24} style={{ borderRadius: '50%', flexShrink: 0 }} />
          ) : (
            <div style={{
              width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: '700', color: '#fff'
            }}>{(user?.name || user?.email || 'U')[0].toUpperCase()}</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || user?.email?.split('@')[0] || 'User'}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </div>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/login' })} title="Sign out" style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text4)', padding: '2px', borderRadius: '4px',
            display: 'flex', alignItems: 'center', transition: 'color 0.12s', flexShrink: 0
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--red)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text4)'}
          ><LogOut size={13} /></button>
        </div>
      </div>
    </aside>
  )
}
