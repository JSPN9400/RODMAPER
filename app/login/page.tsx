/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

'use client'
import { signIn } from 'next-auth/react'
import { useState } from 'react'

export default function LoginPage() {
  const [loading, setLoading] = useState<string | null>(null)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, #000000 0%, #000000 60%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
    }}>
      {/* Glow */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translate(-50%,-50%)',
        width: '600px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(79,107,255,0.15) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: '360px', position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #4F6BFF, #93A5FF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', fontWeight: '800', color: '#fff',
            margin: '0 auto 16px', boxShadow: '0 8px 32px rgba(79,107,255,0.4)'
          }}>R</div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', margin: '0 0 6px', letterSpacing: '-0.5px' }}>RoadMaper</h1>
          <p style={{ fontSize: '14px', color: 'rgba(245,245,247,0.4)', margin: 0 }}>
            AI-powered learning for any goal
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(245,245,247,0.04)',
          border: '1px solid rgba(245,245,247,0.1)',
          borderRadius: '20px', padding: '28px',
          backdropFilter: 'blur(20px)'
        }}>
          <p style={{ fontSize: '13px', color: 'rgba(245,245,247,0.5)', textAlign: 'center', marginBottom: '16px' }}>
            Sign in to continue
          </p>

          {/* Google */}
          <button
            onClick={() => { setLoading('google'); signIn('google', { callbackUrl: '/dashboard' }) }}
            disabled={!!loading}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              height: '46px', borderRadius: '12px', background: '#fff', color: '#1C1C1E',
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px', fontWeight: '600', marginBottom: '10px',
              opacity: loading && loading !== 'google' ? 0.4 : 1,
              fontFamily: 'inherit', transition: 'all 0.15s'
            }}>
            {loading === 'google' ? (
              <div className="spinner" style={{ borderTopColor: '#4285f4', width: '16px', height: '16px' }} />
            ) : (
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
              height: '46px', borderRadius: '12px',
              background: 'rgba(245,245,247,0.06)', color: '#fff',
              border: '1px solid rgba(245,245,247,0.12)',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px', fontWeight: '600',
              opacity: loading && loading !== 'github' ? 0.4 : 1,
              fontFamily: 'inherit', transition: 'all 0.15s'
            }}>
            {loading === 'github' ? (
              <div className="spinner" style={{ width: '16px', height: '16px' }} />
            ) : (
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/>
              </svg>
            )}
            Continue with GitHub
          </button>
        </div>

        <p style={{ fontSize: '11px', color: 'rgba(245,245,247,0.25)', textAlign: 'center', marginTop: '16px' }}>
          By continuing you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  )
}
