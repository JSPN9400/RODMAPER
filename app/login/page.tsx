'use client'
import { signIn } from 'next-auth/react'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  async function demoLogin() {
    if (!email.trim()) return
    setLoading('demo')
    await signIn('credentials', { email: email.trim(), callbackUrl: '/dashboard' })
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
        width: '600px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(124,58,237,0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: '380px', position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', fontWeight: '800', color: '#fff',
            margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(124,58,237,0.35)'
          }}>R</div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text1)', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
            RoadMaper
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text3)', margin: 0 }}>
            Build your learning journey with AI
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: '16px', padding: '28px', boxShadow: 'var(--shadow-lg)'
        }}>
          <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text2)', marginBottom: '16px', textAlign: 'center' }}>
            Continue with
          </p>

          {/* Google */}
          <button
            onClick={() => { setLoading('google'); signIn('google', { callbackUrl: '/dashboard' }) }}
            disabled={!!loading}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              padding: '0 16px', height: '42px', borderRadius: '9px',
              background: '#fff', color: '#1a1a1a',
              border: '1px solid rgba(0,0,0,0.12)', cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px', fontWeight: '500', marginBottom: '10px',
              transition: 'all 0.15s', opacity: loading && loading !== 'google' ? 0.5 : 1,
              fontFamily: 'var(--font)'
            }}>
            {loading === 'google' ? <div className="spinner" style={{ borderTopColor: '#4285f4' }} /> : (
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
                <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
              </svg>
            )}
            Continue with Google
          </button>

          {/* GitHub */}
          <button
            onClick={() => { setLoading('github'); signIn('github', { callbackUrl: '/dashboard' }) }}
            disabled={!!loading}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              padding: '0 16px', height: '42px', borderRadius: '9px',
              background: 'var(--bg4)', color: 'var(--text1)',
              border: '1px solid var(--border2)', cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px', fontWeight: '500', marginBottom: '20px',
              transition: 'all 0.15s', opacity: loading && loading !== 'github' ? 0.5 : 1,
              fontFamily: 'var(--font)'
            }}>
            {loading === 'github' ? <div className="spinner" /> : (
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/>
              </svg>
            )}
            Continue with GitHub
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ fontSize: '12px', color: 'var(--text4)' }}>or try demo</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          {/* Demo */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              style={{
                flex: 1, background: 'var(--bg3)', border: '1px solid var(--border2)',
                borderRadius: '8px', padding: '0 12px', height: '40px',
                fontSize: '13px', color: 'var(--text1)', outline: 'none',
                fontFamily: 'var(--font)', transition: 'border-color 0.15s'
              }}
              type="email" placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && demoLogin()}
              onFocus={e => (e.target as HTMLElement).style.borderColor = 'var(--accent2)'}
              onBlur={e => (e.target as HTMLElement).style.borderColor = 'var(--border2)'}
            />
            <button
              onClick={demoLogin}
              disabled={!email.trim() || !!loading}
              style={{
                background: 'var(--accent)', color: '#fff',
                border: 'none', borderRadius: '8px', padding: '0 16px',
                height: '40px', fontSize: '13px', fontWeight: '500',
                cursor: !email.trim() || !!loading ? 'not-allowed' : 'pointer',
                opacity: !email.trim() ? 0.4 : 1, transition: 'all 0.15s',
                fontFamily: 'var(--font)', display: 'flex', alignItems: 'center', gap: '6px'
              }}>
              {loading === 'demo' ? <div className="spinner" style={{ width: '14px', height: '14px' }} /> : 'Enter'}
            </button>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text4)', textAlign: 'center', marginTop: '10px' }}>
            Demo mode — no password required
          </p>
        </div>

        {/* Footer */}
        <p style={{ fontSize: '11px', color: 'var(--text4)', textAlign: 'center', marginTop: '20px' }}>
          By continuing, you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  )
}
