'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Zap, TrendingUp, CheckCircle2, Clock, ArrowRight, Trash2, MoreHorizontal, Archive, Play, Pause, BarChart2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const COLOR_BAR: Record<string, string> = {
  violet: '#7c3aed', blue: '#2563eb', green: '#16a34a',
  amber: '#d97706', red: '#dc2626', teal: '#0d9488', pink: '#db2777',
}
const COLOR_BG: Record<string, string> = {
  violet: 'rgba(124,58,237,0.1)', blue: 'rgba(37,99,235,0.1)', green: 'rgba(22,163,74,0.1)',
  amber: 'rgba(217,119,6,0.1)', red: 'rgba(220,38,38,0.1)', teal: 'rgba(13,148,136,0.1)', pink: 'rgba(219,39,119,0.1)',
}

function StatCard({ value, label, color }: { value: any, label: string, color: string }) {
  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: '12px', padding: '20px 22px'
    }}>
      <div style={{ fontSize: '26px', fontWeight: '700', color, letterSpacing: '-1px', marginBottom: '4px' }}>{value}</div>
      <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{label}</div>
    </div>
  )
}

function RoadmapCard({ rm, onDelete, onStatus }: { rm: any, onDelete: (id: string) => void, onStatus: (id: string, s: string) => void }) {
  const [menu, setMenu] = useState(false)
  const tasks = rm.tasks || []
  const done = tasks.filter((t: any) => t.done).length
  const total = tasks.length
  const pct = total > 0 ? Math.round(done / total * 100) : 0
  const barColor = COLOR_BAR[rm.color] || COLOR_BAR.violet
  const bgColor = COLOR_BG[rm.color] || COLOR_BG.violet

  const statusBadge: Record<string, any> = {
    ACTIVE:    { label: 'Active',    bg: 'var(--green-bg)',  color: 'var(--green)',  border: 'var(--green-border)' },
    COMPLETED: { label: 'Done',      bg: 'var(--accent-bg)', color: 'var(--accent3)',border: 'var(--accent-border)' },
    PAUSED:    { label: 'Paused',    bg: 'var(--amber-bg)',  color: 'var(--amber)',  border: 'rgba(245,158,11,0.2)' },
    ARCHIVED:  { label: 'Archived',  bg: 'var(--bg4)',       color: 'var(--text3)',  border: 'var(--border2)' },
  }
  const sb = statusBadge[rm.status] || statusBadge.ACTIVE

  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: '12px', padding: '20px', position: 'relative',
      transition: 'border-color 0.15s, transform 0.15s',
      cursor: 'pointer'
    }}
    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Color dot */}
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: barColor, flexShrink: 0, marginTop: '2px' }} />
          <div>
            <Link href={`/roadmap/${rm.id}`} style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text1)', textDecoration: 'none', display: 'block', marginBottom: '2px' }}>
              {rm.title}
            </Link>
            <div style={{ fontSize: '12px', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
              {rm.goal}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: '500', padding: '2px 8px', borderRadius: '4px', background: sb.bg, color: sb.color, border: `1px solid ${sb.border}` }}>
            {sb.label}
          </span>
          <div style={{ position: 'relative' }}>
            <button onClick={e => { e.stopPropagation(); setMenu(!menu); }} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text4)',
              padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center',
              transition: 'all 0.12s'
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg4)'; (e.currentTarget as HTMLElement).style.color = 'var(--text2)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'var(--text4)'; }}
            ><MoreHorizontal size={15} /></button>
            {menu && (
              <div style={{
                position: 'absolute', right: 0, top: '28px', zIndex: 50,
                background: 'var(--bg3)', border: '1px solid var(--border2)',
                borderRadius: '10px', padding: '4px', minWidth: '150px',
                boxShadow: 'var(--shadow-lg)'
              }} onClick={e => e.stopPropagation()}>
                {rm.status === 'ACTIVE' && (
                  <button onClick={() => { onStatus(rm.id, 'PAUSED'); setMenu(false); }} style={menuStyle}>
                    <Pause size={13} /> Pause
                  </button>
                )}
                {rm.status === 'PAUSED' && (
                  <button onClick={() => { onStatus(rm.id, 'ACTIVE'); setMenu(false); }} style={menuStyle}>
                    <Play size={13} /> Resume
                  </button>
                )}
                <button onClick={() => { onStatus(rm.id, 'ARCHIVED'); setMenu(false); }} style={menuStyle}>
                  <Archive size={13} /> Archive
                </button>
                <Link href={`/reports?roadmapId=${rm.id}`} style={{ ...menuStyle, display: 'flex', textDecoration: 'none' }}>
                  <BarChart2 size={13} /> Report
                </Link>
                <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                <button onClick={() => { onDelete(rm.id); setMenu(false); }} style={{ ...menuStyle, color: 'var(--red)' }}>
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{done} / {total} days</span>
          <span style={{ fontSize: '12px', fontWeight: '600', color: barColor }}>{pct}%</span>
        </div>
        <div style={{ height: '3px', background: 'var(--bg5)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: '2px', transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11px', color: 'var(--text4)' }}>
          {formatDistanceToNow(new Date(rm.updatedAt), { addSuffix: true })}
        </span>
        <Link href={`/roadmap/${rm.id}`} style={{
          fontSize: '12px', color: 'var(--accent3)', textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: '4px'
        }}>View <ArrowRight size={11} /></Link>
      </div>
    </div>
  )
}

