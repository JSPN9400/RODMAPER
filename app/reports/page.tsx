import { Suspense } from 'react'
import ReportsContent from './ReportsContent'

export default function ReportsPage() {
  return (
    <Suspense fallback={
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
        <div className="spinner" style={{ width:'24px', height:'24px', borderWidth:'2.5px' }} />
      </div>
    }>
      <ReportsContent />
    </Suspense>
  )
}
