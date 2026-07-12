'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Trophy, Zap, Target, Share2, Brain, ArrowRight, TrendingUp } from 'lucide-react'

const BAR: Record<string,string> = {
  violet:'#7c3aed',blue:'#2563eb',green:'#16a34a',
  amber:'#d97706',red:'#dc2626',teal:'#0d9488',pink:'#db2777'
}

export default function ReportsContent() {
  const sp = useSearchParams()
  const [roadmaps, setRoadmaps] = useState<any[]>([])
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(sp.get('roadmapId') || '')

  useEffect(() => {
    fetch('/api/roadmaps').then(r => r.json()).then(d => {
      const arr = Array.isArray(d) ? d : []
      setRoadmaps(arr)
      if (!selected && arr.length > 0) setSelected(arr[0].id)
    })
  }, [])

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    fetch(`/api/reports?roadmapId=${selected}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setReport(d); setLoading(false) })
  }, [selected])

  return (
    <div style={{ padding:'20px 16px 80px', maxWidth:'820px', margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:'800', marginBottom:'4px' }}>Reports</h1>
          <p style={{ fontSize:'13px', color:'var(--text3)' }}>Completion analytics and learning insights</p>
        </div>
        <select className="input" style={{ width:'220px' }} value={selected} onChange={e => setSelected(e.target.value)}>
          <option value="">Select roadmap...</option>
          {roadmaps.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
        </select>
      </div>

      {loading && <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'200px' }}>
        <div className="spinner" style={{ width:'24px', height:'24px', borderWidth:'2.5px' }} />
      </div>}

      {!loading && !report && selected && (
        <div className="card-feed" style={{ padding:'40px', textAlign:'center' }}>
          <div style={{ fontSize:'32px', marginBottom:'12px' }}>📊</div>
          <h2 style={{ fontSize:'16px', fontWeight:'700', marginBottom:'8px' }}>No report yet</h2>
          <p style={{ fontSize:'13px', color:'var(--text3)', marginBottom:'20px' }}>Complete some tasks first, then generate a report from the roadmap page.</p>
          <Link href={`/roadmap/${selected}`} className="btn btn-primary" style={{ display:'inline-flex' }}>Go to Roadmap <ArrowRight size={13} /></Link>
        </div>
      )}

      {!loading && !selected && (
        <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text3)' }}>Select a roadmap to view its report</div>
      )}

      {!loading && report && (
        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          {/* Header */}
          <div className="card-feed" style={{ padding:'20px', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <h2 style={{ fontSize:'16px', fontWeight:'700', marginBottom:'4px' }}>{report.roadmap?.title}</h2>
              <p style={{ fontSize:'13px', color:'var(--text3)' }}>{report.roadmap?.goal}</p>
            </div>
            <button onClick={() => navigator.clipboard.writeText(`${report.roadmap?.title}\nCompletion: ${report.completionRate}%\nStreak: ${report.streakMax} days\nSkills: ${report.topSkills?.join(', ')}`)} className="btn btn-ghost btn-sm">
              <Share2 size={12} /> Share
            </button>
          </div>

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px' }}>
            {[
              { label:'Completion', value:`${report.completionRate}%`, icon:Target, color:'var(--accent3)' },
              { label:'Days Done', value:`${report.completedDays}/${report.totalDays}`, icon:Trophy, color:'var(--green)' },
              { label:'Max Streak', value:`${report.streakMax}🔥`, icon:Zap, color:'var(--amber)' },
              { label:'Skills', value:report.topSkills?.length||0, icon:TrendingUp, color:'var(--blue)' },
            ].map(({ label, value, icon:Icon, color }) => (
              <div key={label} className="card-feed" style={{ padding:'16px' }}>
                <Icon size={14} style={{ color, marginBottom:'6px' }} />
                <div style={{ fontSize:'20px', fontWeight:'800', color, letterSpacing:'-0.5px' }}>{value}</div>
                <div style={{ fontSize:'11px', color:'var(--text3)', marginTop:'2px' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="card-feed" style={{ padding:'20px' }}>
            <div style={{ fontSize:'13px', fontWeight:'700', marginBottom:'12px' }}>Activity</div>
            <div style={{ display:'flex', gap:'3px', flexWrap:'wrap' }}>
              {(report.timelineData||[]).sort((a:any,b:any)=>a.day-b.day).map((t:any) => (
                <div key={t.day} title={`Day ${t.day}`} style={{ width:'20px', height:'20px', borderRadius:'4px', background: t.done ? 'var(--green)' : 'var(--bg4)', opacity: t.done ? 1 : 0.4 }} />
              ))}
            </div>
          </div>

          {/* Projects */}
          <div className="card-feed" style={{ padding:'20px' }}>
            <div style={{ fontSize:'13px', fontWeight:'700', marginBottom:'14px' }}>Projects</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {(report.projectsData||[]).map((p:any) => {
                const pct = p.total > 0 ? Math.round(p.completed/p.total*100) : 0
                const bar = BAR[p.color] || '#7c3aed'
                return (
                  <div key={p.name}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
                      <span style={{ fontSize:'13px', fontWeight:'500' }}>{p.name}</span>
                      <span style={{ fontSize:'12px', color:'var(--text3)' }}>{p.completed}/{p.total} · {pct}%</span>
                    </div>
                    <div style={{ height:'3px', background:'var(--bg5)', borderRadius:'2px', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:bar, borderRadius:'2px' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Skills */}
          {report.topSkills?.length > 0 && (
            <div className="card-feed" style={{ padding:'20px' }}>
              <div style={{ fontSize:'13px', fontWeight:'700', marginBottom:'12px' }}>Skills Learned</div>
              <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                {report.topSkills.map((s:string) => (
                  <span key={s} style={{ fontSize:'12px', padding:'5px 12px', background:'var(--accent-bg)', color:'var(--accent3)', border:'1px solid var(--accent-border)', borderRadius:'999px', fontWeight:'500' }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* AI Summary */}
          {report.summary && (
            <div className="card-feed" style={{ padding:'20px', borderColor:'var(--accent-border)', background:'rgba(124,58,237,0.04)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px' }}>
                <Brain size={15} style={{ color:'var(--accent3)' }} />
                <span style={{ fontSize:'13px', fontWeight:'700', color:'var(--accent3)' }}>AI Analysis</span>
              </div>
              <p style={{ fontSize:'13px', color:'var(--text2)', lineHeight:'1.7', margin:0 }}>{report.summary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