const menuStyle: any = {
  width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
  padding: '7px 10px', borderRadius: '6px', background: 'none',
  border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text2)',
  textAlign: 'left', transition: 'background 0.12s', fontFamily: 'var(--font)'
}

export default function Dashboard() {
  const [roadmaps, setRoadmaps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/roadmaps').then(r => r.json()).then(d => { setRoadmaps(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  async function deleteRoadmap(id: string) {
    if (!confirm('Delete this roadmap? This cannot be undone.')) return
    await fetch(`/api/roadmaps/${id}`, { method: 'DELETE' })
    setRoadmaps(p => p.filter(r => r.id !== id))
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/roadmaps/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    setRoadmaps(p => p.map(r => r.id === id ? { ...r, status } : r))
  }

  const active    = roadmaps.filter(r => r.status === 'ACTIVE')
  const completed = roadmaps.filter(r => r.status === 'COMPLETED')
  const archived  = roadmaps.filter(r => ['PAUSED','ARCHIVED'].includes(r.status))
  const totalDone = roadmaps.reduce((s, r) => s + (r.tasks || []).filter((t: any) => t.done).length, 0)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner" style={{ width: '24px', height: '24px', borderWidth: '2.5px' }} />
    </div>
  )

  return (
    <div style={{ padding: '36px 40px', maxWidth: '1000px' }} className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text1)', letterSpacing: '-0.5px', margin: '0 0 4px' }}>Dashboard</h1>
          <p style={{ fontSize: '13px', color: 'var(--text3)', margin: 0 }}>{roadmaps.length} roadmaps · {totalDone} tasks completed</p>
        </div>
        <Link href="/create" className="btn btn-primary">
          <Plus size={14} /> New Roadmap
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '32px' }}>
        <StatCard value={roadmaps.length} label="Total Roadmaps" color="var(--text1)" />
        <StatCard value={active.length} label="Active" color="var(--green)" />
        <StatCard value={completed.length} label="Completed" color="var(--accent3)" />
        <StatCard value={totalDone} label="Tasks Done" color="var(--amber)" />
      </div>

      {/* Active */}
      {active.length > 0 && (
        <section style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span className="section-title">Active</span>
            <Link href="/today" style={{ fontSize: '12px', color: 'var(--accent3)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Today's tasks <ArrowRight size={11} />
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {active.map(rm => <RoadmapCard key={rm.id} rm={rm} onDelete={deleteRoadmap} onStatus={updateStatus} />)}
          </div>
        </section>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <section style={{ marginBottom: '32px' }}>
          <span className="section-title" style={{ display: 'block', marginBottom: '14px' }}>Completed</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {completed.map(rm => <RoadmapCard key={rm.id} rm={rm} onDelete={deleteRoadmap} onStatus={updateStatus} />)}
          </div>
        </section>
      )}

      {/* Archived/Paused */}
      {archived.length > 0 && (
        <section style={{ marginBottom: '32px' }}>
          <span className="section-title" style={{ display: 'block', marginBottom: '14px' }}>Paused & Archived</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {archived.map(rm => <RoadmapCard key={rm.id} rm={rm} onDelete={deleteRoadmap} onStatus={updateStatus} />)}
          </div>
        </section>
      )}

      {/* Empty */}
      {roadmaps.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🗺</div>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text1)', marginBottom: '8px' }}>No roadmaps yet</h2>
          <p style={{ fontSize: '14px', color: 'var(--text3)', marginBottom: '24px' }}>Create your first AI-powered learning roadmap</p>
          <Link href="/create" className="btn btn-primary btn-lg">
            <Plus size={15} /> Create Roadmap
          </Link>
        </div>
      )}
    </div>
  )
}
