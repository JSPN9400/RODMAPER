/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

'use client'
import { useEffect, useState } from 'react'
import { Brain, TrendingUp, Target, RefreshCw, Lightbulb, ChevronRight, Zap, Clock, CalendarDays, Award, Layers, BookOpen, Sparkles } from 'lucide-react'

function formatHourLabel(h: number): string {
  const period = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12} ${period}`
}

const SKILL_COLORS = ['cobalt', 'sky', 'mint', 'amber', 'red', 'teal', 'pink']

export default function InsightsPage() {
  const [roadmaps, setRoadmaps] = useState<any[]>([])
  const [selected, setSelected] = useState('')

  const [skillData, setSkillData] = useState<any>(null)
  const [skillLoading, setSkillLoading] = useState(true)

  const [reflections, setReflections] = useState<any[]>([])
  const [reflectionsLoading, setReflectionsLoading] = useState(true)
  const [generatingReflection, setGeneratingReflection] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [analysisError, setAnalysisError] = useState('')
  const [suggestion, setSuggestion] = useState<any>(null)
  const [sugLoading, setSugLoading] = useState(false)
  const [sugError, setSugError] = useState('')

  const [activity, setActivity] = useState<any>(null)
  const [activityLoading, setActivityLoading] = useState(true)

  useEffect(() => {
    fetch('/api/roadmaps').then(r=>r.json()).then(d => {
      const arr = (Array.isArray(d)?d:[]).filter((r:any)=>r.status==='ACTIVE')
      setRoadmaps(arr)
      if (arr.length>0) setSelected(arr[0].id)
    })
    fetch('/api/accountability').then(r => r.ok ? r.json() : null).then(setActivity).catch(() => setActivity(null)).finally(() => setActivityLoading(false))
    fetch('/api/insights/skills').then(r => r.ok ? r.json() : null).then(setSkillData).catch(() => setSkillData(null)).finally(() => setSkillLoading(false))
    fetch('/api/reflection').then(r => r.ok ? r.json() : null).then(d => setReflections(Array.isArray(d) ? d : [])).catch(() => setReflections([])).finally(() => setReflectionsLoading(false))
  }, [])

  async function generateReflection() {
    setGeneratingReflection(true)
    try {
      const res = await fetch('/api/reflection', { method: 'POST' })
      const data = await res.json()
      if (res.ok) setReflections((prev) => [data, ...prev.filter((r) => r.id !== data.id)])
    } finally {
      setGeneratingReflection(false)
    }
  }

  async function analyze() {
    if (!selected) return
    setLoading(true); setData(null); setAnalysisError('')
    try {
      const res = await fetch('/api/self-learn', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ roadmapId: selected, action:'analyze' }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Analysis failed')
      setData(json)
    } catch (e: any) {
      setAnalysisError(e.message || 'Analysis is unavailable right now')
    } finally {
      setLoading(false)
    }
  }

  async function getSuggestion() {
    setSugLoading(true); setSuggestion(null); setSugError('')
    try {
      const res = await fetch('/api/self-learn', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ roadmapId: selected, action:'suggest' }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Suggestion failed')
      setSuggestion(json)
    } catch (e: any) {
      setSugError(e.message || 'Suggestion is unavailable right now')
    } finally {
      setSugLoading(false)
    }
  }

  const scoreColor = (s:number) => s>=75?'var(--green)':s>=50?'var(--amber)':'var(--red)'

  return (
    <div style={{ padding:'20px 16px 80px', maxWidth:'820px', margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'24px' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
            <Brain size={18} style={{ color:'var(--accent3)' }} />
            <h1 style={{ fontSize:'22px', fontWeight:'800' }}>AI Insights</h1>
          </div>
          <p style={{ fontSize:'13px', color:'var(--text3)' }}>AI analyzes your patterns and suggests improvements</p>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <select className="input" style={{ width:'200px' }} value={selected} onChange={e=>setSelected(e.target.value)}>
            {roadmaps.map(r=><option key={r.id} value={r.id}>{r.title}</option>)}
            {roadmaps.length===0&&<option value="">No active roadmaps</option>}
          </select>
          <button onClick={analyze} disabled={loading||!selected} className="btn btn-primary">
            {loading?<RefreshCw size={14} style={{ animation:'spin 0.7s linear infinite' }}/>:<Brain size={14}/>}
            {loading?'Analyzing...':'Analyze'}
          </button>
        </div>
      </div>

      {!activityLoading && activity && activity.calendarHeatmap && (
        <div className="card-feed" style={{ padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <CalendarDays size={15} style={{ color: 'var(--accent3)' }} />
            <span style={{ fontSize: '13px', fontWeight: '700' }}>Your Activity Timetable</span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '16px' }}>
            {activity.typicalWindow
              ? <>You typically show up between <strong style={{ color: 'var(--text2)' }}>{activity.typicalWindow}</strong>.{' '}
                  {activity.todayStatus === 'on_pattern' && "You've already checked in today — right on track."}
                  {activity.todayStatus === 'too_early' && "Your usual window hasn't started yet today — nothing off about that."}
                  {activity.todayStatus === 'off_pattern' && "You're past your usual window today and haven't checked in yet."}
                </>
              : 'Keep completing tasks — a time pattern shows up after a bit more history.'}
          </p>

          {/* Calendar heatmap — last 12 weeks */}
          <div style={{ display: 'flex', gap: '3px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '16px' }}>
            {Array.from({ length: 12 }).map((_, week) => (
              <div key={week} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {Array.from({ length: 7 }).map((_, day) => {
                  const idx = week * 7 + day
                  const cell = activity.calendarHeatmap[idx]
                  if (!cell) return <div key={day} style={{ width: '10px', height: '10px' }} />
                  const intensity = cell.count === 0 ? 0 : cell.count === 1 ? 1 : cell.count <= 3 ? 2 : 3
                  const bg = ['var(--bg4)', 'var(--accent-border)', 'var(--accent2)', 'var(--accent)'][intensity]
                  return <div key={day} title={`${cell.date}: ${cell.count} task${cell.count===1?'':'s'}`} style={{ width: '10px', height: '10px', borderRadius: '2px', background: bg }} />
                })}
              </div>
            ))}
          </div>

          {/* Hourly distribution */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Clock size={12} style={{ color: 'var(--text3)' }} />
            <span className="section-title" style={{ margin: 0 }}>By hour of day</span>
          </div>
          <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '36px' }}>
            {activity.hourlyPattern.map((h: any) => {
              const max = Math.max(...activity.hourlyPattern.map((x: any) => x.count), 1)
              const barH = Math.max(2, Math.round((h.count / max) * 36))
              return <div key={h.hour} title={`${formatHourLabel(h.hour)}: ${h.count}`} style={{ flex: 1, height: `${barH}px`, borderRadius: '1px', background: h.count > 0 ? 'var(--accent)' : 'var(--bg4)' }} />
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text4)', marginTop: '4px' }}>
            <span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>11 PM</span>
          </div>
        </div>
      )}

      {!skillLoading && skillData && (
        <div className="card-feed" style={{ padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Award size={15} style={{ color: 'var(--accent3)' }} />
            <span style={{ fontSize: '13px', fontWeight: '700' }}>Career Readiness</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '18px' }}>
            <div className="stat-figure" style={{ fontSize: '32px', fontWeight: '800', color: 'var(--accent3)' }}>{skillData.readiness.score}</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700' }}>{skillData.readiness.label}</div>
              <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{skillData.readiness.totalSkills} skills · {skillData.readiness.completedRoadmaps} roadmap{skillData.readiness.completedRoadmaps === 1 ? '' : 's'} finished</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: skillData.skills.length > 0 ? '18px' : 0 }}>
            {[
              { label: 'Consistency', value: skillData.readiness.consistencyScore },
              { label: 'Depth', value: skillData.readiness.depthScore },
              { label: 'Breadth', value: skillData.readiness.breadthScore },
            ].map((f) => (
              <div key={f.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text3)', marginBottom: '3px' }}>
                  <span>{f.label}</span><span>{f.value}%</span>
                </div>
                <div style={{ height: '5px', background: 'var(--bg4)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${f.value}%`, background: 'var(--grad)', borderRadius: '999px' }} />
                </div>
              </div>
            ))}
          </div>

          {skillData.skills.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Layers size={12} style={{ color: 'var(--text3)' }} />
                <span className="section-title" style={{ margin: 0 }}>Skill graph</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {skillData.skills.slice(0, 16).map((s: any, i: number) => (
                  <span key={s.name} className="chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: `var(--cat-${SKILL_COLORS[i % SKILL_COLORS.length]})` }} />
                    {s.name} <span style={{ opacity: 0.6 }}>×{s.count}</span>
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="card-feed" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={15} style={{ color: 'var(--accent3)' }} />
            <span style={{ fontSize: '13px', fontWeight: '700' }}>Weekly Reflection</span>
          </div>
          <button onClick={generateReflection} disabled={generatingReflection} className="btn btn-primary btn-sm">
            {generatingReflection ? <RefreshCw size={12} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Sparkles size={12} />}
            {generatingReflection ? 'Writing...' : "This week's reflection"}
          </button>
        </div>

        {!reflectionsLoading && reflections.length === 0 && (
          <p style={{ fontSize: '12px', color: 'var(--text3)' }}>No reflections yet — generate this week&apos;s to get started. One per week, written from your actual activity.</p>
        )}

        {reflections.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {reflections.slice(0, 4).map((r) => (
              <div key={r.id} style={{ padding: '14px', background: 'var(--bg4)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div className="section-title" style={{ marginBottom: '6px' }}>Week of {r.weekStart}</div>
                <p style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap' }}>{r.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {!data&&!loading&&(
        <div className="card-feed" style={{ padding:'48px', textAlign:'center' }}>
          <Brain size={32} style={{ color:'var(--text4)', marginBottom:'14px' }} />
          <h2 style={{ fontSize:'16px', fontWeight:'700', marginBottom:'8px' }}>Ready to analyze your learning?</h2>
          <p style={{ fontSize:'13px', color:'var(--text3)', marginBottom:'20px' }}>Select a roadmap and click Analyze</p>
          <button onClick={analyze} disabled={!selected} className="btn btn-primary"><Brain size={14}/> Start Analysis</button>
        </div>
      )}

      {loading&&(
        <div style={{ textAlign:'center', padding:'48px' }}>
          <div style={{ display:'flex', gap:'6px', justifyContent:'center', marginBottom:'14px' }}>
            {[0,1,2].map(i=><div key={i} style={{ width:'8px', height:'8px', borderRadius:'50%', background:'var(--accent)', animation:`pulse-dot 1.2s ease-in-out ${i*0.2}s infinite` }}/>)}
          </div>
          <p style={{ fontSize:'13px', color:'var(--text3)' }}>AI is analyzing your patterns...</p>
        </div>
      )}

      {analysisError && (
        <div className="card-feed" style={{ padding: '18px', marginBottom: '16px', border: '1px solid rgba(255,69,58,0.24)' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--red)', marginBottom: '4px' }}>Analysis unavailable</div>
          <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{analysisError}</div>
        </div>
      )}

      {data&&(
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px' }}>
            <div className="card-feed" style={{ padding:'18px' }}>
              <div style={{ fontSize:'11px', color:'var(--text3)', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'0.07em' }}>Motivation</div>
              <div style={{ fontSize:'28px', fontWeight:'800', color: scoreColor(data.motivationScore) }}>{data.motivationScore}</div>
              <div style={{ fontSize:'11px', color:'var(--text3)', marginTop:'2px' }}>out of 100</div>
            </div>
            <div className="card-feed" style={{ padding:'18px' }}>
              <div style={{ fontSize:'11px', color:'var(--text3)', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'0.07em' }}>Style</div>
              <div style={{ fontSize:'14px', fontWeight:'700', color:'var(--accent3)', lineHeight:'1.3' }}>{data.learningStyle}</div>
            </div>
            <div className="card-feed" style={{ padding:'18px' }}>
              <div style={{ fontSize:'11px', color:'var(--text3)', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'0.07em' }}>Completion</div>
              <div style={{ fontSize:'28px', fontWeight:'800', color:'var(--text1)' }}>{data.completionRate}%</div>
              <div style={{ fontSize:'11px', color:'var(--text3)', marginTop:'2px' }}>Max streak: {data.streakMax}d</div>
            </div>
          </div>

          <div className="card-feed" style={{ padding:'20px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px' }}>
              <Lightbulb size={14} style={{ color:'var(--amber)' }} />
              <span style={{ fontSize:'13px', fontWeight:'700' }}>Insights</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {(data.insights||[]).map((ins:string,i:number)=>(
                <div key={i} style={{ display:'flex', gap:'10px', padding:'10px 12px', background:'var(--bg3)', borderRadius:'8px' }}>
                  <div style={{ width:'5px', height:'5px', borderRadius:'50%', background:'var(--accent3)', flexShrink:0, marginTop:'6px' }}/>
                  <span style={{ fontSize:'13px', color:'var(--text2)', lineHeight:'1.5' }}>{ins}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card-feed" style={{ padding:'20px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px' }}>
              <Target size={14} style={{ color:'var(--green)' }} />
              <span style={{ fontSize:'13px', fontWeight:'700' }}>Next Steps</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {(data.nextSteps||[]).map((step:string,i:number)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', background:'var(--green-bg)', border:'1px solid var(--green-border)', borderRadius:'8px' }}>
                  <ChevronRight size={13} style={{ color:'var(--green)', flexShrink:0 }} />
                  <span style={{ fontSize:'13px', color:'var(--text1)' }}>{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card-feed" style={{ padding:'20px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: suggestion?'12px':'0' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <Zap size={14} style={{ color:'var(--accent3)' }} />
                <span style={{ fontSize:'13px', fontWeight:'700' }}>Smart Task Suggestion</span>
              </div>
              <button onClick={getSuggestion} disabled={sugLoading || !selected} className="btn btn-ghost btn-sm">
                {sugLoading?<RefreshCw size={12} style={{ animation:'spin 0.7s linear infinite' }}/>:<Zap size={12}/>}
                {sugLoading?'Thinking...':'Get Suggestion'}
              </button>
            </div>
            {sugError && (
              <div style={{ fontSize: '12px', color: 'var(--red)', background: 'var(--red-bg)', padding: '10px 12px', borderRadius: '8px' }}>{sugError}</div>
            )}
            {suggestion&&(
              <div style={{ background:'var(--bg3)', borderRadius:'8px', padding:'14px' }}>
                <div style={{ fontSize:'14px', fontWeight:'700', marginBottom:'5px' }}>{suggestion.suggestedTopic}</div>
                <div style={{ fontSize:'12px', color:'var(--text2)', marginBottom:'8px', lineHeight:'1.5' }}>{suggestion.reason}</div>
                <div style={{ fontSize:'11px', color:'var(--amber)', marginBottom:'8px' }}>Est. {suggestion.estimatedHours} hrs</div>
                {suggestion.resources?.map((r:any,i:number)=>(
                  <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontSize:'12px', color:'var(--accent3)', textDecoration:'none', display:'block' }}>→ {r.name}</a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
