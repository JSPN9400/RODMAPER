'use client'
import { useEffect, useState } from 'react'
import { Bell, BellOff, Plus, Trash2, Clock, Check } from 'lucide-react'

const DAYS_LABEL = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function RemindersPage() {
  const [roadmaps, setRoadmaps] = useState<any[]>([])
  const [reminders, setReminders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [notif, setNotif] = useState<'default'|'granted'|'denied'>('default')
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ roadmapId:'', time:'09:00', message:'', days:[1,2,3,4,5,6,7] })

  useEffect(() => {
    if ('Notification' in window) setNotif(Notification.permission as any)
    fetch('/api/roadmaps').then(r => r.json()).then(d => {
      const arr = Array.isArray(d) ? d : []
      const active = arr.filter((r: any) => r.status === 'ACTIVE')
      setRoadmaps(active)
      if (active.length > 0) setForm(f => ({ ...f, roadmapId: active[0].id }))
      const allReminders = arr.flatMap((rm: any) => (rm.reminders || []).map((r: any) => ({ ...r, roadmapTitle: rm.title })))
      setReminders(allReminders)
      setLoading(false)
    })
  }, [])

  async function requestNotif() {
    const p = await Notification.requestPermission()
    setNotif(p as any)
    if (p === 'granted') new Notification('RoadMaper', { body: 'Daily reminders are now active! ✓' })
  }

  async function addReminder() {
    if (!form.roadmapId) return
    const res = await fetch('/api/reminders', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const r = await res.json()
    setReminders(prev => [...prev, r])
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  async function toggleReminder(r: any) {
    await fetch('/api/reminders', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: r.id, enabled: !r.enabled })
    })
    setReminders(prev => prev.map(x => x.id === r.id ? { ...x, enabled: !x.enabled } : x))
  }

  async function deleteReminder(id: string) {
    await fetch(`/api/reminders?id=${id}`, { method: 'DELETE' })
    setReminders(prev => prev.filter(r => r.id !== id))
  }

  function toggleDay(d: number) {
    setForm(f => ({ ...f, days: f.days.includes(d) ? f.days.filter(x => x !== d) : [...f.days, d].sort() }))
  }

  return (
    <div style={{ padding: '36px 40px', maxWidth: '700px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.5px', margin: '0 0 4px' }}>Reminders</h1>
          <p style={{ fontSize: '13px', color: 'var(--text3)', margin: 0 }}>Daily notifications to keep you on track</p>
        </div>
        {notif !== 'granted' ? (
          <button onClick={requestNotif} className="btn btn-primary">
            <Bell size={14} /> Enable Notifications
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--green)', padding: '6px 12px', background: 'var(--green-bg)', border: '1px solid var(--green-border)', borderRadius: '8px' }}>
            <Check size={13} /> Notifications enabled
          </div>
        )}
      </div>

      {/* Add reminder */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>Add Reminder</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
            <input className="input" placeholder="e.g. Time to learn! Keep going 💪" value={form.message} onChange={e => setForm({...form, message: e.target.value})} />
          </div>
          <div>
            <label className="label">Repeat on days</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[1,2,3,4,5,6,7].map(d => (
                <button key={d} onClick={() => toggleDay(d)} style={{
                  width: '36px', height: '36px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  background: form.days.includes(d) ? 'var(--accent)' : 'var(--bg4)',
                  color: form.days.includes(d) ? '#fff' : 'var(--text3)',
                  fontSize: '11px', fontWeight: '600', transition: 'all 0.15s', fontFamily: 'var(--font)'
                }}>{DAYS_LABEL[d]}</button>
              ))}
            </div>
          </div>
          <button onClick={addReminder} disabled={!form.roadmapId} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
            {saved ? <><Check size={14} /> Added!</> : <><Plus size={14} /> Add Reminder</>}
          </button>
        </div>
      </div>

      {/* Existing reminders */}
      <div>
        <div className="section-title">Your Reminders</div>
        {loading && <div style={{ color: 'var(--text3)', fontSize: '13px' }}>Loading...</div>}
        {!loading && reminders.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px' }}>
            <BellOff size={22} style={{ color: 'var(--text4)', marginBottom: '10px' }} />
            <p style={{ fontSize: '13px', color: 'var(--text3)', margin: 0 }}>No reminders yet. Add one above.</p>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {reminders.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Clock size={13} style={{ color: 'var(--text3)' }} />
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>{r.time}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text3)' }}>· {r.roadmapTitle || 'Roadmap'}</span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[1,2,3,4,5,6,7].map(d => (
                    <span key={d} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: r.days?.includes(d) ? 'var(--accent-bg)' : 'transparent', color: r.days?.includes(d) ? 'var(--accent3)' : 'var(--text4)' }}>
                      {DAYS_LABEL[d]}
                    </span>
                  ))}
                </div>
                {r.message && <p style={{ fontSize: '11px', color: 'var(--text4)', margin: '5px 0 0' }}>"{r.message}"</p>}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => toggleReminder(r)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '32px', height: '32px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  background: r.enabled ? 'var(--green-bg)' : 'var(--bg4)',
                  color: r.enabled ? 'var(--green)' : 'var(--text4)',
                  transition: 'all 0.15s'
                }}>
                  {r.enabled ? <Bell size={14} /> : <BellOff size={14} />}
                </button>
                <button onClick={() => deleteReminder(r.id)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '32px', height: '32px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  background: 'transparent', color: 'var(--text4)', transition: 'all 0.15s'
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--red-bg)'; (e.currentTarget as HTMLElement).style.color = 'var(--red)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text4)'; }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
