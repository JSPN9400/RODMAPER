/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

'use client'
import { useEffect, useState } from 'react'
import { Save, Key, Globe, Check, ExternalLink } from 'lucide-react'

export default function SettingsPage() {
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tz, setTz] = useState('Asia/Kolkata')

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => { if (d?.timezone) setTz(d.timezone) })
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timezone: tz }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding:'20px 16px 80px', maxWidth:'600px', margin:'0 auto' }}>
      <h1 style={{ fontSize:'22px', fontWeight:'800', marginBottom:'6px' }}>Settings</h1>
      <p style={{ fontSize:'13px', color:'var(--text3)', marginBottom:'24px' }}>Configure your preferences</p>

      <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
        <div className="card-feed" style={{ padding:'20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
            <Globe size={15} style={{ color:'var(--accent3)' }} />
            <span style={{ fontSize:'13px', fontWeight:'700' }}>Timezone</span>
          </div>
          <select className="input" value={tz} onChange={e => setTz(e.target.value)} disabled={loading}>
            <option value="Asia/Kolkata">India (IST) +5:30</option>
            <option value="UTC">UTC +0:00</option>
            <option value="America/New_York">US Eastern</option>
            <option value="America/Los_Angeles">US Pacific</option>
            <option value="Europe/London">London</option>
            <option value="Asia/Dubai">Dubai +4:00</option>
            <option value="Asia/Singapore">Singapore +8:00</option>
          </select>
        </div>

        <div className="card-feed" style={{ padding:'20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
            <Key size={15} style={{ color:'var(--accent3)' }} />
            <span style={{ fontSize:'13px', fontWeight:'700' }}>API Keys</span>
          </div>
          <div style={{ background:'var(--bg3)', borderRadius:'8px', padding:'14px', fontFamily:'monospace', fontSize:'12px', color:'var(--text3)', lineHeight:'1.8' }}>
            Set in <span style={{ color:'var(--accent3)' }}>.env.local</span>:<br/><br/>
            <span style={{ color:'var(--green)' }}>GROQ_API_KEY</span>=gsk_...<br/>
            <span style={{ color:'var(--green)' }}>DATABASE_URL</span>=postgresql://...<br/>
            <span style={{ color:'var(--green)' }}>NEXTAUTH_SECRET</span>=random-string
          </div>
          <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ marginTop:'10px', textDecoration:'none', display:'inline-flex' }}>
            <ExternalLink size={12}/> Get free Groq API key
          </a>
        </div>

        <button onClick={save} disabled={saving || loading} className="btn btn-primary" style={{ alignSelf:'flex-start' }}>
          {saved ? <><Check size={14}/> Saved!</> : <><Save size={14}/> {saving ? 'Saving...' : 'Save Settings'}</>}
        </button>
      </div>
    </div>
  )
}
