import React from 'react'
import { AlertTriangle, Gauge, Target, Clock } from 'lucide-react'
import { useCase } from '../context/CaseContext'
import { fmtTime, hoursBetween } from '../lib/format'

export default function KpiCards() {
  const { data } = useCase()
  const { validation, peak, alertSnapshot } = data
  const onsetDeltaH = hoursBetween(validation.onset.imdWmo, validation.onset.detection)
  const onsetLabel = onsetDeltaH === 0 ? 'same time as IMD' : onsetDeltaH > 0 ? `${onsetDeltaH} h after IMD's ${data.role === 'in-sample' ? '' : ''}call`.trim() : `${-onsetDeltaH} h before IMD's call`

  const cards = [
    {
      label: 'Peak alert cells (severe)',
      icon: AlertTriangle,
      value: alertSnapshot.counts.severe,
      accent: alertSnapshot.counts.severe > 0,
      sub: `${alertSnapshot.counts.moderate} moderate, ${alertSnapshot.counts.low} low · ${fmtTime(alertSnapshot.time)}`,
    },
    {
      label: 'Peak intensity (min MSLP)',
      icon: Gauge,
      value: `${peak.minMsl.toFixed(1)} hPa`,
      sub: `max wind ${peak.maxWs.toFixed(1)} m/s · ${fmtTime(data.track.find((p) => p.t === peak.maxWsAt)?.time)}`,
    },
    {
      label: 'Track error vs IBTrACS',
      icon: Target,
      value: `${validation.pmin.medianKm.toFixed(1)} km`,
      sub: `median · ${validation.matchedSteps}/${validation.matchedSteps} steps matched`,
    },
    {
      label: 'Detection onset',
      icon: Clock,
      value: fmtTime(validation.onset.detection).replace(' UTC', ''),
      sub: onsetLabel + ' (IMD wind ≥ 34 kt)',
    },
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
          <div className={`text-[26px] font-bold leading-none ${c.accent ? 'text-red-600' : 'text-brand'}`}>
            {c.value}
          </div>
          <div className="text-[11px] text-muted mt-2 leading-snug">{c.sub}</div>
        </div>
      ))}
    </div>
  )
}
