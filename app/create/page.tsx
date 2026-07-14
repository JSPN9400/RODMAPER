/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Brain, CalendarDays, ChevronRight, GraduationCap, Loader2, PenLine, Sparkles } from 'lucide-react'

type GoalType = 'short_term' | 'long_term' | 'manual'
type CurrentLevel = 'beginner' | 'intermediate' | 'advanced'
type FocusType = 'practice' | 'theory' | 'mixed'
type ExamType = 'competitive_exam' | 'degree' | 'certification' | 'career' | 'research'

const levelOptions: CurrentLevel[] = ['beginner', 'intermediate', 'advanced']
const focusOptions: { value: FocusType; label: string }[] = [
  { value: 'practice', label: 'More practice' },
  { value: 'theory', label: 'More theory' },
  { value: 'mixed', label: 'Balanced' },
]
const examTypeOptions: { value: ExamType; label: string }[] = [
  { value: 'competitive_exam', label: 'Competitive exam' },
  { value: 'degree', label: 'Degree / academic program' },
  { value: 'certification', label: 'Certification' },
  { value: 'career', label: 'Career growth' },
  { value: 'research', label: 'Research / PhD' },
]
const colorOptions = [
  { value: 'violet', label: 'Violet', hex: '#7c3aed' },
  { value: 'blue', label: 'Blue', hex: '#2563eb' },
  { value: 'green', label: 'Green', hex: '#16a34a' },
  { value: 'amber', label: 'Amber', hex: '#d97706' },
  { value: 'red', label: 'Red', hex: '#dc2626' },
  { value: 'teal', label: 'Teal', hex: '#0d9488' },
  { value: 'pink', label: 'Pink', hex: '#db2777' },
]

