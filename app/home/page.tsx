/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Check, Sparkles, BookOpen, GraduationCap, Award, Brain, Laptop, ArrowRight, ShieldCheck, Zap } from 'lucide-react'

const PREP_CATEGORIES = [
  {
    id: 'software',
    title: 'Software Dev & Tech Stacks',
    icon: Laptop,
    badge: 'Trending',
    tagline: 'Go from hello-world to deployable system architectures.',
    color: '#7c3aed',
    sampleGoal: 'Become a Fullstack Next.js & NestJS Developer in 45 Days',
    days: [
      { num: 'Day 1', title: 'React Server Components & Next.js App Router', desc: 'Understand Server vs Client components, folder-based routing, and layout compositions.', tech: ['React', 'Next.js'] },
      { num: 'Day 2', title: 'Database Integration with Prisma & PostgreSQL', desc: 'Set up schemas, write migrations, and initialize pool connections securely on the server.', tech: ['Prisma', 'PostgreSQL'] },
      { num: 'Day 3', title: 'API Security, JWT Authentication & Session Guards', desc: 'Secure routes, implement middleware guards, and establish stateful cookie handling.', tech: ['JWT', 'NextAuth'] },
    ]
  },
  {
    id: 'exams',
    title: 'Competitive Exams (GATE, CAT, UPSC)',
    icon: GraduationCap,
    badge: 'Academics',
    tagline: 'Master exhaustive syllabi with high-yield revision calendars.',
    color: '#3b82f6',
    sampleGoal: 'Succeed in GATE Computer Science — Theory of Computation & DS',
    days: [
      { num: 'Day 1', title: 'Theory of Computation: Finite Automata & DFA Minimization', desc: 'Solve equivalence proofs, construct state-transition tables, and practice high-yield GATE questions.', tech: ['ToC', 'Math'] },
      { num: 'Day 2', title: 'Algorithms: Dynamic Programming & Optimal Substructure', desc: 'Derive recurrences, build memoization grids, and solve matrix chain multiplications.', tech: ['Algorithms', 'DP'] },
      { num: 'Day 3', title: 'Databases: Relational Algebra & 3NF / BCNF Normalization', desc: 'Decompose schemas, check for lossless-joins, and practice dependency-preservation proofs.', tech: ['DBMS', 'SQL'] },
    ]
  },
  {
    id: 'certs',
    title: 'Professional Certifications (AWS, GCP, Cisco)',
    icon: Award,
    badge: 'Enterprise',
    tagline: 'Pass official cloud and infrastructure validation tracks with ease.',
    color: '#10b981',
    sampleGoal: 'AWS Certified Solutions Architect — Prep & Mock Simulator',
    days: [
      { num: 'Day 1', title: 'AWS Identity (IAM) & Custom VPC Networking', desc: 'Design secure multi-tier subnets, internet gateways, route tables, and NACL rules.', tech: ['AWS VPC', 'IAM'] },
      { num: 'Day 2', title: 'High Availability: EC2 Auto-Scaling & ALB Configurations', desc: 'Configure target groups, health probes, launch templates, and scaling policies.', tech: ['EC2', 'ALB'] },
      { num: 'Day 3', title: 'Global Delivery: S3 Object Storage & CloudFront CDN', desc: 'Set up signed URLs, CORS headers, edge cache behaviors, and origins.', tech: ['S3', 'CloudFront'] },
    ]
  },
  {
    id: 'interviews',
    title: 'FAANG Interviews & System Design',
    icon: Brain,
    badge: 'High Value',
    tagline: 'Speak and solve like a principal engineer under high pressure.',
    color: '#f59e0b',
    sampleGoal: 'FAANG System Design Prep — Scaling to 10M+ Users',
    days: [
      { num: 'Day 1', title: 'High Availability: Load Balancers & Consistent Hashing', desc: 'Distribute requests, write custom ring hashing logic, and mitigate hot spots.', tech: ['Load Balancing', 'Hashing'] },
      { num: 'Day 2', title: 'Speed Tier: Redis Cache Eviction & Replication Topologies', desc: 'Build write-through caches, optimize eviction policies (LRU/LFU), and scale read replicas.', tech: ['Redis', 'Caching'] },
      { num: 'Day 3', title: 'Partitioning: Database Sharding & CAP Theorem Tradeoffs', desc: 'Analyze range vs directory partitioning, manage key lookups, and design consistent reads.', tech: ['Sharding', 'NoSQL'] },
    ]
  }
]

