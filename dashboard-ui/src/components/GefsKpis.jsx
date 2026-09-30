import React from 'react'
import { Users, AlertTriangle, Target, Layers } from 'lucide-react'
import { GEFS_META, GEFS_SUMMARY } from '../data/gefsEnsemble'

export default function GefsKpis() {
  const s = GEFS_SUMMARY
  const cards = [
    {
      label: 'Members agreeing (peak)',
      icon: Users,
      value: `${s.peak_members_agreeing.members} / ${s.peak_members_agreeing.of}`,
      sub: `within 100 km of IBTrACS · T+${s.peak_members_agreeing.lead_h}h`,
    },
    {
      label: 'Severe-wind fraction (peak)',
      icon: AlertTriangle,
      value: `${Math.round(s.peak_severe_fraction.fraction * 100)}%`,
      sub: `members reaching IMD Severe gate · T+${s.peak_severe_fraction.lead_h}h`,
    },
    {
      label: 'Median track error',
      icon: Target,
      value: `${s.track_error_by_lead_time.median_km_all_members} km`,
      sub: `across all ${s.track_error_by_lead_time.n_members_validated} members, all lead times`,
    },
    {
      label: 'Ensemble size',
      icon: Layers,
      value: GEFS_META.nMembers,
      sub: `GEFSv12 members tracked · init ${GEFS_META.init.replace('T', ' ').slice(0, 16)}Z`,
    },
  ]
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="bg-card rounded-card px-5 py-4">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-brand/10 text-brand">
              <c.icon size={13} strokeWidth={2.2} />
            </span>
            <div className="text-[12px] text-muted">{c.label}</div>
          </div>
          <div className="text-[26px] font-bold leading-none text-brand">{c.value}</div>
          <div className="text-[11px] text-muted mt-2 leading-snug">{c.sub}</div>
        </div>
      ))}
    </div>
  )
}
