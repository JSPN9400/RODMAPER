export function PageSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px' }}>
      <div className="spinner" style={{ width: '24px', height: '24px', borderWidth: '2.5px' }} />
      <div style={{ fontSize: '13px', color: 'var(--text3)' }}>{label}</div>
    </div>
  )
}

export function PageError({ title = 'Page could not load', message }: { title?: string; message: string }) {
  return (
    <div style={{ padding: '36px 40px', maxWidth: '720px' }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
        <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text1)', marginBottom: '8px' }}>{title}</div>
        <div style={{ fontSize: '13px', color: 'var(--red)' }}>{message}</div>
      </div>
    </div>
  )
}
