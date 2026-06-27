'use client'
import { useEffect, useState } from 'react'
import { Brain, TrendingUp, Zap, Target, RefreshCw, ChevronRight, Lightbulb, AlertTriangle } from 'lucide-react'

export default function InsightsPage() {
  const [roadmaps, setRoadmaps] = useState<any[]>([])
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [suggestion, setSuggestion] = useState<any>(null)
  const [sugLoading, setSugLoading] = useState(false)

  useEffect(() => {
    fetch('/api/roadmaps').then(r => r.json()).then(d => {
      const active = (Array.isArray(d) ? d : []).filter((r: any) => r.status === 'ACTIVE')
      setRoadmaps(active)
      if (active.length > 0) setSelected(active[0].id)
    })
  }, [])

  async function analyze() {
    if (!selected) return
    setLoading(true); setData(null)
    const res = await fetch('/api/self-learn', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roadmapId: selected, action: 'analyze' })
    })
    const d = await res.json()
    setData(d); setLoading(false)
  }

  async function getSuggestion() {
    if (!selected) return
    setSugLoading(true); setSuggestion(null)
    const res = await fetch('/api/self-learn', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roadmapId: selected, action: 'suggest' })
    })
    const d = await res.json()
    setSuggestion(d); setSugLoading(false)
  }

  const SCORE_COLOR = (s: number) => s >= 75 ? 'var(--green)' : s >= 50 ? 'var(--amber)' : 'var(--red)'

  return (
    <div style={{ padding: '36px 40px', maxWidth: '820px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Brain size={18} style={{ color: 'var(--accent3)' }} />
            <h1 style={{ fontSize: '22px', fontWeight: '700', margin: 0, letterSpacing: '-0.5px' }}>Self-Learning Insights</h1>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text3)', margin: 0 }}>AI analyzes your patterns and suggests personalized improvements</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select className="input" style={{ width: '220px' }} value={selected} onChange={e => setSelected(e.target.value)}>
            {roadmaps.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
            {roadmaps.length === 0 && <option value="">No active roadmaps</option>}
          </select>
          <button onClick={analyze} disabled={loading || !selected} className="btn btn-primary">
            {loading ? <RefreshCw size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Brain size={14} />}
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </div>

      {/* Empty */}
      {!data && !loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '14px' }}>
          <Brain size={32} style={{ color: 'var(--text4)', marginBottom: '14px' }} />
          <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Ready to learn about your learning?</h2>
          <p style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '20px' }}>Select a roadmap and click Analyze — AI will study your patterns</p>
          <button onClick={analyze} disabled={!selected} className="btn btn-primary">
            <Brain size={14} /> Start Analysis
          </button>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '14px' }}>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '16px' }}>
            {[0,1,2].map(i => <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', animation: `pulse-dot 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text3)' }}>AI is analyzing your learning patterns...</p>
        </div>
      )}

      {/* Results */}
      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Motivation score + learning style */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Motivation Score</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: SCORE_COLOR(data.motivationScore), letterSpacing: '-1px' }}>{data.motivationScore}</div>
              <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>out of 100</div>
            </div>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Learning Style</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--accent3)' }}>{data.learningStyle}</div>
            </div>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Completion</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text1)', letterSpacing: '-1px' }}>{data.completionRate}%</div>
              <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>Max streak: {data.streakMax} days</div>
            </div>
          </div>

          {/* Insights */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Lightbulb size={15} style={{ color: 'var(--amber)' }} />
              <span style={{ fontSize: '13px', fontWeight: '600' }}>Pattern Insights</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(data.insights || []).map((ins: string, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', background: 'var(--bg3)', borderRadius: '8px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent3)', flexShrink: 0, marginTop: '5px' }} />
                  <span style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: '1.5' }}>{ins}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Next steps */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Target size={15} style={{ color: 'var(--green)' }} />
              <span style={{ fontSize: '13px', fontWeight: '600' }}>Recommended Next Steps</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(data.nextSteps || []).map((step: string, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--green-bg)', border: '1px solid var(--green-border)', borderRadius: '8px' }}>
                  <ChevronRight size={13} style={{ color: 'var(--green)', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: 'var(--text1)' }}>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Adjustments */}
          {data.adjustments?.length > 0 && (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <AlertTriangle size={15} style={{ color: 'var(--amber)' }} />
                <span style={{ fontSize: '13px', fontWeight: '600' }}>Suggested Adjustments</span>
              </div>
              {data.adjustments.map((adj: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: '10px', padding: '10px 12px', background: 'var(--amber-bg)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--amber)', minWidth: '45px' }}>Day {adj.day}</span>
                  <span style={{ fontSize: '13px', color: 'var(--text2)' }}>{adj.suggestion}</span>
                </div>
              ))}
            </div>
          )}

          {/* Top skills */}
          {data.topSkills?.length > 0 && (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>Skills You Are Building</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {data.topSkills.map((s: string) => (
                  <span key={s} style={{ fontSize: '12px', padding: '5px 12px', background: 'var(--accent-bg)', color: 'var(--accent3)', border: '1px solid var(--accent-border)', borderRadius: '20px', fontWeight: '500' }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Smart next task suggestion */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: suggestion ? '14px' : '0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={15} style={{ color: 'var(--accent3)' }} />
                <span style={{ fontSize: '13px', fontWeight: '600' }}>Smart Task Suggestion</span>
              </div>
              <button onClick={getSuggestion} disabled={sugLoading} className="btn btn-ghost btn-sm">
                {sugLoading ? <RefreshCw size={12} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Zap size={12} />}
                {sugLoading ? 'Thinking...' : 'Get Suggestion'}
              </button>
            </div>
            {suggestion && (
              <div style={{ background: 'var(--bg3)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text1)', marginBottom: '6px' }}>{suggestion.suggestedTopic}</div>
                <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '10px', lineHeight: '1.5' }}>{suggestion.reason}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text3)' }}>Est. time:</span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--amber)' }}>{suggestion.estimatedHours} hrs</span>
                </div>
                {suggestion.resources?.map((r: any, i: number) => (
                  <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'var(--accent3)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    → {r.name}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