const FEATURES = [
  { icon: '✦', title: 'Dual-Engine Builder', desc: 'Harness the power of AI to generate smart day-by-day itineraries instantly, or design clean manual phase structures yourself.' },
  { icon: '◎', title: 'Phase & Task Modularity', desc: 'Organize your roadmap into digestible logical semesters or sprints. Edit titles, tech chips, and resources at any point.' },
  { icon: '△', title: 'Free Resource Curation', desc: 'Automatically matches learning days with reference documentation, books, and high-quality free video resources.' },
  { icon: '⬡', title: 'Self-Learning Analytics', desc: 'Generate visual PDF/image completion reports. Analyze your weekly streaks, speed, and skill acquisition indexes.' },
  { icon: '◑', title: 'Fully Editable Schemas', desc: 'Modify tasks, shift days, add new links, or switch accent colors dynamically on both AI-generated and manual plans.' },
  { icon: '⏰', title: 'Smart Sync Reminders', desc: 'Configure study reminders at custom local hours with toggle-able daily email, push notifications, and rest day skips.' },
]

const STATS = [
  { value: '15,000+', label: 'Active Students' },
  { value: '98.4%', label: 'Syllabus Coverage' },
  { value: '4.9★', label: 'Play Store & Web Rating' },
  { value: '2.5x', label: 'Faster Concept Retention' },
]

