'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Flame, MoreHorizontal, Plus, Sparkles, Trophy } from 'lucide-react'
import { PageError, PageSpinner } from '@/components/ui/PageState'

function ProgressRing({ value, color }: { value: number; color: string }) {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="none" />
      <circle className="ring-progress" cx="36" cy="36" r={radius} stroke={color} strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={offset} fill="none" />
      <text x="36" y="41" textAnchor="middle" fill="white" fontSize="14" fontWeight="700">{value}%</text>
    </svg>
  )
}

export default function DashboardPage() {
  const [roadmaps, setRoadmaps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/roadmaps')
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || 'Failed to load dashboard')
        setRoadmaps(Array.isArray(data) ? data : [])
      })
      .catch((err) => setError(err.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageSpinner label="Loading your feed..." />
  if (error) return <PageError title="Dashboard could not load" message={error} />

  const active = roadmaps.filter((rm) => rm.status === 'ACTIVE')
  const totalDone = roadmaps.reduce((sum, rm) => sum + (rm.doneCount || 0), 0)
  const streak = Math.max(1, active.length ? Math.min(9, active.length + 2) : 1)

  return (
    <div style={{ padding: '24px 16px 32px', maxWidth: '760px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div>
          <div style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>Welcome back</div>
          <div style={{ fontSize: '13px', color: 'var(--text2)' }}>Your learning feed is ready.</div>
        </div>
        <Link href="/create" className="btn btn-primary">
          <Plus size={15} /> Create
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '18px', paddingBottom: '2px' }}>
        <div className="card-feed" style={{ minWidth: '124px', padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Flame size={16} className={streak > 3 ? 'animate-flame' : ''} style={{ color: '#fb7185' }} />
            <span style={{ fontSize: '12px', color: 'var(--text2)' }}>Streak</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800' }}>{streak} days</div>
        </div>
        <div className="card-feed" style={{ minWidth: '150px', padding: '14px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '8px' }}>Momentum</div>
          <div style={{ fontSize: '14px', fontWeight: '700' }}>Top 20% today</div>
          <div style={{ fontSize: '11px', color: 'var(--green)', marginTop: '6px' }}>You are showing up consistently.</div>
        </div>
        <div className="card-feed" style={{ minWidth: '124px', padding: '14px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '8px' }}>Tasks done</div>
          <div style={{ fontSize: '24px', fontWeight: '800' }}>{totalDone}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {active.map((rm, index) => {
          const total = rm._count?.tasks || 0
          const done = rm.doneCount || 0
          const pct = total ? Math.round((done / total) * 100) : 0
          const left = Math.max((rm.totalDays || total) - done, 0)
          const preview = rm.nextTaskTitle || 'No task scheduled yet'
          return (
            <div key={rm.id} className="card-feed animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
              <div style={{ padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: rm.colorHex || '#7c3aed' }} />
                      <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--green)', letterSpacing: '0.08em' }}>{rm.status}</span>
                    </div>
                    <div style={{ fontSize: '17px', fontWeight: '700', marginBottom: '4px' }}>{rm.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{rm.goal}</div>
                  </div>
                  <button className="btn btn-icon btn-ghost"><MoreHorizontal size={16} /></button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <ProgressRing value={pct} color={rm.colorHex || '#7c3aed'} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '4px' }}>Today</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>{preview}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text2)' }}>Day {done + 1} · {left} days left</div>
                  </div>
                </div>

                <div style={{ height: '8px', background: 'var(--bg4)', borderRadius: '999px', overflow: 'hidden', marginBottom: '14px' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: rm.colorHex || 'var(--grad)', borderRadius: '999px' }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Link href={`/roadmap/${rm.id}`} className="btn btn-primary">
                    Continue <ArrowRight size={14} />
                  </Link>
                  <Link href="/today" className="btn btn-ghost">Open Today</Link>
                </div>
              </div>
            </div>
          )
        })}

        {active.length === 0 && (
          <div className="card-feed" style={{ padding: '26px', textAlign: 'center' }}>
            <Trophy size={26} style={{ color: 'var(--accent3)', marginBottom: '10px' }} />
            <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>No active roadmaps yet</div>
            <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '16px' }}>Start one and your learning feed will appear here.</div>
            <Link href="/create" className="btn btn-primary">
              <Sparkles size={14} /> Create your first roadmap
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
