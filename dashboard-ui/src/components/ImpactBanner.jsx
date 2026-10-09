import React from 'react'
import { Crosshair, ShieldCheck, Target, RadioTower } from 'lucide-react'
import { DETECTION_SKILL } from '../data/detectionSkill'
import { QUIET_PERIODS } from '../data/quietPeriods'

// The headline numbers, pulled straight from the same validation data behind the
// Verification page -- not restated or rounded differently anywhere else. Held-out
// means these 7 storms (everything except the in-sample Amphan case) were never
// used to tune the detector's thresholds.
const H = DETECTION_SKILL.pooledHeldOut
const Q = QUIET_PERIODS.summary

const STATS = [
  {
    icon: Crosshair,
    value: `${Math.round(H.podWmo.pod * 100)}%`,
    label: 'Detection rate, held-out storms',
    sub: `${H.podWmo.hits}/${H.podWmo.steps} best-track steps caught across ${H.storms} storms never tuned on`,
  },
  {
    icon: Target,
    value: `${H.pminMedianKm.toFixed(0)} km`,
    label: 'Median position error',
    sub: `pressure-minimum vs IBTrACS best track, same ${H.storms} held-out storms`,
  },
  {
    icon: ShieldCheck,
    value: Q.objects,
    label: 'False alarms in quiet weather',
    sub: `${Q.windowsRun} windows, ${Q.daysRun} cyclone-free days, frozen detector`,
  },
  {
    icon: RadioTower,
    value: 'Daily',
    label: 'Live ensemble forecast',
    sub: '30-member NOAA GEFS v12, same detector, automated via GitHub Actions',
  },
]

export default function ImpactBanner() {
  return (
    <div className="rounded-card px-5 py-4 bg-brand/5 border border-brand/20">
      <div className="flex items-baseline justify-between flex-wrap gap-1 mb-3">
        <h3 className="font-bold text-ink text-[14.5px]">What this is already good for</h3>
        <span className="text-[10.5px] text-muted">from Verification · same numbers, not restated differently</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <div key={s.label}>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-brand/15 text-brand">
                <s.icon size={13} strokeWidth={2.2} />
              </span>
              <div className="text-[11.5px] text-muted leading-tight">{s.label}</div>
            </div>
            <div className="text-[24px] font-bold leading-none text-ink">{s.value}</div>
            <div className="text-[10.5px] text-muted mt-1.5 leading-snug">{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
