'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'

export default function LoginPage() {
  const [loading, setLoading] = useState<string | null>(null)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at top, rgba(124,58,237,0.22), transparent 35%), #000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>
        <div style={{ marginBottom: '28px' }}>
          <div style={{
            width: '68px',
            height: '68px',
            borderRadius: '22px',
            background: 'var(--grad)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            fontWeight: '800',
            color: '#fff',
            margin: '0 auto 18px',
            boxShadow: '0 14px 40px rgba(124,58,237,0.35)',
          }}>R</div>
          <h1 className="grad-text" style={{ fontSize: '34px', fontWeight: '800', margin: '0 0 8px' }}>RoadMaper</h1>
          <p style={{ fontSize: '15px', color: 'var(--text2)', margin: 0 }}>
            Your universal AI study system for skills, subjects, exams, and career growth.
          </p>
        </div>

        <div className="card-feed animate-slide-up" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              className="btn-pill btn-primary-grad"
              style={{ width: '100%', justifyContent: 'center', height: '48px' }}
              disabled={!!loading}
              onClick={() => { setLoading('google'); signIn('google', { callbackUrl: '/dashboard' }) }}
            >
              {loading === 'google' ? 'Connecting...' : 'Continue with Google'}
            </button>
            <button
              className="btn-pill"
              style={{
                width: '100%',
                justifyContent: 'center',
                height: '48px',
                background: 'var(--bg4)',
                color: 'var(--text1)',
                border: '1px solid var(--border2)',
              }}
              disabled={!!loading}
              onClick={() => { setLoading('github'); signIn('github', { callbackUrl: '/dashboard' }) }}
            >
              {loading === 'github' ? 'Connecting...' : 'Continue with GitHub'}
            </button>
          </div>
        </div>

        <p style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '18px' }}>
          By continuing, you agree to Terms and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
