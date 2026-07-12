'use client'

export function PageSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:'12px' }}>
      <div className="spinner" style={{ width:'26px', height:'26px', borderWidth:'2.5px' }} />
      <p style={{ fontSize:'13px', color:'var(--text3)' }}>{label}</p>
    </div>
  )
}

export function PageError({ title, message }: { title: string; message: string }) {
  return (
    <div style={{ padding:'36px 24px', maxWidth:'480px', margin:'0 auto' }}>
      <div style={{ background:'var(--red-bg)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'14px', padding:'20px' }}>
        <div style={{ fontSize:'15px', fontWeight:'600', color:'#fff', marginBottom:'6px' }}>{title}</div>
        <div style={{ fontSize:'13px', color:'var(--red)', lineHeight:'1.5' }}>{message}</div>
      </div>
    </div>
  )
}

export function EmptyState({ icon, title, desc, action }: { icon?: string; title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div style={{ textAlign:'center', padding:'60px 24px' }}>
      {icon && <div style={{ fontSize:'40px', marginBottom:'14px' }}>{icon}</div>}
      <h2 style={{ fontSize:'17px', fontWeight:'700', marginBottom:'8px' }}>{title}</h2>
      {desc && <p style={{ fontSize:'13px', color:'var(--text3)', marginBottom:'20px', lineHeight:'1.6' }}>{desc}</p>}
      {action}
    </div>
  )
}
