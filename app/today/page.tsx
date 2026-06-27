'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Circle, ExternalLink, Bell, Zap, Trophy } from 'lucide-react'

const CHIP_MAP: Record<string, string> = {
  sql: 'chip-sql', python: 'chip-python', bi: 'chip-bi',
  ai: 'chip-ai', git: 'chip-git', js: 'chip-js', default: 'chip-default'
}
const BAR_COLOR: Record<string, string> = {
  violet: '#7c3aed', blue: '#2563eb', green: '#16a34a',
  amber: '#d97706', red: '#dc2626', teal: '#0d9488', pink: '#db2777',
}

export default function TodayPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [notif, setNotif] = useState<'default' | 'granted' | 'denied'>('default')

  useEffect(() => {
    fetch('/api/today').then(r => r.json()).then(d => { setItems(Array.isArray(d) ? d : []); setLoading(false) })
    if ('Notification' in window) setNotif(Notification.permission as any)
  }, [])

  async function requestNotif() {
    const p = await Notification.requestPermission()
    setNotif(p as any)
    if (p === 'granted') new Notification('RoadMaper', { body: 'Daily reminders are now active!' })
  }

  async function markDone(taskId: string) {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: true })
    })
    fetch('/api/today').then(r => r.json()).then(d => setItems(Array.isArray(d) ? d : []))
  }

  const allDone = items.length > 0 && items.every(i => !i.nextTask)
  const doneCount = items.filter(i => !i.nextTask).length
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner" style={{ width: '24px', height: '24px', borderWidth: '2.5px' }} />
    </div>
  )

  return (
    <div style={{ padding: '36px 40px', maxWidth: '760px' }} className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Zap size={16} style={{ color: 'var(--accent3)' }} />
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text1)', margin: 0, letterSpacing: '-0.5px' }}>Today</h1>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text3)', margin: 0 }}>{today}</p>
        </div>
        {notif !== 'granted' ? (
          <button onClick={requestNotif} className="btn btn-ghost btn-sm">
            <Bell size={13} /> Enable Reminders
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--green)' }}>
            <div className="dot-pulse" /> Reminders on
          </div>
        )}
      </div>

      {/* All done */}
      {allDone && (
        <div style={{
          background: 'var(--green-bg)', border: '1px solid var(--green-border)',
          borderRadius: '12px', padding: '24px', textAlign: 'center', marginBottom: '24px'
        }}>
          <Trophy size={28} style={{ color: 'var(--green)', marginBottom: '10px' }} />
          <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--green)', marginBottom: '4px' }}>All done for today!</div>
          <div style={{ fontSize: '13px', color: 'var(--text3)' }}>You've completed every task across all roadmaps. Rest well.</div>
        </div>
      )}

      {/* Summary pills */}
      {items.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {[
            { label: `${items.length} roadmaps`, color: 'var(--text2)' },
            { label: `${doneCount} complete`, color: 'var(--green)' },
            { label: `${items.length - doneCount} remaining`, color: 'var(--amber)' },
          ].map(({ label, color }) => (
            <div key={label} style={{
              padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500',
              background: 'var(--bg3)', border: '1px solid var(--border)', color
            }}>{label}</div>
          ))}
        </div>
      )}

      {/* Task list */}
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: '36px', marginBottom: '14px' }}>🗺</div>
          <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>No active roadmaps</h2>
          <p style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '20px' }}>Create a roadmap to start tracking your daily work</p>
          <Link href="/create" className="btn btn-primary">Create Roadmap</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {items.map(item => {
            const bar = BAR_COLOR[item.roadmapColor] || BAR_COLOR.violet
            return (
              <div key={item.roadmapId} style={{
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: '12px', padding: '18px 20px'
              }}>
                {/* Roadmap name + progress */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: bar, flexShrink: 0 }} />
                    <Link href={`/roadmap/${item.roadmapId}`} style={{
                      fontSize: '13px', fontWeight: '600', color: 'var(--text1)',
                      textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px'
                    }}>
                      {item.roadmapTitle} <ExternalLink size={10} style={{ color: 'var(--text4)' }} />
                    </Link>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text4)' }}>{item.progressPct}%</span>
                </div>

                {/* Progress bar */}
                <div style={{ height: '2px', background: 'var(--bg5)', borderRadius: '1px', marginBottom: '14px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${item.progressPct}%`, background: bar, borderRadius: '1px', transition: 'width 0.4s' }} />
                </div>

                {/* Task or done */}
                {!item.nextTask ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--green)', fontSize: '13px' }}>
                    <CheckCircle2 size={15} /> All days complete!
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <button onClick={() => markDone(item.nextTask.id)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text4)', padding: '2px', marginTop: '1px', flexShrink: 0,
                      transition: 'color 0.15s', display: 'flex'
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--green)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text4)'}
                    >
                      <Circle size={18} />
                    </button>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11px', color: 'var(--text4)', marginBottom: '3px' }}>
                        Day {item.nextTask.day}{item.nextTask.projectName && ` · ${item.nextTask.projectName}`}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text1)', marginBottom: '4px' }}>
                        {item.nextTask.title}
                      </div>
                      {item.nextTask.description && (
                        <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '8px' }}>
                          {item.nextTask.description}
                        </div>
                      )}
                      {item.nextTask.techStack?.length > 0 && (
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '8px' }}>
                          {item.nextTask.techStack.slice(0, 4).map((t: any, i: number) => (
                            <span key={i} className={`chip ${CHIP_MAP[t.type] || 'chip-default'}`}>{t.name}</span>
                          ))}
                        </div>
                      )}
                      {item.nextTask.resources?.slice(0, 2).map((r: any, i: number) => (
                        <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" style={{
                          fontSize: '12px', color: 'var(--accent3)', textDecoration: 'none',
                          display: 'inline-flex', alignItems: 'center', gap: '4px', marginRight: '12px'
                        }}>→ {r.name}</a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
