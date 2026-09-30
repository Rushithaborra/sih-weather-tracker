import React from 'react'
import { KPIS } from '../data/concept'

export default function ConceptKpis() {
  const cards = [
    { label: 'Active anomalies', value: KPIS.activeAnomalies.value, sub: KPIS.activeAnomalies.sub, accent: true },
    { label: 'Peak EFI', value: KPIS.peakEfi.value, sub: KPIS.peakEfi.sub },
    { label: 'Members agreeing', value: KPIS.membersAgreeing.value, sub: KPIS.membersAgreeing.sub },
    { label: 'Lead time to landfall', value: KPIS.leadTime.value, sub: KPIS.leadTime.sub },
  ]
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="bg-white rounded-card px-5 py-4">
          <div className="text-[12px] text-muted mb-1.5">{c.label}</div>
          <div className={`text-[26px] font-bold leading-none ${c.accent ? 'text-red-600' : 'text-teal'}`}>{c.value}</div>
          <div className="text-[11px] text-muted mt-2 leading-snug">{c.sub}</div>
        </div>
      ))}
    </div>
  )
}
