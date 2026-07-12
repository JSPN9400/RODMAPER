/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

'use client'
import { useEffect, useState } from 'react'
import { Brain, TrendingUp, Target, RefreshCw, Lightbulb, ChevronRight, Zap } from 'lucide-react'

export default function InsightsPage() {
  const [roadmaps, setRoadmaps] = useState<any[]>([])
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [suggestion, setSuggestion] = useState<any>(null)
  const [sugLoading, setSugLoading] = useState(false)

  useEffect(() => {
    fetch('/api/roadmaps').then(r=>r.json()).then(d => {
      const arr = (Array.isArray(d)?d:[]).filter((r:any)=>r.status==='ACTIVE')
      setRoadmaps(arr)
      if (arr.length>0) setSelected(arr[0].id)
    })
  }, [])

  async function analyze() {
    if (!selected) return
    setLoading(true); setData(null)
    const res = await fetch('/api/self-learn', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ roadmapId: selected, action:'analyze' }) })
    setData(await res.json()); setLoading(false)
  }

  async function getSuggestion() {
    setSugLoading(true); setSuggestion(null)
    const res = await fetch('/api/self-learn', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ roadmapId: selected, action:'suggest' }) })
    setSuggestion(await res.json()); setSugLoading(false)
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
              <div style={{ fontSize:'28px', fontWeight:'800', color:'#fff' }}>{data.completionRate}%</div>
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
                  <span style={{ fontSize:'13px', color:'#fff' }}>{step}</span>
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
              <button onClick={getSuggestion} disabled={sugLoading} className="btn btn-ghost btn-sm">
                {sugLoading?<RefreshCw size={12} style={{ animation:'spin 0.7s linear infinite' }}/>:<Zap size={12}/>}
                {sugLoading?'Thinking...':'Get Suggestion'}
              </button>
            </div>
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