export default function CreateRoadmapPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [goalType, setGoalType] = useState<GoalType | null>(null)
  const [smartGoal, setSmartGoal] = useState('')
  const [smartLoading, setSmartLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [shortTerm, setShortTerm] = useState({
    goal: '',
    currentLevel: 'beginner' as CurrentLevel,
    duration: 30,
    hoursPerDay: 3,
    background: '',
    focusType: 'mixed' as FocusType,
  })

  const [longTerm, setLongTerm] = useState({
    goal: '',
    targetDate: '',
    duration: 180,
    currentLevel: 'beginner' as CurrentLevel,
    hoursPerDay: 3,
    background: '',
    examType: 'competitive_exam' as ExamType,
  })

  const [manual, setManual] = useState({
    title: '',
    goal: '',
    description: '',
    totalDays: 30,
    roadmapType: 'SHORT_TERM' as 'SHORT_TERM' | 'LONG_TERM',
    color: 'violet',
  })

  async function letAIDecide() {
    if (!smartGoal.trim()) return
    setSmartLoading(true)
    setError('')
    try {
      const res = await fetch('/api/nlu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: smartGoal }),
      })
      const parsed = await res.json()
      const inferredType: GoalType = parsed.days && parsed.days > 90 ? 'long_term' : 'short_term'
      setGoalType(inferredType)
      setStep(2)
      if (inferredType === 'short_term') {
        setShortTerm((prev) => ({
          ...prev,
          goal: parsed.goal || smartGoal,
          background: parsed.background || '',
          duration: Math.min(Math.max(Number(parsed.days) || 30, 7), 90),
          hoursPerDay: Math.min(Math.max(Number(parsed.hoursPerDay) || 3, 1), 8),
          focusType: 'mixed',
        }))
      } else {
        setLongTerm((prev) => ({
          ...prev,
          goal: parsed.goal || smartGoal,
          background: parsed.background || '',
          duration: Math.max(Number(parsed.days) || 180, 91),
        }))
      }
    } catch {
      setError('AI could not understand the goal. You can still choose manually.')
    }
    setSmartLoading(false)
  }

  async function generateRoadmap() {
    setLoading(true)
    setError('')
    try {
      const body = goalType === 'short_term'
        ? {
            type: 'short_term',
            goal: shortTerm.goal,
            currentLevel: shortTerm.currentLevel,
            duration: shortTerm.duration,
            hoursPerDay: shortTerm.hoursPerDay,
            background: shortTerm.background,
            focusType: shortTerm.focusType,
          }
        : {
            type: 'long_term',
            goal: longTerm.goal,
            currentLevel: longTerm.currentLevel,
            duration: longTerm.duration,
            hoursPerDay: longTerm.hoursPerDay,
            background: longTerm.background,
            examType: longTerm.examType,
            targetDate: longTerm.targetDate || undefined,
          }

      const res = await fetch('/api/roadmaps/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate roadmap')
      router.push(`/roadmap/${data.id}`)
    } catch (e: any) {
      setError(e.message || 'Failed to generate roadmap')
      setLoading(false)
    }
  }

  async function saveManualRoadmap() {
    if (!manual.title.trim() || !manual.goal.trim()) {
      setError('Title and Goal are required for manual roadmaps')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/roadmaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manual),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create manual roadmap')
      router.push(`/roadmap/${data.id}`)
    } catch (e: any) {
      setError(e.message || 'Failed to create manual roadmap')
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '36px 40px', maxWidth: '860px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>Universal Roadmap Builder</h1>
      <p style={{ fontSize: '14px', color: 'var(--text3)', marginBottom: '28px' }}>
        Create custom learning pathways manually, or use the AI generator to instantly construct day-by-day prep checklists.
      </p>

      {error && (
        <div style={{ marginBottom: '16px', padding: '12px 14px', background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', fontSize: '13px', color: 'var(--red)' }}>
          {error}
        </div>
      )}

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '22px' }}>
            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '14px' }}>Choose your creation path</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '12px', marginBottom: '18px' }}>
              <button onClick={() => { setGoalType('short_term'); setStep(2) }} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px', textAlign: 'left', cursor: 'pointer' }}>
                <CalendarDays size={18} style={{ marginBottom: '10px', color: '#7c3aed' }} />
                <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>Short Term AI</div>
                <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Under 90 days. AI-crafted study plan for quick revisions, skill learning, or focused preps.</div>
              </button>
              <button onClick={() => { setGoalType('long_term'); setStep(2) }} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px', textAlign: 'left', cursor: 'pointer' }}>
                <GraduationCap size={18} style={{ marginBottom: '10px', color: '#3b82f6' }} />
                <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>Long Term AI</div>
                <div style={{ fontSize: '12px', color: 'var(--text3)' }}>90+ days. Structured AI syllabus for major exams, college degrees, or career pathways.</div>
              </button>
              <button onClick={() => { setGoalType('manual'); setStep(2) }} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px', textAlign: 'left', cursor: 'pointer' }}>
                <PenLine size={18} style={{ marginBottom: '10px', color: '#10b981' }} />
                <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>Manual Roadmap</div>
                <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Total control. Create your own stages, projects, and schedule from scratch.</div>
              </button>
            </div>

            <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '10px' }}>Or just type your goal and AI will decide</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                className="input"
                style={{ flex: 1 }}
                placeholder="I want to learn Python in 30 days, or crack UPSC in 2 years..."
                value={smartGoal}
                onChange={(e) => setSmartGoal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && letAIDecide()}
              />
              <button className="btn btn-primary" onClick={letAIDecide} disabled={smartLoading || !smartGoal.trim()}>
                {smartLoading ? <Loader2 size={14} className="animate-spin" /> : <Brain size={14} />}
                {smartLoading ? 'Understanding...' : 'AI understands'}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && goalType === 'short_term' && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: 'var(--text3)' }}>← Back</button>
          <div style={{ fontSize: '18px', fontWeight: '600' }}>Short-Term Roadmap</div>
          <input className="input" placeholder="Goal: Learn React / CAT quant practice / Python basics" value={shortTerm.goal} onChange={(e) => setShortTerm({ ...shortTerm, goal: e.target.value })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <select className="input" value={shortTerm.currentLevel} onChange={(e) => setShortTerm({ ...shortTerm, currentLevel: e.target.value as CurrentLevel })}>
              {levelOptions.map((level) => <option key={level} value={level}>{level}</option>)}
            </select>
            <input className="input" type="number" min={1} max={8} value={shortTerm.hoursPerDay} onChange={(e) => setShortTerm({ ...shortTerm, hoursPerDay: Number(e.target.value) })} placeholder="Hours per day" />
          </div>
          <div>
            <label className="label">Days: {shortTerm.duration}</label>
            <input type="range" min={7} max={90} value={shortTerm.duration} onChange={(e) => setShortTerm({ ...shortTerm, duration: Number(e.target.value) })} style={{ width: '100%' }} />
          </div>
          <select className="input" value={shortTerm.focusType} onChange={(e) => setShortTerm({ ...shortTerm, focusType: e.target.value as FocusType })}>
            {focusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <textarea className="input" style={{ minHeight: '100px' }} placeholder="Background: what you already know, weak areas, constraints, school/class, etc." value={shortTerm.background} onChange={(e) => setShortTerm({ ...shortTerm, background: e.target.value })} />
          <button className="btn btn-primary btn-lg" onClick={generateRoadmap} disabled={loading || !shortTerm.goal.trim()} style={{ justifyContent: 'center' }}>
            {loading ? <><Loader2 size={15} className="animate-spin" /> Generating...</> : <><Sparkles size={15} /> Generate Short-Term Roadmap</>}
          </button>
        </div>
      )}

      {step === 2 && goalType === 'long_term' && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: 'var(--text3)' }}>← Back</button>
          <div style={{ fontSize: '18px', fontWeight: '600' }}>Long-Term Roadmap</div>
          <input className="input" placeholder="Goal: UPSC Civil Services / MBBS prep / PhD Computer Science / CA Final" value={longTerm.goal} onChange={(e) => setLongTerm({ ...longTerm, goal: e.target.value })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <input className="input" placeholder="Target date (optional): 2027-12-01" value={longTerm.targetDate} onChange={(e) => setLongTerm({ ...longTerm, targetDate: e.target.value })} />
            <input className="input" type="number" min={91} max={1825} value={longTerm.duration} onChange={(e) => setLongTerm({ ...longTerm, duration: Number(e.target.value) })} placeholder="Duration in days" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <select className="input" value={longTerm.currentLevel} onChange={(e) => setLongTerm({ ...longTerm, currentLevel: e.target.value as CurrentLevel })}>
              {levelOptions.map((level) => <option key={level} value={level}>{level}</option>)}
            </select>
            <input className="input" type="number" min={1} max={8} value={longTerm.hoursPerDay} onChange={(e) => setLongTerm({ ...longTerm, hoursPerDay: Number(e.target.value) })} placeholder="Hours per day" />
          </div>
          <select className="input" value={longTerm.examType} onChange={(e) => setLongTerm({ ...longTerm, examType: e.target.value as ExamType })}>
            {examTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <textarea className="input" style={{ minHeight: '100px' }} placeholder="Background: current preparation level, degree/class, completed topics, weak areas, etc." value={longTerm.background} onChange={(e) => setLongTerm({ ...longTerm, background: e.target.value })} />
          <button className="btn btn-primary btn-lg" onClick={generateRoadmap} disabled={loading || !longTerm.goal.trim()} style={{ justifyContent: 'center' }}>
            {loading ? <><Loader2 size={15} className="animate-spin" /> Generating...</> : <><Sparkles size={15} /> Generate Long-Term Roadmap</>}
          </button>
        </div>
      )}

      {step === 2 && goalType === 'manual' && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: 'var(--text3)' }}>← Back</button>
          <div style={{ fontSize: '18px', fontWeight: '600' }}>Create Manual Roadmap</div>
          
          <div>
            <label className="label">Roadmap Title</label>
            <input className="input" placeholder="e.g., Complete Angular & NestJS Fullstack Prep" value={manual.title} onChange={(e) => setManual({ ...manual, title: e.target.value })} />
          </div>

          <div>
            <label className="label">Primary Learning Goal</label>
            <input className="input" placeholder="e.g., Build 3 web apps and learn dependency injection" value={manual.goal} onChange={(e) => setManual({ ...manual, goal: e.target.value })} />
          </div>

          <div>
            <label className="label">Short Description / Subtitle</label>
            <textarea className="input" style={{ minHeight: '80px' }} placeholder="Write a short summary of this learning track..." value={manual.description} onChange={(e) => setManual({ ...manual, description: e.target.value })} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="label">Total Duration (Days)</label>
              <input className="input" type="number" min={7} max={365} value={manual.totalDays} onChange={(e) => setManual({ ...manual, totalDays: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">Roadmap Type</label>
              <select className="input" value={manual.roadmapType} onChange={(e) => setManual({ ...manual, roadmapType: e.target.value as any })}>
                <option value="SHORT_TERM">Short-Term (under 90 days)</option>
                <option value="LONG_TERM">Long-Term (90+ days)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Theme Color</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setManual({ ...manual, color: color.value })}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    background: manual.color === color.value ? color.hex : 'var(--bg3)',
                    color: manual.color === color.value ? '#fff' : 'var(--text3)',
                    border: manual.color === color.value ? `1px solid ${color.hex}` : '1px solid var(--border)',
                    transition: 'all 0.15s',
                  }}
                >
                  {color.label}
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn-primary btn-lg" onClick={saveManualRoadmap} disabled={loading || !manual.title.trim() || !manual.goal.trim()} style={{ justifyContent: 'center', marginTop: '10px' }}>
            {loading ? <><Loader2 size={15} className="animate-spin" /> Creating...</> : <><PenLine size={15} /> Create Roadmap</>}
          </button>
        </div>
      )}

      <div style={{ marginTop: '24px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '18px' }}>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Examples</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', color: 'var(--text3)' }}>
          <div>Learn guitar basics in 60 days</div>
          <div>Crack UPSC in 2 years</div>
          <div>Prepare for class 10 maths finals</div>
          <div>Build Python skills for data science</div>
          <div>MBBS preparation roadmap</div>
          <div>PhD computer science research plan</div>
        </div>
      </div>
    </div>
  )
}
