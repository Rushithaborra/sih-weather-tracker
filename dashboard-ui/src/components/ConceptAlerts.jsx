import React from 'react'
import { ALERTS } from '../data/concept'

const STYLE = {
  severe: { bg: '#FDECEA', fg: '#C0392B', label: 'SEVERE' },
  moderate: { bg: '#FEF1E6', fg: '#D35400', label: 'MODERATE' },
  low: { bg: '#FEF9E7', fg: '#B7950B', label: 'LOW' },
}

export default function ConceptAlerts() {
  return (
    <div className="bg-card rounded-card px-5 py-4">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="font-bold text-ink text-[14.5px]">Alerts</h3>
        <span className="text-[10.5px] text-muted">auto-ranked, forecaster sign-off for Severe</span>
      </div>
      <div className="space-y-2.5">
        {ALERTS.map((a) => {
          const s = STYLE[a.tier]
          return (
            <div key={a.title} className="rounded-lg px-3.5 py-3 flex items-center justify-between gap-3" style={{ background: s.bg }}>
              <div>
                <span className="text-[10px] font-bold tracking-wide px-2 py-0.5 rounded" style={{ background: s.fg, color: 'white' }}>
                  {s.label}
                </span>
                <div className="font-semibold text-ink text-[13px] mt-1.5">{a.title}</div>
                <div className="text-[11.5px] text-muted">{a.location} | {a.radius}</div>
                <div className="text-[11.5px] text-muted">{a.metric} | {a.lead}</div>
              </div>
              <span
                className="text-[10.5px] font-semibold px-2.5 py-1 rounded-full border shrink-0"
                style={{ borderColor: s.fg, color: s.fg }}
              >
                {a.tag}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
