/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

'use client'

export function PageSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:'12px' }}>
      <div className="spinner" style={{ width:'26px', height:'26px', borderWidth:'2.5px' }} />
      <p style={{ fontSize:'13px', color:'var(--text3)' }}>{label}</p>
    </div>
  )
}

export function PageError({ title, message }: { title: string; message: string }) {
  return (
    <div style={{ padding:'36px 24px', maxWidth:'480px', margin:'0 auto' }}>
      <div style={{ background:'var(--red-bg)', border:'1px solid rgba(187,100,83,0.2)', borderRadius:'14px', padding:'20px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <div style={{ fontSize: '18px', flexShrink: 0, lineHeight: 1 }}>⚠️</div>
        <div>
          <div style={{ fontSize:'15px', fontWeight:'600', color:'var(--text1)', marginBottom:'6px' }}>{title}</div>
          <div style={{ fontSize:'13px', color:'var(--red)', lineHeight:'1.5' }}>{message}</div>
        </div>
      </div>
    </div>
  )
}

// icon: a lucide-react component (preferred, matches the app's icon set) or
// a string/emoji fallback for callers that haven't been updated yet.
export function EmptyState({ icon: Icon, title, desc, action, tone = 'default' }: {
  icon?: any; title: string; desc?: string; action?: React.ReactNode; tone?: 'default' | 'accent'
}) {
  return (
    <div className="card-feed animate-slide-up" style={{ textAlign: 'center', padding: '44px 24px' }}>
      {Icon && (
        <div style={{
          width: '52px', height: '52px', borderRadius: '50%', margin: '0 auto 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: tone === 'accent' ? 'var(--accent-bg)' : 'var(--bg3)',
          border: `1px solid ${tone === 'accent' ? 'var(--accent-border)' : 'var(--border2)'}`,
        }}>
          {typeof Icon === 'string' ? (
            <span style={{ fontSize: '22px' }}>{Icon}</span>
          ) : (
            <Icon size={22} style={{ color: tone === 'accent' ? 'var(--accent3)' : 'var(--text3)' }} />
          )}
        </div>
      )}
      <h2 className="font-display" style={{ fontSize: '17px', fontWeight: '600', marginBottom: '8px', color: 'var(--text1)' }}>{title}</h2>
      {desc && <p style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: action ? '20px' : 0, lineHeight: '1.6', maxWidth: '360px', margin: `0 auto ${action ? '20px' : '0'}` }}>{desc}</p>}
      {action}
    </div>
  )
}

// --- Skeleton loading screens ------------------------------------------
// Shown instead of a spinner while the first page of data loads, so the
// layout that's about to appear is already legible as a shape.

function Shimmer({ style }: { style?: React.CSSProperties }) {
  return <div className="skeleton-block" style={style} />
}

export function DashboardSkeleton() {
  return (
    <div style={{ padding: '24px 16px 32px', maxWidth: '760px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div>
          <Shimmer style={{ width: '160px', height: '26px', marginBottom: '8px' }} />
          <Shimmer style={{ width: '200px', height: '14px' }} />
        </div>
        <Shimmer style={{ width: '90px', height: '36px', borderRadius: '999px' }} />
      </div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
        <Shimmer style={{ width: '124px', height: '76px', borderRadius: '14px' }} />
        <Shimmer style={{ width: '150px', height: '76px', borderRadius: '14px' }} />
        <Shimmer style={{ width: '124px', height: '76px', borderRadius: '14px' }} />
      </div>
      {[0, 1].map((i) => (
        <div key={i} className="card-feed" style={{ padding: '18px', marginBottom: '14px' }}>
          <Shimmer style={{ width: '70%', height: '18px', marginBottom: '10px' }} />
          <Shimmer style={{ width: '45%', height: '13px', marginBottom: '18px' }} />
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <Shimmer style={{ width: '72px', height: '72px', borderRadius: '50%' }} />
            <div style={{ flex: 1 }}>
              <Shimmer style={{ width: '90%', height: '15px', marginBottom: '8px' }} />
              <Shimmer style={{ width: '60%', height: '13px' }} />
            </div>
          </div>
          <Shimmer style={{ width: '100%', height: '8px', borderRadius: '999px' }} />
        </div>
      ))}
    </div>
  )
}

export function RoadmapDetailSkeleton() {
  return (
    <div style={{ padding: '20px 16px 80px', maxWidth: '820px', margin: '0 auto' }}>
      <Shimmer style={{ width: '90px', height: '13px', marginBottom: '12px' }} />
      <Shimmer style={{ width: '60%', height: '24px', marginBottom: '8px' }} />
      <Shimmer style={{ width: '40%', height: '14px', marginBottom: '20px' }} />
      <div className="card-feed" style={{ padding: '20px', marginBottom: '20px' }}>
        <Shimmer style={{ width: '80px', height: '30px', marginBottom: '10px' }} />
        <Shimmer style={{ width: '100%', height: '4px', marginBottom: '14px' }} />
        <Shimmer style={{ width: '100%', height: '22px' }} />
      </div>
      {[0, 1, 2, 3].map((i) => (
        <Shimmer key={i} style={{ width: '100%', height: '58px', borderRadius: '14px', marginBottom: '6px' }} />
      ))}
    </div>
  )
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Shimmer key={i} style={{ width: '100%', height: '64px', borderRadius: '14px' }} />
      ))}
    </div>
  )
}

export function TodaySkeleton() {
  return (
    <div style={{ padding: '20px 16px 40px', maxWidth: '480px', margin: '0 auto' }}>
      <Shimmer style={{ width: '50%', height: '20px', marginBottom: '18px' }} />
      <div className="card-feed" style={{ padding: '22px', minHeight: '480px' }}>
        <Shimmer style={{ width: '40%', height: '13px', marginBottom: '16px' }} />
        <Shimmer style={{ width: '85%', height: '22px', marginBottom: '10px' }} />
        <Shimmer style={{ width: '60%', height: '14px', marginBottom: '30px' }} />
        <Shimmer style={{ width: '100%', height: '90px', borderRadius: '12px', marginBottom: '16px' }} />
        <Shimmer style={{ width: '100%', height: '90px', borderRadius: '12px' }} />
      </div>
    </div>
  )
}
