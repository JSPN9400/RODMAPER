'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, PenLine, Plus, Minus, Loader2, Brain, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react'

const COLORS = ['violet','blue','green','amber','red','teal','pink']
const COLOR_HEX: Record<string, string> = {
  violet:'#7c3aed', blue:'#2563eb', green:'#16a34a',
  amber:'#d97706', red:'#dc2626', teal:'#0d9488', pink:'#db2777'
}

export default function CreateRoadmap() {
  const router = useRouter()
  const [mode, setMode] = useState<'choose'|'ai'|'manual'>('choose')
  const [loading, setLoading] = useState(false)
  const [color, setColor] = useState('violet')
  const [error, setError] = useState('')

  // NLU state
  const [smartInput, setSmartInput] = useState('')
  const [nluLoading, setNluLoading] = useState(false)
  const [nluResult, setNluResult] = useState<any>(null)
  const [nluDone, setNluDone] = useState(false)

  // AI form
  const [ai, setAI] = useState({ goal:'', background:'', days:'30', hoursPerDay:'4', focusAreas:'' })

  // Manual form
  const [manual, setManual] = useState({ title:'', goal:'', description:'', totalDays:'30' })
  const [projects, setProjects] = useState([{ name:'', startDay:'1', endDay:'7', color:'blue' }])
  const [tasks, setTasks] = useState([{ day:'1', title:'', description:'', projectIndex:'0' }])

  // ── NLU: Smart parse ──────────────────────────────────────────────────────
  async function runNLU() {
    if (!smartInput.trim()) return
    setNluLoading(true)
    setNluResult(null)
    try {
      const res = await fetch('/api/nlu', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: smartInput })
      })
      const data = await res.json()
      setNluResult(data)
      // Auto-fill AI form
      setAI({
        goal: data.goal || smartInput,
        background: data.background || '',
        days: String(data.days || 30),
        hoursPerDay: String(data.hoursPerDay || 4),
        focusAreas: data.focusAreas || ''
      })
      setNluDone(true)
    } catch {
      setError('NLU parse failed — fill manually')
    }
    setNluLoading(false)
  }

  function applyNLU() {
    setMode('ai')
    setNluDone(false)
  }

  // ── Submit AI ──────────────────────────────────────────────────────────────
  async function submitAI() {
    if (!ai.goal || !ai.background) { setError('Goal and background are required'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/roadmaps', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'ai', color, ...ai, days: +ai.days, hoursPerDay: +ai.hoursPerDay })
      })
      if (!res.ok) {
        const err = await res.text()
        throw new Error(err.includes('credit') ? 'Gemini API key missing or quota exceeded. Check GEMINI_API_KEY in .env.local' : err)
      }
      const data = await res.json()
      router.push(`/roadmap/${data.id}`)
    } catch (e: any) {
      setError(e.message || 'Failed to generate')
      setLoading(false)
    }
  }

  // ── Submit Manual ──────────────────────────────────────────────────────────
  async function submitManual() {
    if (!manual.title || !manual.goal) { setError('Title and goal required'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/roadmaps', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'manual', color, ...manual, totalDays: +manual.totalDays,
          projects: projects.map(p => ({ ...p, startDay: +p.startDay, endDay: +p.endDay })),
          tasks: tasks.map(t => ({ ...t, day: +t.day, projectIndex: +t.projectIndex }))
        })
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      router.push(`/roadmap/${data.id}`)
    } catch (e: any) { setError(e.message || 'Failed'); setLoading(false) }
  }

  // ── Color picker ──────────────────────────────────────────────────────────
  const ColorPicker = () => (
    <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'10px', padding:'16px 18px', marginBottom:'12px' }}>
      <div className="label">Color</div>
      <div style={{ display:'flex', gap:'8px' }}>
        {COLORS.map(c => (
          <button key={c} onClick={() => setColor(c)} style={{
            width:'26px', height:'26px', borderRadius:'50%', border: color===c ? `3px solid ${COLOR_HEX[c]}` : '2px solid transparent',
            background: COLOR_HEX[c], cursor:'pointer', outline: color===c ? `2px solid white` : 'none',
            outlineOffset: '-4px', transition:'all 0.15s', transform: color===c ? 'scale(1.15)' : 'scale(1)'
          }} />
        ))}
      </div>
    </div>
  )

  // ── Choose mode ────────────────────────────────────────────────────────────
  if (mode === 'choose') return (
    <div style={{ padding:'36px 40px', maxWidth:'700px' }}>
      <h1 style={{ fontSize:'22px', fontWeight:'700', letterSpacing:'-0.5px', marginBottom:'6px' }}>Create Roadmap</h1>
      <p style={{ fontSize:'13px', color:'var(--text3)', marginBottom:'32px' }}>Choose how to build your learning roadmap</p>

      {/* Smart NLU input */}
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'14px', padding:'22px', marginBottom:'20px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px' }}>
          <Brain size={16} style={{ color:'var(--accent3)' }} />
          <span style={{ fontSize:'14px', fontWeight:'600' }}>Just tell us what you want</span>
          <span style={{ fontSize:'11px', padding:'2px 7px', background:'var(--accent-bg)', color:'var(--accent3)', border:'1px solid var(--accent-border)', borderRadius:'4px' }}>NLU Smart</span>
        </div>
        <p style={{ fontSize:'12px', color:'var(--text3)', marginBottom:'12px' }}>Type anything — AI understands your intent and builds the roadmap</p>
        <div style={{ display:'flex', gap:'8px' }}>
          <input
            className="input" style={{ flex:1 }}
            placeholder="e.g. I want to become a data analyst in 30 days, I am a student..."
            value={smartInput}
            onChange={e => setSmartInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && runNLU()}
          />
          <button onClick={runNLU} disabled={nluLoading || !smartInput.trim()} className="btn btn-primary">
            {nluLoading ? <Loader2 size={14} className="animate-spin" /> : <Brain size={14} />}
            {nluLoading ? 'Parsing...' : 'Parse'}
          </button>
        </div>

        {/* NLU Result */}
        {nluResult && (
          <div style={{ marginTop:'14px', background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:'8px', padding:'14px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                <CheckCircle2 size={14} style={{ color:'var(--green)' }} />
                <span style={{ fontSize:'12px', fontWeight:'600', color:'var(--green)' }}>Intent understood</span>
                <span style={{ fontSize:'11px', color:'var(--text3)' }}>({Math.round(nluResult.confidence * 100)}% confidence)</span>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'10px' }}>
              {[
                { label:'Goal', val: nluResult.goal },
                { label:'Duration', val: `${nluResult.days} days` },
                { label:'Hours/Day', val: `${nluResult.hoursPerDay} hrs` },
                { label:'Focus', val: nluResult.focusAreas || 'Auto-detect' },
              ].map(({ label, val }) => (
                <div key={label} style={{ background:'var(--bg4)', borderRadius:'6px', padding:'8px 10px' }}>
                  <div style={{ fontSize:'10px', color:'var(--text4)', marginBottom:'2px', textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</div>
                  <div style={{ fontSize:'12px', color:'var(--text1)', fontWeight:'500' }}>{val}</div>
                </div>
              ))}
            </div>
            {nluResult.suggestions?.length > 0 && (
              <div style={{ marginBottom:'10px' }}>
                {nluResult.suggestions.map((s: string, i: number) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'6px', fontSize:'12px', color:'var(--amber)', marginBottom:'4px' }}>
                    <AlertCircle size={12} style={{ marginTop:'1px', flexShrink:0 }} /> {s}
                  </div>
                ))}
              </div>
            )}
            <button onClick={applyNLU} className="btn btn-primary" style={{ width:'100%' }}>
              <Sparkles size={14} /> Generate Roadmap with These Settings
            </button>
          </div>
        )}
      </div>

      {/* Mode cards */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
        <button onClick={() => setMode('ai')} style={{
          background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px',
          padding:'20px', textAlign:'left', cursor:'pointer', transition:'all 0.15s'
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='var(--accent-border)'; (e.currentTarget as HTMLElement).style.background='var(--bg3)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='var(--border)'; (e.currentTarget as HTMLElement).style.background='var(--bg2)'; }}
        >
          <div style={{ width:'36px', height:'36px', borderRadius:'9px', background:'var(--accent-bg)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'12px' }}>
            <Sparkles size={18} style={{ color:'var(--accent3)' }} />
          </div>
          <div style={{ fontSize:'14px', fontWeight:'600', color:'var(--text1)', marginBottom:'5px' }}>AI Generator</div>
          <div style={{ fontSize:'12px', color:'var(--text3)', lineHeight:'1.5' }}>Tell AI your goal — complete roadmap with daily tasks and resources</div>
          <div style={{ fontSize:'12px', color:'var(--accent3)', marginTop:'10px', display:'flex', alignItems:'center', gap:'4px' }}>
            Recommended <ChevronRight size={11} />
          </div>
        </button>

        <button onClick={() => setMode('manual')} style={{
          background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px',
          padding:'20px', textAlign:'left', cursor:'pointer', transition:'all 0.15s'
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='var(--border2)'; (e.currentTarget as HTMLElement).style.background='var(--bg3)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='var(--border)'; (e.currentTarget as HTMLElement).style.background='var(--bg2)'; }}
        >
          <div style={{ width:'36px', height:'36px', borderRadius:'9px', background:'var(--bg4)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'12px' }}>
            <PenLine size={18} style={{ color:'var(--text2)' }} />
          </div>
          <div style={{ fontSize:'14px', fontWeight:'600', color:'var(--text1)', marginBottom:'5px' }}>Manual Builder</div>
          <div style={{ fontSize:'12px', color:'var(--text3)', lineHeight:'1.5' }}>Full control — define your own projects, tasks and schedule</div>
          <div style={{ fontSize:'12px', color:'var(--text3)', marginTop:'10px', display:'flex', alignItems:'center', gap:'4px' }}>
            Custom <ChevronRight size={11} />
          </div>
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ padding:'36px 40px', maxWidth:'680px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'28px' }}>
        <button onClick={() => setMode('choose')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', fontSize:'13px', display:'flex', alignItems:'center', gap:'4px', fontFamily:'var(--font)' }}>← Back</button>
        <h1 style={{ fontSize:'18px', fontWeight:'700', margin:0 }}>
          {mode === 'ai' ? '✦ AI Roadmap Generator' : '✎ Manual Roadmap Builder'}
        </h1>
      </div>

      {error && (
        <div style={{ marginBottom:'16px', padding:'12px 14px', background:'var(--red-bg)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'8px', fontSize:'13px', color:'var(--red)' }}>
          {error}
        </div>
      )}

      <ColorPicker />

      {/* AI Form */}
      {mode === 'ai' && (
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'10px', padding:'18px', display:'flex', flexDirection:'column', gap:'14px' }}>
            <div>
              <label className="label">Target Goal *</label>
              <input className="input" placeholder="e.g. AI-Powered Data Analyst, Full Stack Developer..." value={ai.goal} onChange={e => setAI({...ai, goal:e.target.value})} />
            </div>
            <div>
              <label className="label">Your Background *</label>
              <textarea className="input" style={{ minHeight:'90px' }} placeholder="Your current skills, experience, education..." value={ai.background} onChange={e => setAI({...ai, background:e.target.value})} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
              <div>
                <label className="label">Duration</label>
                <select className="input" value={ai.days} onChange={e => setAI({...ai, days:e.target.value})}>
                  {['15','30','60','90'].map(d => <option key={d} value={d}>{d} days</option>)}
                </select>
              </div>
              <div>
                <label className="label">Hours / Day</label>
                <select className="input" value={ai.hoursPerDay} onChange={e => setAI({...ai, hoursPerDay:e.target.value})}>
                  {[2,3,4,5,6,7,8].map(h => <option key={h} value={h}>{h} hrs</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Focus Areas (optional)</label>
              <input className="input" placeholder="e.g. Python + ML, SQL + Power BI, React + Node..." value={ai.focusAreas} onChange={e => setAI({...ai, focusAreas:e.target.value})} />
            </div>
          </div>
          <button onClick={submitAI} disabled={loading} className="btn btn-primary btn-lg" style={{ width:'100%', justifyContent:'center' }}>
            {loading ? <><Loader2 size={15} style={{ animation:'spin 0.7s linear infinite' }} /> Generating roadmap...</> : <><Sparkles size={15} /> Generate My Roadmap</>}
          </button>
          {loading && <p style={{ textAlign:'center', fontSize:'12px', color:'var(--text4)' }}>AI is building your personalized roadmap — 10-20 seconds</p>}
        </div>
      )}

      {/* Manual Form */}
      {mode === 'manual' && (
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'10px', padding:'18px', display:'flex', flexDirection:'column', gap:'14px' }}>
            <div><label className="label">Title *</label><input className="input" placeholder="e.g. 30-Day Python Roadmap" value={manual.title} onChange={e => setManual({...manual, title:e.target.value})} /></div>
            <div><label className="label">Goal *</label><input className="input" placeholder="e.g. Become a Python Developer" value={manual.goal} onChange={e => setManual({...manual, goal:e.target.value})} /></div>
            <div><label className="label">Description</label><textarea className="input" style={{ minHeight:'60px' }} value={manual.description} onChange={e => setManual({...manual, description:e.target.value})} /></div>
            <div><label className="label">Total Days</label><input className="input" type="number" min={1} max={365} value={manual.totalDays} onChange={e => setManual({...manual, totalDays:e.target.value})} /></div>
          </div>

          {/* Projects */}
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'10px', padding:'18px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'12px' }}>
              <label className="label" style={{ margin:0 }}>Projects</label>
              <button onClick={() => setProjects([...projects, { name:'', startDay:'', endDay:'', color:'blue' }])} className="btn btn-ghost btn-sm"><Plus size={12} /> Add</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {projects.map((p, i) => (
                <div key={i} style={{ background:'var(--bg3)', borderRadius:'8px', padding:'12px', display:'flex', flexDirection:'column', gap:'8px' }}>
                  <div style={{ display:'flex', gap:'8px' }}>
                    <input className="input" style={{ flex:1 }} placeholder="Project name" value={p.name} onChange={e => { const a=[...projects]; a[i]={...a[i], name:e.target.value}; setProjects(a) }} />
                    {projects.length > 1 && <button onClick={() => setProjects(projects.filter((_,j)=>j!==i))} className="btn btn-danger btn-sm btn-icon"><Minus size={13}/></button>}
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                    <input className="input" type="number" placeholder="Start day" value={p.startDay} onChange={e => { const a=[...projects]; a[i]={...a[i], startDay:e.target.value}; setProjects(a) }} />
                    <input className="input" type="number" placeholder="End day" value={p.endDay} onChange={e => { const a=[...projects]; a[i]={...a[i], endDay:e.target.value}; setProjects(a) }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks */}
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'10px', padding:'18px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'12px' }}>
              <label className="label" style={{ margin:0 }}>Tasks</label>
              <button onClick={() => setTasks([...tasks, { day:'', title:'', description:'', projectIndex:'0' }])} className="btn btn-ghost btn-sm"><Plus size={12} /> Add Task</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px', maxHeight:'280px', overflowY:'auto' }}>
              {tasks.map((t, i) => (
                <div key={i} style={{ background:'var(--bg3)', borderRadius:'8px', padding:'10px', display:'flex', flexDirection:'column', gap:'6px' }}>
                  <div style={{ display:'flex', gap:'6px' }}>
                    <input className="input" style={{ width:'70px' }} type="number" placeholder="Day" value={t.day} onChange={e => { const a=[...tasks]; a[i]={...a[i], day:e.target.value}; setTasks(a) }} />
                    <input className="input" style={{ flex:1 }} placeholder="Task title" value={t.title} onChange={e => { const a=[...tasks]; a[i]={...a[i], title:e.target.value}; setTasks(a) }} />
                    <button onClick={() => setTasks(tasks.filter((_,j)=>j!==i))} className="btn btn-danger btn-sm btn-icon"><Minus size={13}/></button>
                  </div>
                  <select className="input" value={t.projectIndex} onChange={e => { const a=[...tasks]; a[i]={...a[i], projectIndex:e.target.value}; setTasks(a) }}>
                    {projects.map((p,pi) => <option key={pi} value={pi}>{p.name || `Project ${pi+1}`}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <button onClick={submitManual} disabled={loading} className="btn btn-primary btn-lg" style={{ width:'100%', justifyContent:'center' }}>
            {loading ? <><Loader2 size={15} style={{ animation:'spin 0.7s linear infinite' }} /> Creating...</> : <><PenLine size={15} /> Create Roadmap</>}
          </button>
        </div>
      )}
    </div>
  )
}