export default function LandingPage() {
  const [activeCategory, setActiveCategory] = useState('software')

  const currentCat = PREP_CATEGORIES.find(c => c.id === activeCategory) || PREP_CATEGORIES[0]
  const IconComponent = currentCat.icon

  return (
    <div style={{ background: '#09090b', color: '#fafafa', overflowX: 'hidden' }}>
      
      {/* Hero Section */}
      <section style={{ minHeight: '92vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '100px 24px 60px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '25%', left: '50%', transform: 'translate(-50%,-50%)', width: '800px', height: '400px', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        
        <div style={{ position: 'relative', maxWidth: '840px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '999px', marginBottom: '24px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', fontSize: '12px', color: '#a78bfa', fontWeight: '500' }}>
            <Sparkles size={12} className="animate-pulse" />
            Empowering students, developers, and competitive exam aspirants worldwide
          </div>

          <h1 style={{ fontSize: 'clamp(36px, 6.5vw, 72px)', fontWeight: '850', letterSpacing: '-2.5px', lineHeight: '1.05', marginBottom: '20px', color: '#fff' }}>
            Learn anything with<br />
            <span style={{ background: 'linear-gradient(135deg, #7c3aed, #c084fc, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Adaptive AI Roadmaps</span>
          </h1>

          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.45)', marginBottom: '36px', lineHeight: '1.65', maxWidth: '580px', margin: '0 auto 36px' }}>
            Create structured, customized, day-by-day prep checklists manually or with advanced AI. Complete with resources, tech stack chips, and detailed milestones.
          </p>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 32px', background: '#7c3aed', color: '#fff', borderRadius: '12px', textDecoration: 'none', fontSize: '15px', fontWeight: '700', transition: 'all 0.15s', boxShadow: '0 8px 32px rgba(124,58,237,0.35)' }}>
              ✦ Start for free
            </Link>
            <Link href="/pricing" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 30px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: '12px', textDecoration: 'none', fontSize: '15px', fontWeight: '500', transition: 'all 0.15s' }}>
              View pricing details <ArrowRight size={14} />
            </Link>
          </div>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginTop: '16px' }}>No credit card required · Seamless AI & manual tools out-of-the-box</p>
        </div>
      </section>

      {/* Stats Board */}
      <section style={{ padding: '0 24px 80px', maxWidth: '1000px', margin: '0 auto' }}>
        <div className="grid grid-cols-2 md:grid-cols-4 bg-white/[0.02] rounded-2xl overflow-hidden border border-white/[0.06] divide-x divide-y divide-white/[0.04] md:divide-y-0">
          {STATS.map(({ value, label }) => (
            <div key={label} className="p-6 md:p-8 text-center flex flex-col justify-center border-white/[0.04]">
              <div className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-1">{value}</div>
              <div className="text-xs text-white/45">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Prep Showcase: "Prep for Anything" */}
      <section style={{ padding: '60px 24px 80px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>PREPARE FOR ANYTHING</div>
          <h2 style={{ fontSize: 'clamp(26px,3.5vw,42px)', fontWeight: '800', letterSpacing: '-1.5px', color: '#fff', marginBottom: '14px' }}>What are you studying next?</h2>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.4)', maxWidth: '500px', margin: '0 auto' }}>Select an education category to preview how RoadMaper constructs custom, day-by-day learning pathways.</p>
        </div>

        {/* Category Switcher Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', marginBottom: '32px' }}>
          {PREP_CATEGORIES.map((cat) => {
            const CatIcon = cat.icon
            const isActive = cat.id === activeCategory
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px 20px',
                  background: isActive ? 'rgba(255,255,255,0.03)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.04)'}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: isActive ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isActive ? '#a78bfa' : 'rgba(255,255,255,0.4)'
                }}>
                  <CatIcon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: isActive ? '#fff' : 'rgba(255,255,255,0.6)' }}>{cat.title}</div>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', fontWeight: '600' }}>{cat.badge}</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Visual Roadmap Preview Simulator */}
        <div className="p-4 sm:p-7 bg-white/[0.01] border border-white/[0.06] rounded-2xl">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-white/[0.06] pb-5 mb-6">
            <div>
              <span style={{ fontSize: '11px', color: '#a78bfa', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Interactive Preview</span>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginTop: '4px' }}>{currentCat.sampleGoal}</h3>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>{currentCat.tagline}</p>
            </div>
            <Link href="/login" className="self-start sm:self-auto text-xs sm:text-sm font-semibold text-white no-underline bg-violet-600 hover:bg-violet-700 px-4 py-2.5 rounded-lg flex items-center gap-2 transition shrink-0 whitespace-nowrap">
              Generate Custom Plan <Sparkles size={12} />
            </Link>
          </div>

          {/* Sample Days List */}
          <div className="flex flex-col gap-3">
            {currentCat.days.map((day, i) => (
              <div
                key={i}
                className="flex flex-col md:flex-row gap-4 p-4 md:p-5 bg-white/[0.02] border border-white/[0.04] rounded-xl md:items-center justify-between"
              >
                <div className="flex gap-4 items-start flex-1">
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '10px',
                      background: 'rgba(255,255,255,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(255,255,255,0.04)',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: '500' }}>DAY</span>
                    <span style={{ fontSize: '16px', color: '#fff', fontWeight: '850', letterSpacing: '-0.5px', lineHeight: '1' }}>{i + 1}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      {day.tech.map(t => (
                        <span key={t} style={{ fontSize: '10px', padding: '2px 8px', background: 'rgba(124,58,237,0.1)', color: '#c084fc', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '4px', fontWeight: '600' }}>{t}</span>
                      ))}
                    </div>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{day.title}</h4>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '4px', lineHeight: '1.4' }}>{day.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] md:text-xs text-white/30 self-start md:self-auto pl-[68px] md:pl-0">
                  <span>Verified Resources Included</span>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{ padding: '60px 24px 80px', maxWidth: '1100px', margin: '0 auto', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>COMPLETE ENGINE</div>
          <h2 style={{ fontSize: 'clamp(26px,3vw,40px)', fontWeight: '800', letterSpacing: '-1px', color: '#fff', marginBottom: '12px' }}>Why learn with RoadMaper?</h2>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.35)', maxWidth: '440px', margin: '0 auto' }}>Designed to give you absolute control and structure, from day one.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ padding: '28px', borderRadius: '14px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s' }}>
              <div style={{ fontSize: '24px', marginBottom: '14px', color: '#a78bfa' }}>{f.icon}</div>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>{f.title}</h3>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.6', margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Flow */}
      <section style={{ padding: '60px 24px 80px', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>WORKFLOW</div>
          <h2 style={{ fontSize: 'clamp(24px,3vw,36px)', fontWeight: '800', letterSpacing: '-1px', marginBottom: '40px' }}>Simple as 1, 2, 3</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '28px', textAlign: 'left' }}>
            {[
              { step: '01', title: 'Choose Creation Path', desc: 'Go AI-generated for dynamic day-by-day itineraries, or manual to construct a precise personal master plan.' },
              { step: '02', title: 'Personalize & Shift Days', desc: 'Drag, drop, add tasks, customize colors, modify tech tags, and link directly to your study resources.' },
              { step: '03', title: 'Track Daily Milestones', desc: 'Check off complete days. Study with smart reminders, track completion metrics, and export reports.' },
            ].map(({ step, title, desc }) => (
              <div key={step} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '24px', borderRadius: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#a78bfa', marginBottom: '12px', letterSpacing: '0.1em' }}>{step}</div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>{title}</h3>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.6', margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section style={{ padding: '80px 24px 100px', textAlign: 'center' }}>
        <div style={{ maxWidth: '540px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(26px,4vw,42px)', fontWeight: '800', letterSpacing: '-1.5px', marginBottom: '14px' }}>Build your education pathway now</h2>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.35)', marginBottom: '28px' }}>Join thousands of students and self-learners structure their success.</p>
          <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '15px 36px', background: '#7c3aed', color: '#fff', borderRadius: '12px', textDecoration: 'none', fontSize: '16px', fontWeight: '700', boxShadow: '0 8px 36px rgba(124,58,237,0.4)' }}>
            ✦ Get started free
          </Link>
        </div>
      </section>
    </div>
  )
}
