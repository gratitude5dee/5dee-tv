'use client'

import DirectorPanel from '../../components/DirectorPanel'

export default function LiveControlPage() {
  return (
    <div className="space-y-8">
      {/* Realtime Director model stream */}
      <DirectorPanel />
    </div>
  )
}
