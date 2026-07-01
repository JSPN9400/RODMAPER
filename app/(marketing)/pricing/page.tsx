'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Check } from 'lucide-react'

const PLANS = [
  {
    id: 'free', name: 'Free', icon: '◎',
    price: { monthly: 0, yearly: 0 },
    desc: 'Watch 1 ad for 1 hour of AI access',
    color: '#71717a', highlight: false,
    features: ['Unlimited manual roadmaps', 'Daily progress tracking', 'Basic reminders', '1 AI generation per ad (1 min)', 'Community templates', 'Basic reports'],
    cta: 'Start free', href: '/login',
  },
  {
    id: 'pro', name: 'Pro', icon: '⚡',
    price: { monthly: 99, yearly: 79 },
    desc: 'Everything you need to land your dream role',
    color: '#7c3aed', highlight: true,
    features: ['Everything in Free', 'Unlimited AI roadmap generation', 'NLU Smart input', 'Self-Learning AI Insights', 'Skill Gap Analyzer', 'Resume & LinkedIn builder', 'Priority support', 'No ads — ever'],
    cta: 'Start Pro', href: '/login?plan=pro',
  },
  {
    id: 'pro_ai', name: 'Pro + AI', icon: '✦',
    price: { monthly: 149, yearly: 119 },
    desc: 'Maximum AI power for serious learners',
    color: '#f59e0b', highlight: false,
    features: ['Everything in Pro', 'Advanced AI analysis', 'Daily AI task suggestions', 'AI completion reports', 'AI-generated case studies', 'AI LinkedIn post writer', 'Early access to features', 'Priority AI queue'],
    cta: 'Start Pro + AI', href: '/login?plan=pro_ai',
  },
]

const FAQS = [
  { q: 'Is the free plan really free?', a: 'Yes! Manual roadmaps and basic tracking are free forever. For AI features, watch a 1-minute ad for 1 hour of access.' },
  { q: 'What payment methods do you accept?', a: 'UPI, Net Banking, all cards via Razorpay (India) and Stripe (International).' },
  { q: 'Can I cancel anytime?', a: 'Yes, cancel anytime. No questions asked. Your data stays safe for 30 days.' },
  { q: 'Is there a student discount?', a: 'Yes! Students get 40% off. Email us at support@roadmaper.com with your student ID.' },
]

export default function PricingPage() {
  const [yearly, setYearly] = useState(false)

  return (
    <div>
      <section style={{ padding: '80px 40px 60px', textAlign: 'center' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>PRICING</div>
        <h1 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: '800', letterSpacing: '-2px', marginBottom: '14px', color: '#fff' }}>Simple, honest pricing</h1>
        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)', marginBottom: '32px' }}>Start free. Upgrade when you are ready.</p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {['Monthly', 'Yearly'].map((label, i) => (
            <button key={label} onClick={() => setYearly(i === 1)} style={{
              padding: '7px 18px', borderRadius: '7px', border: 'none', cursor: 'pointer',
              background: (i === 1) === yearly ? '#fff' : 'transparent',
              color: (i === 1) === yearly ? '#09090b' : 'rgba(255,255,255,0.5)',
              fontSize: '13px', fontWeight: '500', fontFamily: 'inherit', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              {label}
              {i === 1 && <span style={{ fontSize: '10px', padding: '1px 5px', background: '#7c3aed', color: '#fff', borderRadius: '4px', fontWeight: '700' }}>-20%</span>}
            </button>
          ))}
        </div>
      </section>

      <section style={{ padding: '0 40px 60px', maxWidth: '1060px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', alignItems: 'start' }}>
          {PLANS.map(plan => (
            <div key={plan.id} style={{
              borderRadius: '16px', padding: '28px', position: 'relative',
              background: plan.highlight ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${plan.highlight ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.06)'}`,
              transform: plan.highlight ? 'scale(1.03)' : 'scale(1)'
            }}>
              {plan.highlight && (
                <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', padding: '3px 14px', background: '#7c3aed', borderRadius: '20px', fontSize: '11px', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap' }}>MOST POPULAR</div>
              )}
              <div style={{ fontSize: '22px', marginBottom: '10px' }}>{plan.icon}</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>{plan.name}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '20px', lineHeight: '1.5' }}>{plan.desc}</div>
              <div style={{ marginBottom: '22px' }}>
                {plan.price.monthly === 0 ? (
                  <div style={{ fontSize: '36px', fontWeight: '800', color: '#fff', letterSpacing: '-1px' }}>Free</div>
                ) : (
                  <div>
                    <span style={{ fontSize: '36px', fontWeight: '800', color: '#fff', letterSpacing: '-1px' }}>₹{yearly ? plan.price.yearly : plan.price.monthly}</span>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>/mo</span>
                    {yearly && <div style={{ fontSize: '12px', color: '#22c55e', marginTop: '3px' }}>Save ₹{(plan.price.monthly - plan.price.yearly) * 12}/year</div>}
                  </div>
                )}
              </div>
              <Link href={plan.href} style={{
                display: 'block', textAlign: 'center', padding: '11px', borderRadius: '9px',
                background: plan.highlight ? '#7c3aed' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${plan.highlight ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: '600',
                marginBottom: '22px', boxShadow: plan.highlight ? '0 4px 20px rgba(124,58,237,0.35)' : 'none'
              }}>{plan.cta}</Link>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <Check size={13} style={{ color: plan.highlight ? '#a78bfa' : '#22c55e', flexShrink: 0, marginTop: '1px' }} />
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.4' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '20px', padding: '18px 22px', borderRadius: '12px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.18)', display: 'flex', gap: '12px' }}>
          <span style={{ fontSize: '18px' }}>💡</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#fbbf24', marginBottom: '3px' }}>How free AI access works</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.6' }}>Watch a 1-minute ad → get 1 hour of AI features free. Paid plans have zero ads.</div>
          </div>
        </div>
      </section>

      <section style={{ padding: '0 40px 100px', maxWidth: '680px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '800', textAlign: 'center', marginBottom: '28px', letterSpacing: '-0.5px' }}>Frequently asked</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ padding: '18px 20px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff', marginBottom: '6px' }}>{faq.q}</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.6' }}>{faq.a}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
