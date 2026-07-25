/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Compass, Flame, MoreHorizontal, PenLine, Plus, Sparkles, Target, ShieldCheck } from 'lucide-react'
import { PageError, DashboardSkeleton, EmptyState } from '@/components/ui/PageState'

const BAR: Record<string, string> = {
  violet: '#4F6BFF', blue: '#0A9EFF', green: '#30D158',
  amber: '#FF9F0A', red: '#FF453A', teal: '#40C8E0', pink: '#FF375F'
}

function ProgressRing({ value, color }: { value: number; color: string }) {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={radius} stroke="rgba(245,245,247,0.08)" strokeWidth="6" fill="none" />
      <circle className="ring-progress" cx="36" cy="36" r={radius} stroke={color} strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={offset} fill="none" />
      <text x="36" y="41" textAnchor="middle" fill="var(--text1)" fontSize="14" fontWeight="700">{value}%</text>
    </svg>
  )
}

const ONBOARD_STEPS = [
  { icon: Compass, title: 'Describe a goal', desc: 'A skill, an exam, a subject — anything you want to learn.', tile: 'cobalt' },
  { icon: Sparkles, title: 'Get a plan', desc: 'AI builds a day-by-day or phased roadmap around it.', tile: 'sky' },
  { icon: Flame, title: 'Track it daily', desc: 'Check off tasks, build a streak, watch progress add up.', tile: 'amber' },
]

