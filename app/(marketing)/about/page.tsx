import Link from 'next/link'

export default function AboutPage() {
  return (
    <div>
      <section style={{ padding: '80px 40px 60px', textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>ABOUT</div>
        <h1 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: '800', letterSpacing: '-1.5px', marginBottom: '20px', color: '#fff' }}>
          Built for learners who want to move fast
        </h1>
        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.7', marginBottom: '0' }}>
          RoadMaper was born from frustration. Most learners know what they want to become — but have no idea how to get there efficiently. Generic courses waste time. YouTube rabbit holes kill momentum. RoadMaper fixes this with AI.
        </p>
      </section>

      <section style={{ padding: '40px 40px 80px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
          {[
            { title: 'The Problem', text: 'Most people fail not because they are lazy — but because they have no structured path. They jump from tutorial to tutorial with no clear goal or tracking system.' },
            { title: 'Our Solution', text: 'RoadMaper gives you a complete AI-generated roadmap in 30 seconds. Day-by-day tasks, real projects, free resources — all personalized to YOUR background.' },
            { title: 'Who it is for', text: 'Students, career switchers, freshers looking for first jobs, and professionals upskilling. If you want to level up your career, RoadMaper is built for you.' },
            { title: 'Our mission', text: 'Make quality career learning accessible to everyone — especially in Tier 2 and Tier 3 cities in India where coaching is expensive and guidance is limited.' },
          ].map(({ title, text }) => (
            <div key={title} style={{ padding: '24px', borderRadius: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '10px' }}>{title}</h3>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.7', margin: 0 }}>{text}</p>
            </div>
          ))}
        </div>

        <div style={{ padding: '32px', borderRadius: '16px', background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', textAlign: 'center' }}>
          <div style={{ fontSize: '22px', marginBottom: '12px' }}>✦</div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', marginBottom: '12px', letterSpacing: '-0.5px' }}>Start your journey today</h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '24px' }}>Free forever. No credit card required.</p>
          <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px', background: '#7c3aed', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
            Get started free →
          </Link>
        </div>
      </section>
    </div>
  )
}
