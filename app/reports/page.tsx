/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

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
