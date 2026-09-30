import React from 'react'
import { useCase } from '../context/CaseContext'
import { ALERT_TIERS_DEF } from '../data/cases'
import { fmtTime } from '../lib/format'

// Card background is a translucent tint of the tier colour, so it reads as a pale
// pastel on the light theme and a dark tint on the dark theme (text stays legible).
const STYLE = {
  severe: { fg: '#C0392B', label: 'SEVERE' },
  moderate: { fg: '#D35400', label: 'MODERATE' },
  low: { fg: '#B7950B', label: 'LOW' },
}

const TITLE = {
  severe: 'Extreme wind cell',
  moderate: 'Very heavy wind cell',
  low: 'Heavy wind watch',
}

export default function AlertsCard() {
  const { data } = useCase()
  const { alertSnapshot } = data

  return (
    <div className="bg-card rounded-card px-5 py-4">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="font-bold text-ink text-[14.5px]">Alerts</h3>
        <span className="text-[10.5px] text-muted">auto-ranked · forecaster sign-off for severe</span>
      </div>
      <div className="space-y-2.5">
        {(['severe', 'moderate', 'low']).map((tier) => {
          const ex = alertSnapshot.examples[tier]
          const s = STYLE[tier]
          const def = ALERT_TIERS_DEF[tier]
          if (!ex) {
            return (
              <div key={tier} className="rounded-lg px-3.5 py-3 bg-bg text-[11.5px] text-muted italic">
                No {tier} cells at {fmtTime(alertSnapshot.time)} — ERA5's analyzed wind for {data.label} never
                reached the {def.windMs} m/s ({def.windKt} kt, IMD {def.imd}) gate at this step.
              </div>
            )
          }
          return (
            <div key={tier} className="rounded-lg px-3.5 py-3 flex items-center justify-between gap-3" style={{ background: `${s.fg}1f` }}>
              <div>
                <span className="text-[10px] font-bold tracking-wide px-2 py-0.5 rounded" style={{ background: s.fg, color: 'white' }}>
                  {s.label}
                </span>
                <div className="font-semibold text-ink text-[13px] mt-1.5">{TITLE[tier]}</div>
                <div className="text-[11.5px] text-muted">
                  {ex.lat.toFixed(2)}°N, {ex.lon.toFixed(2)}°E · single 0.25° cell
                </div>
                <div className="text-[11.5px] text-muted">
                  z {ex.z.toFixed(1)} · wind {ex.windMs.toFixed(1)} m/s (≥ {def.windMs} m/s, IMD {def.imd})
                </div>
              </div>
              <span className="text-[10.5px] font-semibold px-2.5 py-1 rounded-full border shrink-0" style={{ borderColor: s.fg, color: s.fg }}>
                {alertSnapshot.counts[tier]} cells
              </span>
            </div>
          )
        })}
      </div>
      <div className="text-[10.5px] text-muted mt-3 leading-snug">
        Tiers are z-score AND an IMD wind gate, inside tracked-object boxes + 1°. Set after observing results;
        not validated against real impacts. {fmtTime(alertSnapshot.time)} snapshot,{' '}
        {(100 * (alertSnapshot.counts.low + alertSnapshot.counts.moderate + alertSnapshot.counts.severe) / alertSnapshot.domainCells).toFixed(1)}% of the domain.
      </div>
    </div>
  )
}
