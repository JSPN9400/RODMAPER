'use client'
import { useState } from 'react'
import { Save, Key, Bell, Globe, Check, ExternalLink } from 'lucide-react'

export default function SettingsPage() {
  const [saved, setSaved] = useState(false)
  const [settings, setSettings] = useState({ defaultReminderTime: '09:00', timezone: 'Asia/Kolkata', notificationsEnabled: true })

  function save() { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <div style={{ padding: '36px 40px', maxWidth: '600px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.5px', margin: '0 0 4px' }}>Settings</h1>
      <p style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '28px' }}>Configure RoadMaper to work your way</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Notifications */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Bell size={15} style={{ color: 'var(--accent3)' }} />
            <span style={{ fontSize: '13px', fontWeight: '600' }}>Notifications</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '2px' }}>Enable notifications</div>
                <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Get daily reminders to complete your tasks</div>
              </div>
              <button onClick={() => setSettings(s => ({ ...s, notificationsEnabled: !s.notificationsEnabled }))} style={{
                width: '40px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer', position: 'relative',
                background: settings.notificationsEnabled ? 'var(--accent)' : 'var(--bg5)', transition: 'background 0.2s'
              }}>
                <span style={{
                  position: 'absolute', top: '3px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
                  transition: 'left 0.2s', left: settings.notificationsEnabled ? '21px' : '3px'
                }} />
              </button>
            </div>
            <div>
              <label className="label">Default reminder time</label>
              <input type="time" className="input" style={{ width: '160px' }} value={settings.defaultReminderTime} onChange={e => setSettings(s => ({ ...s, defaultReminderTime: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Timezone */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Globe size={15} style={{ color: 'var(--accent3)' }} />
            <span style={{ fontSize: '13px', fontWeight: '600' }}>Timezone</span>
          </div>
          <select className="input" value={settings.timezone} onChange={e => setSettings(s => ({ ...s, timezone: e.target.value }))}>
            <option value="Asia/Kolkata">India (IST) +5:30</option>
            <option value="UTC">UTC +0:00</option>
            <option value="America/New_York">US Eastern -5:00</option>
            <option value="America/Los_Angeles">US Pacific -8:00</option>
            <option value="Europe/London">London +0:00</option>
            <option value="Asia/Dubai">Dubai +4:00</option>
            <option value="Asia/Singapore">Singapore +8:00</option>
          </select>
        </div>

        {/* API Keys */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Key size={15} style={{ color: 'var(--accent3)' }} />
            <span style={{ fontSize: '13px', fontWeight: '600' }}>API Keys</span>
          </div>
          <div style={{ background: 'var(--bg3)', borderRadius: '8px', padding: '14px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--text3)', lineHeight: '1.8' }}>
            Set these in your <span style={{ color: 'var(--accent3)' }}>.env.local</span> file:<br/><br/>
            <span style={{ color: 'var(--green)' }}>GEMINI_API_KEY</span>=your-key-here<br/>
            <span style={{ color: 'var(--green)' }}>DATABASE_URL</span>=postgresql://...<br/>
            <span style={{ color: 'var(--green)' }}>NEXTAUTH_SECRET</span>=random-string<br/>
          </div>
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ marginTop: '10px', textDecoration: 'none', display: 'inline-flex' }}>
            <ExternalLink size={12} /> Get free Gemini API key
          </a>
        </div>

        <button onClick={save} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
          {saved ? <><Check size={14} /> Saved!</> : <><Save size={14} /> Save Settings</>}
        </button>
      </div>
    </div>
  )
}
