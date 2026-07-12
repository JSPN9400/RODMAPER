/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Circle, ChevronDown, ChevronUp, ArrowLeft, BarChart2, Trash2 } from 'lucide-react'
import { PageSpinner } from '@/components/ui/PageState'

const CHIP: Record<string,string> = { sql:'chip-sql',python:'chip-python',bi:'chip-bi',ai:'chip-ai',git:'chip-git',js:'chip-js' }
const BAR: Record<string,string> = { violet:'#7c3aed',blue:'#2563eb',green:'#16a34a',amber:'#d97706',red:'#dc2626',teal:'#0d9488',pink:'#db2777' }

export default function RoadmapPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [rm, setRm] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeProj, setActiveProj] = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/roadmaps/${id}`).then(r => r.json()).then(d => { setRm(d); setLoading(false) })
  }, [id])

  async function toggleTask(task: any) {
    const newDone = !task.done
    setRm((p: any) => ({ ...p, tasks: p.tasks.map((t: any) => t.id === task.id ? { ...t, done: newDone } : t) }))
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
    await fetch('/api/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roadmapId: id }) })
    router.push(`/reports?roadmapId=${id}`)
  }

  if (loading || !rm) return <PageSpinner label="Loading roadmap..." />

  const projects = rm.projects || []
  const tasks = rm.tasks || []
  const phases = rm.phases || []
  const done = tasks.filter((t: any) => t.done).length
  const pct = tasks.length > 0 ? Math.round(done / tasks.length * 100) : 0
  const color = BAR[rm.color] || BAR.violet
  const proj = projects[activeProj]
  const currentPhase = phases.find((ph: any) => ph.name === proj?.name) || phases[activeProj]
  const projTasks = tasks.filter((t: any) => t.projectId === proj?.id).sort((a: any, b: any) => a.day - b.day)

  return (
    <div style={{ padding: '20px 16px 80px', maxWidth: '820px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text3)', textDecoration: 'none', marginBottom: '8px' }}>
            <ArrowLeft size={13} /> Dashboard
          </Link>
          <h1 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '3px' }}>{rm.title}</h1>
          <p style={{ fontSize: '13px', color: 'var(--text3)' }}>{rm.goal}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={generateReport} className="btn btn-ghost btn-sm"><BarChart2 size={13} /> Report</button>
          <button onClick={deleteRoadmap} className="btn btn-danger btn-sm"><Trash2 size={13} /></button>
        </div>
      </div>

      {/* Progress */}
      {rm.roadmapType === 'LONG_TERM' ? (
        <div className="card-feed" style={{ padding: '20px', marginBottom: '20px' }}>
          <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '6px' }}>Phased Preparation Plan</div>
          <p style={{ fontSize: '13px', color: 'var(--text3)', lineHeight: '1.5' }}>
            This is a long-term academic or career roadmap. Follow the weekly milestones and checklists in each phase.
          </p>
        </div>
      ) : (
        <div className="card-feed" style={{ padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '26px', fontWeight: '800', color, letterSpacing: '-1px' }}>{pct}%</span>
            <span style={{ fontSize: '13px', color: 'var(--text3)' }}>{done} / {tasks.length} days</span>
          </div>
          <div style={{ height: '4px', background: 'var(--bg5)', borderRadius: '2px', overflow: 'hidden', marginBottom: '14px' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '2px', transition: 'width 0.5s' }} />
          </div>
          <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
            {[...tasks].sort((a: any, b: any) => a.day - b.day).map((t: any) => (
              <button key={t.id} title={`Day ${t.day}: ${t.title}`} onClick={() => toggleTask(t)} style={{
                width: '22px', height: '22px', borderRadius: '4px', border: 'none', cursor: 'pointer',
                background: t.done ? color : 'var(--bg4)', opacity: t.done ? 1 : 0.5, transition: 'all 0.15s'
              }} />
            ))}
          </div>
        </div>
      )}

      {/* Project tabs */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {projects.map((p: any, i: number) => {
          const ph = phases.find((x: any) => x.name === p.name) || phases[i]
          const pT = tasks.filter((t: any) => t.projectId === p.id)
          const pPct = pT.length > 0 ? Math.round(pT.filter((t: any) => t.done).length / pT.length * 100) : 0
          return (
            <button key={p.id} onClick={() => setActiveProj(i)} style={{
              padding: '6px 14px', borderRadius: '999px', border: 'none', cursor: 'pointer',
              background: activeProj === i ? color : 'var(--bg3)',
              color: activeProj === i ? '#fff' : 'var(--text3)',
              fontSize: '13px', fontWeight: activeProj === i ? '600' : '400',
              fontFamily: 'inherit', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              {p.name}{' '}
              <span style={{ opacity: 0.7, fontSize: '11px' }}>
                {rm.roadmapType === 'LONG_TERM' ? (ph ? `W${ph.startWeek}-${ph.endWeek}` : '') : `${pPct}%`}
              </span>
            </button>
          )
        })}
      </div>

      {/* Tasks or Phases */}
      {rm.roadmapType === 'LONG_TERM' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Topics Checklist */}
          {currentPhase?.topics && Array.isArray(currentPhase.topics) && currentPhase.topics.length > 0 && (
            <div className="card-feed" style={{ padding: '20px' }}>
              <div className="section-title" style={{ marginBottom: '10px' }}>Key Topics Checklist</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {currentPhase.topics.map((t: string, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text2)' }}>
                    <Circle size={13} style={{ color: 'var(--text4)', flexShrink: 0 }} />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly Milestones */}
          {currentPhase?.milestones && Array.isArray(currentPhase.milestones) && currentPhase.milestones.map((m: any, i: number) => {
            const isExp = expanded === `milestone-${i}`
            return (
              <div key={i} className="card-feed" style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text4)' }}>Week {m.week}</span>
                      <span className="chip chip-default">Milestone</span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{m.focus}</div>
                  </div>
                  <button onClick={() => setExpanded(isExp ? null : `milestone-${i}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text4)', display: 'flex' }}>
                    {isExp ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>
                {isExp && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '4px', fontWeight: '600' }}>Weekly Target:</div>
                    <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '12px', lineHeight: '1.6' }}>{m.milestone}</p>
                    {m.practiceTest && (
                      <div style={{ marginBottom: '10px' }}>
                        <div className="section-title">Practice Test / Assignment</div>
                        <p style={{ fontSize: '12px', color: 'var(--amber)', lineHeight: '1.5' }}>{m.practiceTest}</p>
                      </div>
                    )}
                    {m.review && (
                      <div>
                        <div className="section-title">Sunday Review & Revision</div>
                        <p style={{ fontSize: '12px', color: 'var(--green)', lineHeight: '1.5' }}>{m.review}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {projTasks.map((task: any) => {
            const isExp = expanded === task.id
            const tech = task.techStack as any[] || []
            const res = task.resources as any[] || []
            return (
              <div key={task.id} className="card-feed" style={{ opacity: task.done ? 0.65 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px' }}>
                  <button onClick={() => toggleTask(task)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: task.done ? 'var(--green)' : 'var(--text4)', display: 'flex', flexShrink: 0 }}>
                    {task.done ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text4)' }}>Day {task.day}</span>
                      {tech.slice(0,3).map((t: any, i: number) => <span key={i} className={`chip ${CHIP[t.type]||'chip-default'}`}>{t.name}</span>)}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: task.done ? 'var(--text4)' : '#fff', textDecoration: task.done ? 'line-through' : 'none' }}>{task.title}</div>
                    {task.description && !isExp && <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.description}</div>}
                  </div>
                  <button onClick={() => setExpanded(isExp ? null : task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text4)', display: 'flex' }}>
                    {isExp ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>
                {isExp && (
                  <div style={{ padding: '0 16px 14px', borderTop: '1px solid var(--border)' }}>
                    {task.description && <p style={{ fontSize: '13px', color: 'var(--text2)', margin: '12px 0 10px', lineHeight: '1.6' }}>{task.description}</p>}
                    {tech.length > 0 && <div style={{ marginBottom: '10px' }}><div className="section-title">Tech Stack</div><div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>{tech.map((t: any, i: number) => <span key={i} className={`chip ${CHIP[t.type]||'chip-default'}`}>{t.name}</span>)}</div></div>}
                    {res.length > 0 && <div><div className="section-title">Resources</div><div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>{res.map((r: any, i: number) => <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'var(--accent3)', textDecoration: 'none' }}>→ {r.name}</a>)}</div></div>}
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
