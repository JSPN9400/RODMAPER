import Link from 'next/link'

const FEATURES = [
  { icon: '✦', title: 'AI Roadmap Generator', desc: 'Tell AI your goal and background. Get a complete personalized day-by-day plan with tasks and resources in 30 seconds.' },
  { icon: '◎', title: 'Daily Progress Tracker', desc: 'Mark tasks done with one click. GitHub-style heatmap shows your activity. Never lose track.' },
  { icon: '△', title: 'Skill Gap Analyzer', desc: 'AI compares your skills vs your target role and tells you exactly what to focus on.' },
  { icon: '⬡', title: 'Self-Learning Insights', desc: 'AI studies your learning patterns, gives you a motivation score and personalized next steps.' },
  { icon: '◑', title: 'Resume Builder', desc: 'AI writes ATS-optimized resume bullets from your completed projects. Portfolio-ready in minutes.' },
  { icon: '⏰', title: 'Smart Reminders', desc: 'Browser push notifications at custom times. Set different reminders for each roadmap.' },
]

const STATS = [
  { value: '10,000+', label: 'Learners' },
  { value: '50,000+', label: 'Tasks Done' },
  { value: '4.9★', label: 'Rating' },
  { value: '30 days', label: 'Avg to job-ready' },
]

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section style={{ minHeight: '88vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '80px 40px 60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: '700px', height: '400px', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(124,58,237,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: '780px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: '20px', marginBottom: '28px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', fontSize: '12px', color: '#a78bfa' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#a78bfa', display: 'inline-block' }} />
            AI-Powered Learning System · Free to Start
          </div>

          <h1 style={{ fontSize: 'clamp(36px,6vw,68px)', fontWeight: '800', letterSpacing: '-2.5px', lineHeight: '1.05', marginBottom: '22px', color: '#fff' }}>
            Build your learning<br />
            <span style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>roadmap with AI</span>
          </h1>

          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.45)', marginBottom: '40px', lineHeight: '1.65', maxWidth: '540px', margin: '0 auto 40px' }}>
            Tell AI your goal and background. Get a complete personalized day-by-day learning plan with tasks, resources, and projects — in 30 seconds.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 30px', background: '#7c3aed', color: '#fff', borderRadius: '12px', textDecoration: 'none', fontSize: '15px', fontWeight: '700', boxShadow: '0 8px 32px rgba(124,58,237,0.4)' }}>
              ✦ Start for free
            </Link>
            <Link href="/pricing" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px', textDecoration: 'none', fontSize: '15px', fontWeight: '500' }}>
              See pricing →
            </Link>
          </div>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginTop: '14px' }}>No credit card required · Free forever plan available</p>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: '0 40px 80px', maxWidth: '860px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', background: 'rgba(255,255,255,0.04)', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
          {STATS.map(({ value, label }, i) => (
            <div key={label} style={{ padding: '28px 20px', textAlign: 'center', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div style={{ fontSize: '26px', fontWeight: '800', color: '#fff', letterSpacing: '-1px', marginBottom: '5px' }}>{value}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '40px 40px 80px', maxWidth: '1060px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>FEATURES</div>
          <h2 style={{ fontSize: 'clamp(26px,3vw,40px)', fontWeight: '800', letterSpacing: '-1px', color: '#fff', marginBottom: '12px' }}>Everything to level up your career</h2>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.35)', maxWidth: '440px', margin: '0 auto' }}>Built for learners who want results — not another course platform</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ padding: '26px', borderRadius: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', transition: 'all 0.2s', cursor: 'default' }}>
              <div style={{ fontSize: '22px', marginBottom: '14px', color: '#a78bfa' }}>{f.icon}</div>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>{f.title}</h3>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.6', margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '60px 40px 80px', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>HOW IT WORKS</div>
          <h2 style={{ fontSize: 'clamp(24px,3vw,36px)', fontWeight: '800', letterSpacing: '-1px', marginBottom: '44px' }}>Ready in 3 steps</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '32px' }}>
            {[
              { step: '01', title: 'Tell AI your goal', desc: 'Type your target role and background in plain language. Our NLU understands even typos and incomplete sentences.' },
              { step: '02', title: 'Get your roadmap', desc: 'AI generates a complete day-by-day plan with tasks, tech stack, and free learning resources — in 30 seconds.' },
              { step: '03', title: 'Track and improve', desc: 'Check off daily tasks. AI analyzes your patterns and adjusts suggestions to keep you on track.' },
            ].map(({ step, title, desc }) => (
              <div key={step}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#7c3aed', marginBottom: '12px', letterSpacing: '0.1em' }}>{step}</div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>{title}</h3>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.6', margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 40px 100px', textAlign: 'center' }}>
        <div style={{ maxWidth: '520px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(26px,4vw,42px)', fontWeight: '800', letterSpacing: '-1.5px', marginBottom: '14px' }}>Start your learning journey today</h2>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.35)', marginBottom: '28px' }}>Free to start. No credit card required.</p>
          <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '15px 36px', background: '#7c3aed', color: '#fff', borderRadius: '12px', textDecoration: 'none', fontSize: '16px', fontWeight: '700', boxShadow: '0 8px 36px rgba(124,58,237,0.4)' }}>
            ✦ Get started free
          </Link>
        </div>
      </section>
    </div>
  )
}