export default function DashboardPage() {
  const [roadmaps, setRoadmaps] = useState<any[]>([])
  const [stats, setStats] = useState<{ streak: number; todayDone: number; totalDone: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [accountability, setAccountability] = useState<any>(null)
  const [accLoading, setAccLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/roadmaps').then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || 'Failed to load dashboard')
        return Array.isArray(data) ? data : []
      }),
      fetch('/api/stats').then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ])
      .then(([roadmapData, statsData]) => {
        setRoadmaps(roadmapData)
        setStats(statsData)
      })
      .catch((err) => setError(err.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false))

    // Fetched separately and non-blocking — this can trigger an AI call
    // (challenge generation) server-side and shouldn't delay the rest of
    // the dashboard rendering.
    fetch('/api/accountability')
      .then((r) => (r.ok ? r.json() : null))
      .then(setAccountability)
      .catch(() => setAccountability(null))
      .finally(() => setAccLoading(false))
  }, [])

  async function completeChallenge(id: string) {
    setAccountability((prev: any) => ({ ...prev, challenge: { ...prev.challenge, completed: true } }))
    await fetch(`/api/challenges/${id}`, { method: 'PATCH' })
  }

  async function dismissChallenge(id: string) {
    setAccountability((prev: any) => ({ ...prev, challenge: null }))
    await fetch(`/api/challenges/${id}`, { method: 'DELETE' })
  }

  if (loading) return <DashboardSkeleton />
  if (error) return <PageError title="Dashboard could not load" message={error} />

  const active = roadmaps.filter((rm) => rm.status === 'ACTIVE')
  const streak = stats?.streak ?? 0
  const todayDone = stats?.todayDone ?? 0
  const totalDone = stats?.totalDone ?? roadmaps.reduce((sum, rm) => sum + (rm.doneCount || 0), 0)

  if (roadmaps.length === 0) {
    return (
      <div style={{ padding: '24px 16px 32px', maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ fontSize: '24px', fontWeight: '800', marginBottom: '6px' }} className="font-display">Welcome to RoadMaper</div>
        <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '28px' }}>
          You don&apos;t have a roadmap yet — here&apos;s how it works.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '26px' }}>
          {ONBOARD_STEPS.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: '14px', padding: '12px 4px', alignItems: 'flex-start' }}>
              <div className={`icon-tile ${step.tile}`}>
                <step.icon size={16} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '2px' }}>{step.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link href="/create" className="btn btn-primary btn-lg">
            <Sparkles size={15} /> Generate with AI
          </Link>
          <Link href="/create" className="btn btn-ghost btn-lg">
            <PenLine size={15} /> Build manually instead
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px 16px 32px', maxWidth: '760px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div>
          <div className="font-display" style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>Welcome back</div>
          <div style={{ fontSize: '13px', color: 'var(--text2)' }}>Your learning feed is ready.</div>
        </div>
        <Link href="/create" className="btn btn-primary">
          <Plus size={15} /> Create
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '18px', paddingBottom: '2px' }}>
        <div className={`card-feed ${streak >= 3 ? 'streak-hot' : ''}`} style={{ minWidth: '124px', padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Flame size={16} className={streak >= 3 ? 'animate-flame' : ''} style={{ color: streak >= 3 ? '#FF9F0A' : 'var(--text4)' }} />
            <span style={{ fontSize: '12px', color: 'var(--text2)' }}>Streak</span>
          </div>
          <div className="stat-figure" style={{ fontSize: '24px', fontWeight: '800' }}>{streak}<span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text3)' }}> {streak === 1 ? 'day' : 'days'}</span></div>
        </div>
        <div className="card-feed" style={{ minWidth: '150px', padding: '14px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '8px' }}>Today</div>
          <div className="stat-figure" style={{ fontSize: '24px', fontWeight: '800' }}>{todayDone}</div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>{todayDone > 0 ? 'tasks done today' : 'nothing checked off yet'}</div>
        </div>
        <div className="card-feed" style={{ minWidth: '124px', padding: '14px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '8px' }}>All-time</div>
          <div className="stat-figure" style={{ fontSize: '24px', fontWeight: '800' }}>{totalDone}</div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>tasks completed</div>
        </div>
      </div>

      {!accLoading && accountability?.challenge && (
        <div className="card-feed" style={{ padding: '16px', marginBottom: '18px', border: '1px solid var(--accent-border)', background: 'var(--accent-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <Target size={16} style={{ color: 'var(--accent3)', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--accent3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Recovery challenge</div>
              <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '3px' }}>{accountability.challenge.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '10px' }}>{accountability.challenge.description}</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => completeChallenge(accountability.challenge.id)} className="btn btn-primary btn-sm">
                  <Sparkles size={12} /> Done
                </button>
                <button onClick={() => dismissChallenge(accountability.challenge.id)} className="btn btn-ghost btn-sm">Not now</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!accLoading && accountability && accountability.tasksReachedByNow > 0 && (
        <div className="card-feed" style={{ padding: '16px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <ShieldCheck size={14} style={{ color: 'var(--accent3)' }} />
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text2)' }}>Reliability</span>
            </div>
            <span className="stat-figure" style={{ fontSize: '16px', fontWeight: '800', color: accountability.reliabilityScore >= 75 ? 'var(--green)' : accountability.reliabilityScore >= 50 ? 'var(--amber)' : 'var(--red)' }}>
              {accountability.reliabilityScore}%
            </span>
          </div>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '32px', marginBottom: '8px' }}>
            {accountability.weekdayPattern.map((w: any) => {
              const max = Math.max(...accountability.weekdayPattern.map((x: any) => x.count), 1)
              const h = Math.max(4, Math.round((w.count / max) * 32))
              return (
                <div key={w.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                  <div style={{ width: '100%', height: `${h}px`, borderRadius: '2px', background: w.count > 0 ? 'var(--accent)' : 'var(--bg4)' }} />
                  <span style={{ fontSize: '9px', color: 'var(--text4)' }}>{w.day[0]}</span>
                </div>
              )
            })}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
            {accountability.trend === 'improving' && 'Trending up — more active than last week.'}
            {accountability.trend === 'declining' && 'Slower than last week — nothing urgent, just noting it.'}
            {accountability.trend === 'steady' && 'Steady pace, same as last week.'}
            {accountability.trend === 'not_enough_data' && 'Keep going — trend shows up after a bit more history.'}
            {accountability.weakestWeekday && ` ${accountability.weakestWeekday}s tend to be your quietest day.`}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {active.map((rm, index) => {
          const total = rm._count?.tasks || 0
          const done = rm.doneCount || 0
          const pct = total ? Math.round((done / total) * 100) : 0
          const left = Math.max((rm.totalDays || total) - done, 0)
          const preview = rm.nextTaskTitle || 'No task scheduled yet'
          const color = BAR[rm.color] || BAR.violet
          return (
            <div key={rm.id} className="card-feed animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
              <div style={{ padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
                      <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--green)', letterSpacing: '0.08em' }}>{rm.status}</span>
                    </div>
                    <div style={{ fontSize: '17px', fontWeight: '700', marginBottom: '4px' }}>{rm.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{rm.goal}</div>
                  </div>
                  <button className="btn btn-icon btn-ghost"><MoreHorizontal size={16} /></button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <ProgressRing value={pct} color={color} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '4px' }}>Today</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>{preview}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text2)' }}>Day {done + 1} · {left} days left</div>
                  </div>
                </div>

                <div style={{ height: '8px', background: 'var(--bg4)', borderRadius: '999px', overflow: 'hidden', marginBottom: '14px' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '999px', transition: 'width 0.4s ease' }} />
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
          <EmptyState
            icon={Sparkles}
            tone="accent"
            title="No active roadmaps"
            desc="Every roadmap you've made is paused, archived, or done. Start a new one to keep your streak going."
            action={
              <Link href="/create" className="btn btn-primary">
                <Sparkles size={14} /> Create a roadmap
              </Link>
            }
          />
        )}
      </div>
    </div>
  )
}
