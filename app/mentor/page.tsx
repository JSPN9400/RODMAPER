/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

'use client'
import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Send, Trash2, Sparkles } from 'lucide-react'
import { ListSkeleton, EmptyState } from '@/components/ui/PageState'

type Msg = { id: string; role: 'user' | 'assistant'; content: string; createdAt?: string }

const STARTERS = [
  'How am I doing overall?',
  "I missed a task — I've been stuck.",
  "What should I focus on today?",
  'Help me plan my next few days.',
]

export default function MentorPage() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/mentor')
      .then((r) => r.json())
      .then((d) => setMessages(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  async function send(text?: string) {
    const content = (text ?? input).trim()
    if (!content || sending) return
    setError('')
    setInput('')
    const optimistic: Msg = { id: `local-${Date.now()}`, role: 'user', content }
    setMessages((prev) => [...prev, optimistic])
    setSending(true)
    try {
      const res = await fetch('/api/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setMessages((prev) => [...prev, { id: `reply-${Date.now()}`, role: 'assistant', content: data.reply }])
    } catch (e: any) {
      setError(e.message || 'The mentor is unavailable right now')
    } finally {
      setSending(false)
    }
  }

  async function clearChat() {
    if (!confirm('Clear this entire conversation? The mentor will lose memory of it.')) return
    await fetch('/api/mentor', { method: 'DELETE' })
    setMessages([])
  }

  return (
    <div style={{ padding: '20px 16px 0', maxWidth: '680px', margin: '0 auto', height: 'calc(100vh - 20px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageCircle size={16} style={{ color: 'var(--accent3)' }} />
          </div>
          <div>
            <div className="font-display" style={{ fontSize: '17px', fontWeight: '600' }}>AI Mentor</div>
            <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Remembers this conversation</div>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="btn btn-ghost btn-sm"><Trash2 size={12} /> Clear</button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '12px' }}>
        {loading && <ListSkeleton rows={3} />}

        {!loading && messages.length === 0 && (
          <EmptyState
            icon={Sparkles}
            tone="accent"
            title="Talk to your mentor"
            desc="Ask how you're doing, what to focus on, or why something's been hard to keep up with — it knows your active roadmaps and remembers this conversation."
            action={
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'stretch', maxWidth: '320px', margin: '0 auto' }}>
                {STARTERS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="btn btn-ghost btn-sm" style={{ justifyContent: 'flex-start' }}>{s}</button>
                ))}
              </div>
            }
          />
        )}

        {messages.map((m) => (
          <div key={m.id} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '82%', padding: '10px 14px', borderRadius: m.role === 'user' ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
              background: m.role === 'user' ? 'var(--grad)' : 'var(--bg2)',
              border: m.role === 'user' ? 'none' : '1px solid var(--border)',
              color: m.role === 'user' ? '#1A1410' : 'var(--text1)',
              fontSize: '13.5px', lineHeight: '1.55', whiteSpace: 'pre-wrap',
            }}>
              {m.content}
            </div>
          </div>
        ))}

        {sending && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '10px 14px', borderRadius: '14px 14px 14px 3px', background: 'var(--bg2)', border: '1px solid var(--border)', display: 'flex', gap: '4px' }}>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text3)', animation: `pulse-dot 1.2s ease-in-out ${i * 0.15}s infinite` }} />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{ alignSelf: 'center', fontSize: '12px', color: 'var(--red)', background: 'var(--red-bg)', padding: '8px 14px', borderRadius: '10px' }}>{error}</div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: 'flex', gap: '8px', padding: '12px 0 16px', flexShrink: 0, borderTop: '1px solid var(--border)' }}>
        <input
          className="input"
          placeholder="Ask your mentor anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          disabled={sending}
        />
        <button onClick={() => send()} disabled={sending || !input.trim()} className="btn btn-primary btn-icon" style={{ width: '42px', height: '42px' }}>
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
