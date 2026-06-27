'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Circle, ChevronDown, ChevronUp, BarChart2, Trash2, ArrowLeft } from 'lucide-react'

const CHIP_MAP: Record<string, string> = {
  sql: 'chip-sql', python: 'chip-python', bi: 'chip-bi',
  ai: 'chip-ai', git: 'chip-git', js: 'chip-js'
}
const BAR_COLOR: Record<string, string> = {
  violet: '#7c3aed', blue: '#2563eb', green: '#16a34a',
  amber: '#d97706', red: '#dc2626', teal: '#0d9488', pink: '#db2777',
}

export default function RoadmapPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [rm, setRm] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeProj, setActiveProj] = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [genReport, setGenReport] = useState(false)

  useEffect(() => {
    fetch(`/api/roadmaps/${id}`).then(r => r.json()).then(d => { setRm(d); setLoading(false) })
  }, [id])

  async function toggleTask(task: any) {
    const newDone = !task.done
    setRm((prev: any) => ({
      ...prev,
      tasks: prev.tasks.map((t: any) => t.id === task.id ? { ...t, done: newDone, doneAt: newDone ? new Date() : null } : t)
    }))
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: newDone })
    })
    fetch(`/api/roadmaps/${id}`).then(r => r.json()).then(setRm)
  }

  async function deleteRoadmap() {
    if (!confirm('Delete this roadmap?')) return
    await fetch(`/api/roadmaps/${id}`, { method: 'DELETE' })
    router.push('/dashboard')
  }

  async function generateReport() {
    setGenReport(true)
    await fetch('/api/reports', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roadmapId: id })
    })
    setGenReport(false)
    router.push(`/reports?roadmapId=${id}`)
  }

  if (loading || !rm) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner" style={{ width: '24px', height: '24px', borderWidth: '2.5px' }} />
    </div>
  )

  const projects = rm.projects || []
  const tasks = rm.tasks || []
  const totalDone = tasks.filter((t: any) => t.done).length
  const pct = tasks.length > 0 ? Math.round(totalDone / tasks.length * 100) : 0
  const barColor = BAR_COLOR[rm.color] || BAR_COLOR.violet
  const proj = projects[activeProj]
  const projTasks = tasks.filter((t: any) => t.projectId === proj?.id).sort((a: any, b: any) => a.day - b.day)

  return (
    <div style={{ padding: '36px 40px', maxWidth: '820px' }} className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text3)', textDecoration: 'none', marginBottom: '10px', transition: 'color 0.12s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text1)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text3)'}>
            <ArrowLeft size={13} /> Dashboard
          </Link>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text1)', margin: '0 0 4px', letterSpacing: '-0.5px' }}>{rm.title}</h1>
          <p style={{ fontSize: '13px', color: 'var(--text3)', margin: 0 }}>{rm.goal}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={generateReport} disabled={genReport} className="btn btn-ghost btn-sm">
            <BarChart2 size={13} /> {genReport ? 'Generating...' : 'Report'}
          </button>
          <button onClick={deleteRoadmap} className="btn btn-danger btn-sm">
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>

      {/* Overall progress card */}
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: '14px', padding: '22px 24px', marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <span style={{ fontSize: '24px', fontWeight: '700', color: barColor, letterSpacing: '-1px' }}>{pct}%</span>
            <span style={{ fontSize: '13px', color: 'var(--text3)', marginLeft: '10px' }}>{totalDone} of {tasks.length} days complete</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{rm.totalDays} day roadmap</span>
        </div>
        <div style={{ height: '4px', background: 'var(--bg5)', borderRadius: '2px', overflow: 'hidden', marginBottom: '16px' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: '2px', transition: 'width 0.5s ease' }} />
        </div>

        {/* Heatmap */}
        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
          {[...tasks].sort((a: any, b: any) => a.day - b.day).map((t: any) => (
            <button key={t.id} title={`Day ${t.day}: ${t.title}`} onClick={() => toggleTask(t)} style={{
              width: '22px', height: '22px', borderRadius: '4px', border: 'none', cursor: 'pointer',
              background: t.done ? barColor : 'var(--bg4)',
              transition: 'all 0.15s', opacity: t.done ? 1 : 0.6
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.transform = 'scale(1.15)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = t.done ? '1' : '0.6'; (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            />
          ))}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text4)', marginTop: '8px' }}>Click any cell to toggle · {rm.totalDays} total days</div>
      </div>

      {/* Project tabs */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {projects.map((p: any, i: number) => {
          const pTasks = tasks.filter((t: any) => t.projectId === p.id)
          const pDone = pTasks.filter((t: any) => t.done).length
          const pPct = pTasks.length > 0 ? Math.round(pDone / pTasks.length * 100) : 0
          const active = activeProj === i
          return (
            <button key={p.id} onClick={() => setActiveProj(i)} style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: active ? barColor : 'var(--bg3)',
              color: active ? '#fff' : 'var(--text3)',
              fontSize: '13px', fontWeight: active ? '600' : '400',
              transition: 'all 0.15s', fontFamily: 'var(--font)'
            }}>
              {p.name}
              <span style={{ fontSize: '11px', opacity: 0.7 }}>{pPct}%</span>
            </button>
          )
        })}
      </div>

      {/* Tasks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {projTasks.map((task: any) => {
          const isExp = expanded === task.id
          const tech = task.techStack as any[] || []
          const resources = task.resources as any[] || []
          return (
            <div key={task.id} style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: '10px', transition: 'border-color 0.12s',
              opacity: task.done ? 0.65 : 1
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px' }}>
                <button onClick={() => toggleTask(task)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0,
                  color: task.done ? 'var(--green)' : 'var(--text4)',
                  display: 'flex', transition: 'color 0.12s', padding: '2px'
                }}
                onMouseEnter={e => { if (!task.done) (e.currentTarget as HTMLElement).style.color = 'var(--green)'; }}
                onMouseLeave={e => { if (!task.done) (e.currentTarget as HTMLElement).style.color = 'var(--text4)'; }}
                >
                  {task.done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                </button>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text4)', fontWeight: '500' }}>Day {task.day}</span>
                    {tech.slice(0, 3).map((t: any, i: number) => (
                      <span key={i} className={`chip ${CHIP_MAP[t.type] || 'chip-default'}`}>{t.name}</span>
                    ))}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: task.done ? 'var(--text4)' : 'var(--text1)', textDecoration: task.done ? 'line-through' : 'none' }}>
                    {task.title}
                  </div>
                  {task.description && !isExp && (
                    <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.description}
                    </div>
                  )}
                </div>

                <button onClick={() => setExpanded(isExp ? null : task.id)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text4)', padding: '4px', borderRadius: '5px',
                  display: 'flex', transition: 'color 0.12s'
                }}>
                  {isExp ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
              </div>

              {isExp && (
                <div style={{ padding: '0 16px 14px', borderTop: '1px solid var(--border)' }}>
                  {task.description && <p style={{ fontSize: '13px', color: 'var(--text2)', margin: '12px 0 10px', lineHeight: '1.6' }}>{task.description}</p>}
                  {tech.length > 0 && (
                    <div style={{ marginBottom: '10px' }}>
                      <div className="section-title">Tech Stack</div>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        {tech.map((t: any, i: number) => <span key={i} className={`chip ${CHIP_MAP[t.type] || 'chip-default'}`}>{t.name}</span>)}
                      </div>
                    </div>
                  )}
                  {resources.length > 0 && (
                    <div>
                      <div className="section-title">Resources</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {resources.map((r: any, i: number) => (
                          <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" style={{
                            fontSize: '12px', color: 'var(--accent3)', textDecoration: 'none',
                            display: 'inline-flex', alignItems: 'center', gap: '5px'
                          }}>→ {r.name}</a>
                        ))}
                      </div>
                    </div>
                  )}
                  {task.done && task.doneAt && (
                    <div style={{ fontSize: '11px', color: 'var(--green)', marginTop: '10px', opacity: 0.7 }}>
                      ✓ Completed {new Date(task.doneAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
