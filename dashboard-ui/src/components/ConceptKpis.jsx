import React from 'react'
import { AlertTriangle, Gauge, Users, Clock } from 'lucide-react'
import { KPIS } from '../data/concept'

export default function ConceptKpis() {
  const cards = [
    { label: 'Active anomalies', icon: AlertTriangle, value: KPIS.activeAnomalies.value, sub: KPIS.activeAnomalies.sub, accent: true },
    { label: 'Peak EFI', icon: Gauge, value: KPIS.peakEfi.value, sub: KPIS.peakEfi.sub },
    { label: 'Members agreeing', icon: Users, value: KPIS.membersAgreeing.value, sub: KPIS.membersAgreeing.sub },
    { label: 'Lead time to landfall', icon: Clock, value: KPIS.leadTime.value, sub: KPIS.leadTime.sub },
  ]
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="bg-card rounded-card px-5 py-4">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${c.accent ? 'bg-red-600/10 text-red-600' : 'bg-brand/10 text-brand'}`}>
              <c.icon size={13} strokeWidth={2.2} />
            </span>
            <div className="text-[12px] text-muted">{c.label}</div>
          </div>
          <div className={`text-[26px] font-bold leading-none ${c.accent ? 'text-red-600' : 'text-brand'}`}>{c.value}</div>
          <div className="text-[11px] text-muted mt-2 leading-snug">{c.sub}</div>
        </div>
      ))}
    </div>
  )
}
