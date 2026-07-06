'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Brain, CalendarDays, ChevronRight, GraduationCap, Loader2, PenLine, Sparkles } from 'lucide-react'

type GoalType = 'short_term' | 'long_term'
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

  return (
    <div style={{ padding: '36px 40px', maxWidth: '860px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>Universal AI Roadmap Builder</h1>
      <p style={{ fontSize: '14px', color: 'var(--text3)', marginBottom: '28px' }}>
        Build study plans for coding, school subjects, competitive exams, degrees, careers, languages, research, and more.
      </p>

      {error && (
        <div style={{ marginBottom: '16px', padding: '12px 14px', background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', fontSize: '13px', color: 'var(--red)' }}>
          {error}
        </div>
      )}

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '22px' }}>
            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '14px' }}>What is your goal?</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
              <button onClick={() => { setGoalType('short_term'); setStep(2) }} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px', textAlign: 'left', cursor: 'pointer' }}>
                <CalendarDays size={18} style={{ marginBottom: '10px' }} />
                <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>Short Term</div>
                <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Under 90 days. Best for learning a skill, quick revision, focused prep, or short projects.</div>
              </button>
              <button onClick={() => { setGoalType('long_term'); setStep(2) }} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px', textAlign: 'left', cursor: 'pointer' }}>
                <GraduationCap size={18} style={{ marginBottom: '10px' }} />
                <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>Long Term</div>
                <div style={{ fontSize: '12px', color: 'var(--text3)' }}>90+ days. Best for exams, degrees, research, major career transitions, and structured preparation.</div>
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
