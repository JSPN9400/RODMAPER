/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import { Save, Key, Globe, Check, ExternalLink, Bell, Clock, Target, ShieldCheck, Download, Trash2, Volume2, Play, Square, Activity, Moon, Sun, BellOff } from 'lucide-react'
import { pushSupported, subscribeToPush, unsubscribeFromPush } from '@/lib/push-client'
import { useTheme } from '@/lib/theme-client'

const TECH_STACKS_OPTIONS = ['React', 'Next.js', 'TypeScript', 'Node.js', 'Python', 'Django', 'PostgreSQL', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Algorithms']

export default function SettingsPage() {
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Core Settings States
  const [tz, setTz] = useState('Asia/Kolkata')
  const [notifications, setNotifications] = useState(true)
  const [reminderTime, setReminderTime] = useState('09:00')
  const [theme, setTheme] = useTheme()
  const [pushStatus, setPushStatus] = useState<'unknown' | 'checking' | 'on' | 'off' | 'unsupported' | 'denied'>('unknown')
  const [studyTarget, setStudyTarget] = useState('3') 
  const [academicGoal, setAcademicGoal] = useState('Career Prep')

  // Expanded Settings States
  const [studyPace, setStudyPace] = useState('balanced') // fast, balanced, relaxed
  const [learningStyle, setLearningStyle] = useState('hands-on') // text-heavy, visual, hands-on
  const [restDays, setRestDays] = useState<string[]>(['Sunday'])
  const [selectedTech, setSelectedTech] = useState<string[]>(['React', 'TypeScript', 'PostgreSQL'])

  // Focus Audio Synth States
  const [synthPlaying, setSynthPlaying] = useState(false)
  const [synthType, setSynthType] = useState('drone') // drone, brownian, binaural
  const [volume, setVolume] = useState(0.3)
  
  // Refs for Web Audio API
  const audioCtxRef = useRef<AudioContext | null>(null)
  const sourceNodesRef = useRef<any[]>([])
  const gainNodeRef = useRef<any>(null)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d?.timezone) setTz(d.timezone)
        if (d?.notificationsEnabled !== undefined) setNotifications(d.notificationsEnabled)
        // Only apply the server's saved theme if this browser has never set
        // a local preference — otherwise a stale server value could
        // override a choice the user just made on this device.
        if (d?.theme && typeof window !== 'undefined' && !localStorage.getItem('rm-theme')) {
          setTheme(d.theme === 'light' ? 'light' : 'dark')
        }
        if (d?.defaultReminderTime) setReminderTime(d.defaultReminderTime)
      })
      .finally(() => setLoading(false))

    // Load extra values from localStorage for student personalization
    if (typeof window !== 'undefined') {
      const sp = localStorage.getItem('rm_study_pace')
      const ls = localStorage.getItem('rm_learning_style')
      const rd = localStorage.getItem('rm_rest_days')
      const st = localStorage.getItem('rm_selected_tech')
      
      if (sp) setStudyPace(sp)
      if (ls) setLearningStyle(ls)
      if (rd) {
        try { setRestDays(JSON.parse(rd)) } catch (_) {}
      }
      if (st) {
        try { setSelectedTech(JSON.parse(st)) } catch (_) {}
      }
    }

    // Check current browser push subscription state (separate from the
    // notificationsEnabled DB flag — this is whether *this device* has
    // actually granted permission and subscribed).
    if (!pushSupported()) {
      setPushStatus('unsupported')
    } else if (Notification.permission === 'denied') {
      setPushStatus('denied')
    } else {
      setPushStatus('checking')
      navigator.serviceWorker.getRegistration().then(async (reg) => {
        const sub = await reg?.pushManager.getSubscription()
        setPushStatus(sub ? 'on' : 'off')
      }).catch(() => setPushStatus('off'))
    }

    return () => {
      stopSynth()
    }
  }, [setTheme])

  async function toggleBrowserPush() {
    if (pushStatus === 'on') {
      await unsubscribeFromPush()
      setPushStatus('off')
      return
    }
    setPushStatus('checking')
    const result = await subscribeToPush()
    if (result.ok) {
      setPushStatus('on')
    } else if (result.reason === 'permission-denied') {
      setPushStatus('denied')
    } else if (result.reason === 'not-supported') {
      setPushStatus('unsupported')
    } else {
      setPushStatus('off')
    }
  }

  // Web Audio Synthesizer logic for student focus
  const startSynth = () => {
    try {
      stopSynth()
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) return

      const ctx = new AudioContextClass()
      audioCtxRef.current = ctx

      const mainGain = ctx.createGain()
      mainGain.gain.setValueAtTime(volume, ctx.currentTime)
      mainGain.connect(ctx.destination)
      gainNodeRef.current = mainGain

      const nodes: any[] = []

      if (synthType === 'drone') {
        // Multi-oscillator beautiful cosmic drone chord
        const freqs = [110, 165, 220, 330] // A2, E3, A3, E4 chord
        freqs.forEach((f, idx) => {
          const osc = ctx.createOscillator()
          const oscGain = ctx.createGain()
          
          osc.type = idx % 2 === 0 ? 'sine' : 'triangle'
          osc.frequency.setValueAtTime(f, ctx.currentTime)
          
          // Add micro frequency detune LFO modulation for warm analog texture
          const lfo = ctx.createOscillator()
          const lfoGain = ctx.createGain()
          lfo.frequency.setValueAtTime(0.2 + idx * 0.1, ctx.currentTime)
          lfoGain.gain.setValueAtTime(1.5, ctx.currentTime)
          lfo.connect(lfoGain)
          lfoGain.connect(osc.frequency)
          lfo.start()
          nodes.push(lfo)

          oscGain.gain.setValueAtTime(0.08, ctx.currentTime)
          osc.connect(oscGain)
          oscGain.connect(mainGain)
          osc.start()

          nodes.push(osc, oscGain)
        })
      } else if (synthType === 'binaural') {
        // Binaural alpha waves hum for focused cognitive absorption
        const oscL = ctx.createOscillator()
        const oscR = ctx.createOscillator()
        
        const pannerL = ctx.createStereoPanner ? ctx.createStereoPanner() : null
        const pannerR = ctx.createStereoPanner ? ctx.createStereoPanner() : null

        oscL.type = 'sine'
        oscL.frequency.setValueAtTime(200, ctx.currentTime) // Left ear 200 Hz

        oscR.type = 'sine'
        oscR.frequency.setValueAtTime(210, ctx.currentTime) // Right ear 210 Hz (10 Hz Alpha beat)

        if (pannerL && pannerR) {
          pannerL.pan.value = -1
          pannerR.pan.value = 1
          oscL.connect(pannerL).connect(mainGain)
          oscR.connect(pannerR).connect(mainGain)
          nodes.push(pannerL, pannerR)
        } else {
          oscL.connect(mainGain)
          oscR.connect(mainGain)
        }

        oscL.start()
        oscR.start()
        nodes.push(oscL, oscR)
      } else if (synthType === 'brownian') {
        // Calming Brownian/Pink noise generator (custom filter math)
        const bufferSize = 2 * ctx.sampleRate
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
        const output = noiseBuffer.getChannelData(0)
        
        let lastOut = 0.0
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1
          // Brownian noise filter approximation
          output[i] = (lastOut + (0.02 * white)) / 1.002
          lastOut = output[i]
          output[i] *= 3.5 // Volume correction
        }

        const noise = ctx.createBufferSource()
        noise.buffer = noiseBuffer
        noise.loop = true
        
        // Pass filter for extremely smooth velvet brownian noise
        const lowpass = ctx.createBiquadFilter()
        lowpass.type = 'lowpass'
        lowpass.frequency.setValueAtTime(400, ctx.currentTime)

        noise.connect(lowpass).connect(mainGain)
        noise.start()
        nodes.push(noise, lowpass)
      }

      sourceNodesRef.current = nodes
      setSynthPlaying(true)
    } catch (e) {
      console.error(e)
    }
  }

  const stopSynth = () => {
    try {
      sourceNodesRef.current.forEach(node => {
        try { node.stop() } catch (_) {}
        try { node.disconnect() } catch (_) {}
      })
      sourceNodesRef.current = []
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect()
        gainNodeRef.current = null
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close()
        audioCtxRef.current = null
      }
    } catch (_) {}
    setSynthPlaying(false)
  }

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol)
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(newVol, audioCtxRef.current.currentTime)
    }
  }

  const toggleSynth = () => {
    if (synthPlaying) {
      stopSynth()
    } else {
      startSynth()
    }
  }

  // Update specific selected type
  const handleSynthTypeChange = (type: string) => {
    setSynthType(type)
    if (synthPlaying) {
      setTimeout(() => startSynth(), 50)
    }
  }

  // Save changes
  async function save() {
    setSaving(true)
    try {
      // Save backend settings
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timezone: tz,
          notificationsEnabled: notifications,
          defaultReminderTime: reminderTime,
        }),
      })

      // Save client settings to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('rm_study_pace', studyPace)
        localStorage.setItem('rm_learning_style', learningStyle)
        localStorage.setItem('rm_rest_days', JSON.stringify(restDays))
        localStorage.setItem('rm_selected_tech', JSON.stringify(selectedTech))
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  // Clear or reset account roadmaps
  const handleClearRoadmaps = async () => {
    if (!confirm('CRITICAL WARNING: This will permanently delete all your learning roadmaps and progress reports from your database. This action is irreversible. Proceed?')) return
    
    try {
      const res = await fetch('/api/roadmaps')
      const data = await res.json()
      if (Array.isArray(data)) {
        for (const rm of data) {
          await fetch(`/api/roadmaps/${rm.id}`, { method: 'DELETE' })
        }
      }
      alert('Database successfully reset. All roadmaps deleted.')
    } catch (e) {
      alert('Could not clear database. Try again.')
    }
  }

  // Export roadmaps as JSON format
  const handleExportData = async () => {
    try {
      const res = await fetch('/api/roadmaps')
      const data = await res.json()
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `roadmaper-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (_) {
      alert('Could not export roadmaps JSON file.')
    }
  }

  const toggleRestDay = (day: string) => {
    if (restDays.includes(day)) {
      setRestDays(restDays.filter(d => d !== day))
    } else {
      setRestDays([...restDays, day])
    }
  }

  const toggleTechStack = (tech: string) => {
    if (selectedTech.includes(tech)) {
      setSelectedTech(selectedTech.filter(t => t !== tech))
    } else {
      setSelectedTech([...selectedTech, tech])
    }
  }

  return (
    <div style={{ padding: '20px 16px 80px', maxWidth: '640px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '6px' }}>Settings</h1>
      <p style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '24px' }}>
        Customize your study plans, notification schedules, and regional settings.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Appearance */}
        <div className="card-feed" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            {theme === 'light' ? <Sun size={15} style={{ color: 'var(--accent3)' }} /> : <Moon size={15} style={{ color: 'var(--accent3)' }} />}
            <span style={{ fontSize: '13px', fontWeight: '700' }}>Appearance</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setTheme('dark')}
              style={{
                flex: 1, padding: '14px', borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
                background: theme === 'dark' ? 'var(--accent-bg)' : 'var(--bg3)',
                border: `1px solid ${theme === 'dark' ? 'var(--accent-border)' : 'var(--border2)'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Moon size={14} />
                <span style={{ fontSize: '13px', fontWeight: '600' }}>Dark</span>
                {theme === 'dark' && <Check size={12} style={{ color: 'var(--accent3)', marginLeft: 'auto' }} />}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Ink & brass — easier at night</div>
            </button>
            <button
              onClick={() => setTheme('light')}
              style={{
                flex: 1, padding: '14px', borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
                background: theme === 'light' ? 'var(--accent-bg)' : 'var(--bg3)',
                border: `1px solid ${theme === 'light' ? 'var(--accent-border)' : 'var(--border2)'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Sun size={14} />
                <span style={{ fontSize: '13px', fontWeight: '600' }}>Light</span>
                {theme === 'light' && <Check size={12} style={{ color: 'var(--accent3)', marginLeft: 'auto' }} />}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Parchment & ink — daylight reading</div>
            </button>
          </div>
        </div>

        {/* Student Learning Profile */}
        <div className="card-feed" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Target size={15} style={{ color: 'var(--accent3)' }} />
            <span style={{ fontSize: '13px', fontWeight: '700' }}>Student Learning Profile</span>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label className="label" style={{ fontSize: '11px', marginBottom: '6px' }}>Daily Study Target</label>
              <select className="input" value={studyTarget} onChange={e => setStudyTarget(e.target.value)}>
                <option value="1">1 hour per day (Casual)</option>
                <option value="2">2 hours per day (Steady)</option>
                <option value="3">3 hours per day (Recommended)</option>
                <option value="5">5 hours per day (Intense)</option>
                <option value="8">8 hours per day (Competitive Prep)</option>
              </select>
            </div>
            <div>
              <label className="label" style={{ fontSize: '11px', marginBottom: '6px' }}>Primary Education Goal</label>
              <select className="input" value={academicGoal} onChange={e => setAcademicGoal(e.target.value)}>
                <option value="Career Prep">Software Career Prep</option>
                <option value="Competitive Exam">Competitive Exams (UPSC, GATE, CAT)</option>
                <option value="Academic Degree">College degree / Academic syllabus</option>
                <option value="Skills Upskill">Upskilling & Tech Stack transition</option>
              </select>
            </div>
          </div>
        </div>

        {/* Learning Style & Speed Preferences */}
        <div className="card-feed" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Activity size={15} style={{ color: 'var(--accent3)' }} />
            <span style={{ fontSize: '13px', fontWeight: '700' }}>Study Style & Speed Preferences</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label className="label" style={{ fontSize: '11px', marginBottom: '6px' }}>Pace Calendar Speed</label>
              <select className="input" value={studyPace} onChange={e => setStudyPace(e.target.value)}>
                <option value="relaxed">Relaxed / Part-Time (Spread details out)</option>
                <option value="balanced">Balanced Standard (Recommended pace)</option>
                <option value="fast">Fast-Track Bootcamp (High intensity daily)</option>
              </select>
            </div>
            <div>
              <label className="label" style={{ fontSize: '11px', marginBottom: '6px' }}>Curriculum Material Style</label>
              <select className="input" value={learningStyle} onChange={e => setLearningStyle(e.target.value)}>
                <option value="hands-on">Hands-on & Projects (Code builders)</option>
                <option value="visual">Visual & Interactive (Graphs/Videos)</option>
                <option value="text-heavy">Analytical & Academic (RFCs/Documentation)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ambient focus music player */}
        <div className="card-feed" style={{ padding: '20px', border: synthPlaying ? '1px solid rgba(200,138,61,0.4)' : '1px solid rgba(244,238,226,0.06)', transition: 'border 0.3s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Moon size={15} style={{ color: synthPlaying ? '#E8C084' : 'var(--text4)' }} />
              <span style={{ fontSize: '13px', fontWeight: '700' }}>Ambient Focus Sound Synth</span>
            </div>
            {synthPlaying && <span style={{ fontSize: '10px', color: '#4C8C89', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}><span className="w-2 h-2 rounded-full bg-green-500 animate-ping" /> SYNTHESIZER ACTIVE</span>}
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '14px', lineHeight: '1.5' }}>
            Generate calm, loopable synthesized backgrounds using pure Web Audio oscillators to suppress environmental noise. Perfect for long study sessions.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '14px' }}>
            {[
              { id: 'drone', label: 'Cosmic Drone', desc: 'Analog rich harmony' },
              { id: 'binaural', label: 'Binaural Alpha', desc: '10Hz Brainwave pulse' },
              { id: 'brownian', label: 'Brown Noise', desc: 'Smooth velvet hum' },
            ].map((sound) => (
              <button
                key={sound.id}
                onClick={() => handleSynthTypeChange(sound.id)}
                style={{
                  background: synthType === sound.id ? 'rgba(200,138,61,0.1)' : 'var(--bg3)',
                  border: `1px solid ${synthType === sound.id ? '#C88A3D' : 'transparent'}`,
                  borderRadius: '8px',
                  padding: '10px 8px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: '700', color: synthType === sound.id ? '#fff' : 'var(--text2)' }}>{sound.label}</div>
                <div style={{ fontSize: '9px', color: 'var(--text3)', marginTop: '2px' }}>{sound.desc}</div>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              onClick={toggleSynth}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: synthPlaying ? '#BB6453' : '#C88A3D',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '700'
              }}
            >
              {synthPlaying ? <><Square size={12} /> Stop Sound</> : <><Play size={12} /> Start Focus Sound</>}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '160px' }}>
              <Volume2 size={13} style={{ color: 'var(--text4)' }} />
              <input
                type="range"
                min="0"
                max="0.8"
                step="0.05"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: '#C88A3D', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text3)', width: '25px', textAlign: 'right' }}>{Math.round(volume * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Weekly Study Rest Days */}
        <div className="card-feed" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Clock size={15} style={{ color: 'var(--accent3)' }} />
            <span style={{ fontSize: '13px', fontWeight: '700' }}>Weekly Rest Days (Rest & Review)</span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '12px' }}>
            Choose days of the week to take a break. Our roadmap engine avoids placing intense milestones on rest days.
          </p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
              const isSelected = restDays.includes(day)
              return (
                <button
                  key={day}
                  onClick={() => toggleRestDay(day)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(200,138,61,0.1)' : 'var(--bg3)',
                    border: `1px solid ${isSelected ? '#C88A3D' : 'var(--border)'}`,
                    color: isSelected ? '#fff' : 'var(--text3)',
                    transition: 'all 0.1s'
                  }}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>

        {/* Technology Interests */}
        <div className="card-feed" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Target size={15} style={{ color: 'var(--accent3)' }} />
            <span style={{ fontSize: '13px', fontWeight: '700' }}>Your Technology / Subject Focuses</span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '12px' }}>
            Select topics of interest to refine recommended modules in manual roadmaps.
          </p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {TECH_STACKS_OPTIONS.map(tech => {
              const isSelected = selectedTech.includes(tech)
              return (
                <button
                  key={tech}
                  onClick={() => toggleTechStack(tech)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(76,140,137,0.1)' : 'var(--bg3)',
                    border: `1px solid ${isSelected ? '#4C8C89' : 'var(--border)'}`,
                    color: isSelected ? '#fff' : 'var(--text3)',
                    transition: 'all 0.1s'
                  }}
                >
                  {isSelected ? `✓ ${tech}` : `+ ${tech}`}
                </button>
              )
            })}
          </div>
        </div>

        {/* Notifications and Study Reminders */}
        <div className="card-feed" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Bell size={15} style={{ color: 'var(--accent3)' }} />
            <span style={{ fontSize: '13px', fontWeight: '700' }}>Study Reminders</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <input 
              type="checkbox" 
              id="notifications"
              checked={notifications} 
              onChange={e => setNotifications(e.target.checked)} 
              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#C88A3D' }}
            />
            <label htmlFor="notifications" style={{ fontSize: '13px', color: '#fff', cursor: 'pointer' }}>
              Enable daily email and push notifications
            </label>
          </div>

          {notifications && (
            <div style={{ marginTop: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Clock size={13} style={{ color: 'var(--text3)' }} />
                <label className="label" style={{ fontSize: '11px', margin: 0 }}>Notification Time</label>
              </div>
              <input 
                type="time" 
                className="input" 
                value={reminderTime} 
                onChange={e => setReminderTime(e.target.value)} 
                style={{ maxWidth: '140px' }}
              />

              <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '8px' }}>
                  This toggle just saves your preferred time. To actually receive a push on <em>this device</em>, you also need to allow browser notifications:
                </div>
                {pushStatus === 'on' && (
                  <button onClick={toggleBrowserPush} className="btn btn-ghost btn-sm">
                    <BellOff size={12} /> Turn off push on this device
                  </button>
                )}
                {pushStatus === 'off' && (
                  <button onClick={toggleBrowserPush} className="btn btn-primary btn-sm">
                    <Bell size={12} /> Enable push on this device
                  </button>
                )}
                {pushStatus === 'checking' && (
                  <span style={{ fontSize: '12px', color: 'var(--text3)' }}>Checking...</span>
                )}
                {pushStatus === 'denied' && (
                  <span style={{ fontSize: '12px', color: 'var(--red)' }}>Notifications are blocked for this site in your browser settings — allow them there, then reload this page.</span>
                )}
                {pushStatus === 'unsupported' && (
                  <span style={{ fontSize: '12px', color: 'var(--text3)' }}>Push notifications aren&apos;t supported in this browser.</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Timezone */}
        <div className="card-feed" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Globe size={15} style={{ color: 'var(--accent3)' }} />
            <span style={{ fontSize: '13px', fontWeight: '700' }}>Timezone</span>
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

        {/* Data Portability & Resets */}
        <div className="card-feed" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <ShieldCheck size={15} style={{ color: 'var(--accent3)' }} />
            <span style={{ fontSize: '13px', fontWeight: '700' }}>Data Management & Reset Options</span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '14px' }}>
            Take control of your data. Backup your progress or clear everything to start fresh.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleExportData}
              className="btn btn-ghost"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
            >
              <Download size={13} /> Export all to JSON
            </button>
            <button
              onClick={handleClearRoadmaps}
              className="btn btn-danger"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
            >
              <Trash2 size={13} /> Reset All Roadmaps
            </button>
          </div>
        </div>

        {/* API Keys */}
        <div className="card-feed" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Key size={15} style={{ color: 'var(--accent3)' }} />
            <span style={{ fontSize: '13px', fontWeight: '700' }}>API Keys</span>
          </div>
          <div style={{ background: 'var(--bg3)', borderRadius: '8px', padding: '14px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--text3)', lineHeight: '1.8' }}>
            Set in <span style={{ color: 'var(--accent3)' }}>.env.local</span>:<br /><br />
            <span style={{ color: 'var(--green)' }}>GROQ_API_KEY</span>=gsk_...<br />
            <span style={{ color: 'var(--green)' }}>DATABASE_URL</span>=postgresql://...<br />
            <span style={{ color: 'var(--green)' }}>NEXTAUTH_SECRET</span>=random-string
          </div>
          <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ marginTop: '10px', textDecoration: 'none', display: 'inline-flex' }}>
            <ExternalLink size={12} /> Get free Groq API key
          </a>
        </div>

        <button onClick={save} disabled={saving || loading} className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '4px' }}>
          {saved ? <><Check size={14} /> Saved!</> : <><Save size={14} /> {saving ? 'Saving...' : 'Save Settings'}</>}
        </button>
      </div>
    </div>
  )
}
