/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

'use client'
import { useEffect, useState } from 'react'
import { Bell, BellOff, Plus, Trash2, Clock, Check } from 'lucide-react'

const DAYS = ['','Mon','Tue','Wed','Thu','Fri','Sat','Sun']

export default function RemindersPage() {
  const [roadmaps, setRoadmaps] = useState<any[]>([])
  const [reminders, setReminders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ roadmapId:'', time:'09:00', message:'', days:[1,2,3,4,5,6,7] })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/roadmaps').then(r=>r.json()).then(d => {
      const arr = Array.isArray(d) ? d : []
      const active = arr.filter((r:any) => r.status === 'ACTIVE')
      setRoadmaps(active)
      if (active.length > 0) setForm(f => ({ ...f, roadmapId: active[0].id }))
      setReminders(arr.flatMap((rm:any) => (rm.reminders||[]).map((r:any) => ({ ...r, roadmapTitle: rm.title }))))
      setLoading(false)
    })
  }, [])

  async function addReminder() {
    if (!form.roadmapId) return
    const res = await fetch('/api/reminders', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
    const r = await res.json()
    const matched = roadmaps.find((rm: any) => rm.id === form.roadmapId)
    setReminders(p => [...p, { ...r, roadmapTitle: matched ? matched.title : '' }])
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  async function toggleReminder(r:any) {
    await fetch('/api/reminders', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: r.id, enabled: !r.enabled }) })
    setReminders(p => p.map(x => x.id === r.id ? { ...x, enabled: !x.enabled } : x))
  }

  async function deleteReminder(id:string) {
    await fetch(`/api/reminders?id=${id}`, { method:'DELETE' })
    setReminders(p => p.filter(r => r.id !== id))
  }

  return (
    <div style={{ padding:'20px 16px 80px', maxWidth:'700px', margin:'0 auto' }}>
      <h1 style={{ fontSize:'22px', fontWeight:'800', marginBottom:'6px' }}>Reminders</h1>
      <p style={{ fontSize:'13px', color:'var(--text3)', marginBottom:'24px' }}>Daily notifications to keep you on track</p>

      {/* Add form */}
      <div className="card-feed" style={{ padding:'20px', marginBottom:'20px' }}>
        <div style={{ fontSize:'13px', fontWeight:'700', marginBottom:'16px' }}>Add Reminder</div>
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            <div>
              <label className="label">Roadmap</label>
              <select className="input" value={form.roadmapId} onChange={e => setForm({...form, roadmapId: e.target.value})}>
                {roadmaps.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                {roadmaps.length === 0 && <option value="">No active roadmaps</option>}
              </select>
            </div>
            <div>
              <label className="label">Time</label>
              <input type="time" className="input" value={form.time} onChange={e => setForm({...form, time: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="label">Message (optional)</label>
            <input className="input" placeholder="Time to learn! 💪" value={form.message} onChange={e => setForm({...form, message: e.target.value})} />
          </div>
          <div>
            <label className="label">Repeat on</label>
            <div style={{ display:'flex', gap:'6px' }}>
              {[1,2,3,4,5,6,7].map(d => (
                <button key={d} onClick={() => setForm(f => ({ ...f, days: f.days.includes(d) ? f.days.filter(x=>x!==d) : [...f.days,d].sort() }))} style={{
                  width:'36px', height:'36px', borderRadius:'8px', border:'none', cursor:'pointer',
                  background: form.days.includes(d) ? 'var(--accent)' : 'var(--bg4)',
                  color: form.days.includes(d) ? '#fff' : 'var(--text3)',
                  fontSize:'11px', fontWeight:'600', fontFamily:'inherit', transition:'all 0.15s'
                }}>{DAYS[d]}</button>
              ))}
            </div>
          </div>
          <button onClick={addReminder} disabled={!form.roadmapId} className="btn btn-primary" style={{ alignSelf:'flex-start' }}>
            {saved ? <><Check size={14}/> Added!</> : <><Plus size={14}/> Add Reminder</>}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="section-title">Your Reminders</div>
      {loading && <div style={{ color:'var(--text3)', fontSize:'13px' }}>Loading...</div>}
      {!loading && reminders.length === 0 && (
        <div className="card-feed" style={{ padding:'32px', textAlign:'center' }}>
          <BellOff size={22} style={{ color:'var(--text4)', marginBottom:'10px' }} />
          <p style={{ fontSize:'13px', color:'var(--text3)' }}>No reminders yet.</p>
        </div>
      )}
      <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
        {reminders.map(r => (
          <div key={r.id} className="card-feed" style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:'14px' }}>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'5px' }}>
                <Clock size={13} style={{ color:'var(--text3)' }} />
                <span style={{ fontSize:'14px', fontWeight:'700' }}>{r.time}</span>
                <span style={{ fontSize:'12px', color:'var(--text3)' }}>· {r.roadmapTitle}</span>
              </div>
              <div style={{ display:'flex', gap:'4px' }}>
                {[1,2,3,4,5,6,7].map(d => (
                  <span key={d} style={{ fontSize:'10px', padding:'1px 5px', borderRadius:'3px', background: r.days?.includes(d) ? 'var(--accent-bg)' : 'transparent', color: r.days?.includes(d) ? 'var(--accent3)' : 'var(--text4)' }}>{DAYS[d]}</span>
                ))}
              </div>
              {r.message && <p style={{ fontSize:'11px', color:'var(--text4)', margin:'4px 0 0' }}>"{r.message}"</p>}
            </div>
            <div style={{ display:'flex', gap:'6px' }}>
              <button onClick={() => toggleReminder(r)} style={{ width:'32px', height:'32px', borderRadius:'8px', border:'none', cursor:'pointer', background: r.enabled ? 'var(--green-bg)' : 'var(--bg4)', color: r.enabled ? 'var(--green)' : 'var(--text4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {r.enabled ? <Bell size={14}/> : <BellOff size={14}/>}
              </button>
              <button onClick={() => deleteReminder(r.id)} style={{ width:'32px', height:'32px', borderRadius:'8px', border:'none', cursor:'pointer', background:'transparent', color:'var(--text4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Trash2 size={14}/>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
