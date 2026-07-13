/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, ChevronLeft, ChevronRight, Clock3, ExternalLink, SkipForward } from 'lucide-react'
import { PageError, PageSpinner } from '@/components/ui/PageState'

export default function TodayPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [index, setIndex] = useState(0)
  const [celebrate, setCelebrate] = useState(false)

  useEffect(() => {
    fetch('/api/today')
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || 'Failed to load today page')
        setItems(Array.isArray(data) ? data.filter((item) => item.nextTask) : [])
      })
      .catch((err) => setError(err.message || 'Failed to load today page'))
      .finally(() => setLoading(false))
  }, [])

  const current = useMemo(() => items[index] || null, [items, index])

  async function markDone(taskId: string) {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: true }),
    })
    setCelebrate(true)
    setTimeout(() => setCelebrate(false), 500)
    setItems((prev) => {
      const next = prev.filter((item) => item.nextTask?.id !== taskId)
      setIndex((i) => Math.max(0, Math.min(i, next.length - 1)))
      return next
    })
  }

  function skipCard() {
    if (!items.length) return
    setIndex((prev) => (prev + 1) % items.length)
  }

  if (loading) return <PageSpinner label="Loading today's stack..." />
  if (error) return <PageError title="Today's stack could not load" message={error} />

  return (
    <div style={{ padding: '18px 16px 28px', maxWidth: '640px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: '800', marginBottom: '4px' }}>Today</div>
          <div style={{ fontSize: '13px', color: 'var(--text2)' }}>{items.length} tasks queued</div>
        </div>
        <Link href="/dashboard" className="btn btn-ghost">Dashboard</Link>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        {items.map((_, i) => (
          <div key={i} style={{ flex: 1, height: '4px', borderRadius: '999px', background: i <= index ? 'var(--grad)' : 'var(--bg4)' }} />
        ))}
      </div>

      {current ? (
        <div className={`card-feed ${celebrate ? 'animate-bounce-in' : ''}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '520px' }}>
          <div style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text2)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>{current.roadmapTitle}</div>
                <div style={{ fontSize: '20px', fontWeight: '800' }}>{current.nextTask.title}</div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--accent3)', fontWeight: '700' }}>Day {current.nextTask.day}</div>
            </div>

            {current.nextTask.description && (
              <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: '1.7', marginBottom: '16px' }}>{current.nextTask.description}</p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text2)' }}>
              <Clock3 size={15} />
              <span style={{ fontSize: '13px' }}>Estimated focused block: 45-90 minutes</span>
            </div>

            {current.nextTask.techStack?.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
                {current.nextTask.techStack.slice(0, 5).map((tag: any, i: number) => (
                  <span key={i} className="chip chip-default">{tag.name}</span>
                ))}
              </div>
            )}

            <div>
              <div className="section-title">Resources</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(current.nextTask.resources || []).slice(0, 3).map((resource: any, i: number) => (
                  <a key={i} href={resource.url} target="_blank" rel="noopener noreferrer" className="card-feed" style={{ padding: '12px 14px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text1)' }}>{resource.name}</span>
                    <ExternalLink size={14} style={{ color: 'var(--text3)' }} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div style={{ padding: '18px 22px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button className="btn-pill btn-primary-grad" style={{ width: '100%', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => markDone(current.nextTask.id)}>
              <CheckCircle2 size={18} /> Mark Complete
            </button>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-ghost btn-lg" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setIndex((prev) => (prev - 1 + items.length) % items.length)}>
                <ChevronLeft size={15} /> Previous
              </button>
              <button className="btn btn-ghost btn-lg" style={{ flex: 1, justifyContent: 'center' }} onClick={skipCard}>
                <SkipForward size={15} /> Skip
              </button>
              <button className="btn btn-ghost btn-lg" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setIndex((prev) => (prev + 1) % items.length)}>
                Next <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card-feed" style={{ padding: '28px', textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>All caught up</div>
          <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '16px' }}>No pending cards for today. Come back tomorrow or open your dashboard.</div>
          <Link href="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
        </div>
      )}
    </div>
  )
}
