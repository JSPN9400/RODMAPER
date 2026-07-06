'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Trophy, TrendingUp, Zap, Target, Share2, Brain, ArrowRight } from 'lucide-react'
import { PageError, PageSpinner } from '@/components/ui/PageState'

const BAR: Record<string, string> = {
  violet:'#7c3aed', blue:'#2563eb', green:'#16a34a',
  amber:'#d97706', red:'#dc2626', teal:'#0d9488', pink:'#db2777',
}

export default function ReportsContent() {
  const searchParams = useSearchParams()
  const [roadmaps, setRoadmaps] = useState<any[]>([])
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [bootLoading, setBootLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(searchParams.get('roadmapId') || '')

  useEffect(() => {
    fetch('/api/roadmaps')
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || 'Failed to load reports')
        const arr = Array.isArray(data) ? data : []
        setRoadmaps(arr)
        if (!selected && arr.length > 0) setSelected(arr[0].id)
      })
      .catch((err) => setError(err.message || 'Failed to load reports'))
      .finally(() => setBootLoading(false))
  }, [])

  useEffect(() => {
    if (!selected) { setLoading(false); return }
    setLoading(true)
    fetch(`/api/reports?roadmapId=${selected}`)
      .then(async (r) => {
        if (!r.ok) {
          setReport(null)
          setLoading(false)
          return null
        }
        const data = await r.json()
        setReport(data)
        setLoading(false)
        return data
      })
  }, [selected])

  function copyShare() {
    if (!report) return
    navigator.clipboard.writeText(
      `📊 ${report.roadmap.title}\n${report.roadmap.goal}\n\nCompletion: ${report.completionRate}% · ${report.completedDays}/${report.totalDays} days\nMax Streak: ${report.streakMax} 🔥\nSkills: ${report.topSkills?.join(', ')}\n\n${report.summary || ''}`
    )
  }

  if (bootLoading) return <PageSpinner label="Loading reports..." />
  if (error) return <PageError title="Reports could not load" message={error} />

  return (
    <div style={{ padding: '36px 40px', maxWidth: '860px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.5px', margin: '0 0 4px' }}>Reports</h1>
          <p style={{ fontSize: '13px', color: 'var(--text3)', margin: 0 }}>Completion analytics and learning insights</p>
        </div>
        <select className="input" style={{ width: '260px' }} value={selected} onChange={e => setSelected(e.target.value)}>
          <option value="">Select roadmap...</option>
          {roadmaps.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
        </select>
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
          <div className="spinner" style={{ width: '24px', height: '24px', borderWidth: '2.5px' }} />
        </div>
      )}

      {!loading && !report && selected && (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '14px' }}>
          <div style={{ fontSize: '36px', marginBottom: '14px' }}>📊</div>
          <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>No report yet</h2>
          <p style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '20px' }}>Complete some tasks, then click "Report" on the roadmap page</p>
          <Link href={`/roadmap/${selected}`} className="btn btn-primary" style={{ display: 'inline-flex' }}>Go to Roadmap <ArrowRight size={13} /></Link>
        </div>
      )}

      {!loading && !selected && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>📈</div>
          <p style={{ fontSize: '13px', color: 'var(--text3)' }}>Select a roadmap to view its report</p>
        </div>
      )}

      {!loading && report && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 4px' }}>{report.roadmap?.title}</h2>
              <p style={{ fontSize: '13px', color: 'var(--text3)', margin: '0 0 6px' }}>{report.roadmap?.goal}</p>
              <p style={{ fontSize: '11px', color: 'var(--text4)', margin: 0 }}>Generated {new Date(report.generatedAt).toLocaleDateString()}</p>
            </div>
            <button onClick={copyShare} className="btn btn-ghost btn-sm" style={{ display: 'flex' }}><Share2 size={12} /> Share</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {[
              { label: 'Completion', value: `${report.completionRate}%`, icon: Target, color: 'var(--accent3)' },
              { label: 'Days Done', value: `${report.completedDays}/${report.totalDays}`, icon: Trophy, color: 'var(--green)' },
              { label: 'Max Streak', value: report.streakMax, icon: Zap, color: 'var(--amber)' },
              { label: 'Skills', value: report.topSkills?.length || 0, icon: TrendingUp, color: 'var(--blue)' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px' }}>
                <Icon size={15} style={{ color, marginBottom: '8px' }} />
                <div style={{ fontSize: '24px', fontWeight: '800', color, letterSpacing: '-1px', marginBottom: '3px' }}>{value}</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '14px' }}>Activity Timeline</div>
            <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
              {(report.timelineData || []).sort((a: any, b: any) => a.day - b.day).map((t: any) => (
                <div key={t.day} title={`Day ${t.day}: ${t.done ? 'Done' : 'Skipped'}`} style={{ width: '22px', height: '22px', borderRadius: '4px', background: t.done ? 'var(--green)' : 'var(--bg4)', opacity: t.done ? 1 : 0.5 }} />
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>Projects</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(report.projectsData || []).map((p: any) => {
                const pct = p.total > 0 ? Math.round(p.completed / p.total * 100) : 0
                const bar = BAR[p.color] || '#7c3aed'
                return (
                  <div key={p.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '500' }}>{p.name}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{p.completed}/{p.total} · {pct}%</span>
                    </div>
                    <div style={{ height: '4px', background: 'var(--bg5)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: bar, borderRadius: '2px' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {report.topSkills?.length > 0 && (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>Skills Learned</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {report.topSkills.map((s: string) => (
                  <span key={s} style={{ fontSize: '12px', padding: '5px 12px', background: 'var(--accent-bg)', color: 'var(--accent3)', border: '1px solid var(--accent-border)', borderRadius: '20px', fontWeight: '500' }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {report.summary && (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--accent-border)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Brain size={15} style={{ color: 'var(--accent3)' }} />
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent3)' }}>AI Analysis</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: '1.7', margin: 0, whiteSpace: 'pre-wrap' }}>{report.summary}</p>
            </div>
          )}

          <Link href="/insights" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: '12px', textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Brain size={16} style={{ color: 'var(--accent3)' }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text1)' }}>Get deeper AI insights</div>
                <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Analyze your learning patterns</div>
              </div>
            </div>
            <ArrowRight size={15} style={{ color: 'var(--accent3)' }} />
          </Link>
        </div>
      )}
    </div>
  )
}
