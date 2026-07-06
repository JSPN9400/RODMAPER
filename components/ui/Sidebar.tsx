'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import Image from 'next/image'
import { BarChart2, Brain, Home, LogOut, MapPinned, PlusSquare, Settings, User } from 'lucide-react'

const NAV = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/today', label: 'Today', icon: MapPinned },
  { href: '/create', label: 'Create', icon: PlusSquare },
  { href: '/reports', label: 'Reports', icon: BarChart2 },
  { href: '/settings', label: 'Profile', icon: User },
]

const DESKTOP_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/today', label: 'Today', icon: MapPinned },
  { href: '/create', label: 'New Roadmap', icon: PlusSquare },
  { href: '/insights', label: 'AI Insights', icon: Brain },
  { href: '/reports', label: 'Reports', icon: BarChart2 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ user }: { user: any }) {
  const pathname = usePathname()
  const isActive = (href: string) => href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  return (
    <>
      <aside
        className="desktop-only"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          height: '100vh',
          width: '240px',
          background: 'rgba(0,0,0,0.88)',
          backdropFilter: 'blur(18px)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 40,
        }}
      >
        <div style={{ padding: '20px 18px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '14px', background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '800', color: '#fff' }}>R</div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '800' }}>RoadMaper</div>
              <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Universal AI Study Feed</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {DESKTOP_NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className="card-feed"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  textDecoration: 'none',
                  background: active ? 'var(--bg3)' : 'transparent',
                  borderColor: active ? 'var(--border3)' : 'transparent',
                }}
              >
                <Icon size={18} style={{ color: active ? 'var(--accent3)' : 'var(--text2)' }} />
                <span style={{ fontSize: '14px', fontWeight: active ? '700' : '500', color: active ? 'var(--text1)' : 'var(--text2)' }}>{label}</span>
              </Link>
            )
          })}
        </nav>

        <div style={{ padding: '12px 10px 18px', borderTop: '1px solid var(--border)' }}>
          <div className="card-feed" style={{ padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {user?.image ? (
                <Image src={user.image} alt="" width={36} height={36} style={{ borderRadius: '50%' }} />
              ) : (
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700' }}>
                  {(user?.name || user?.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: '700' }}>{user?.name || 'User'}</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
              </div>
              <button onClick={() => signOut({ callbackUrl: '/login' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)' }}>
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <nav className="bottom-nav mobile-only">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link key={href} href={href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', textDecoration: 'none', color: active ? 'var(--text1)' : 'var(--text3)' }}>
              <Icon size={20} style={{ color: active ? 'var(--accent3)' : 'currentColor' }} />
              <span style={{ fontSize: '10px', fontWeight: active ? '700' : '500' }}>{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
