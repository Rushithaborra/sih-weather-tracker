import React from 'react'
import TopBar from '../components/TopBar'
import KpiCards from '../components/KpiCards'
import { useCase } from '../context/CaseContext'
import { PIPELINE_META } from '../data/cases'

export default function Overview() {
  const { data } = useCase()
  return (
    <div className="space-y-4">
      <TopBar title="Overview" subtitle="SIH 2026 · PS 26078 — AI-driven spatio-temporal tracking of extreme weather anomalies" />
      <KpiCards />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-card px-5 py-4">
          <h3 className="font-bold text-ink text-[14.5px] mb-2">What's actually running</h3>
          <p className="text-[12.5px] text-muted leading-relaxed mb-3">
            This is tracking of an <span className="font-semibold text-ink">observed event on reanalysis</span>,
            not a forecast — nothing here measures forecast skill. Detection, tracking and validation are
            implemented and run on two Bay of Bengal cyclones; the GNN tracker and diffusion downscaler below
            are designed, not implemented.
          </p>
          <ul className="text-[12px] text-ink space-y-1.5">
            <MetaRow label="Field data" value={PIPELINE_META.source} />
            <MetaRow label="Ground truth" value={PIPELINE_META.bestTrack} />
            <MetaRow label="Climatology" value={PIPELINE_META.climatology} />
            <MetaRow label="Detection rule" value={PIPELINE_META.detection} />
            <MetaRow label="Tracking" value={PIPELINE_META.tracking} />
          </ul>
        </div>
        <div className="bg-white rounded-card px-5 py-4">
          <h3 className="font-bold text-ink text-[14.5px] mb-2">Current case: {data.label}</h3>
          <p className="text-[12.5px] text-muted leading-relaxed mb-3">
            <span className="font-semibold text-ink capitalize">{data.role}.</span> {data.roleNote}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Objects detected" value={data.track.length} />
            <Stat label="Matched validation steps" value={data.validation.matchedSteps} />
            <Stat label="Median track error" value={`${data.validation.pmin.medianKm.toFixed(1)} km`} />
            <Stat label="Peak wind (ERA5)" value={`${data.peak.maxWs.toFixed(1)} m/s`} />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-card px-5 py-4">
        <h3 className="font-bold text-ink text-[14.5px] mb-2">Roadmap (designed, not implemented)</h3>
        <ol className="text-[12.5px] text-muted list-decimal list-inside space-y-1">
          <li>NEPS-G ensemble ingestion in place of single-member reanalysis.</li>
          <li>Ensemble EFI against NEPS-G's own reforecast climate.</li>
          <li>GNN tracker on an icosahedral mesh per ensemble member — probabilistic 4D tracked boxes.</li>
          <li>Conditional diffusion downscaler with a physics-informed loss — probabilistic ~5 km exceedance maps.</li>
          <li>5 km truth data for training the downscaler (scarce for India — the main open risk).</li>
        </ol>
      </div>
    </div>
  )
}

function MetaRow({ label, value }) {
  return (
    <li className="flex gap-2">
      <span className="text-muted shrink-0 w-[110px]">{label}</span>
      <span className="text-ink">{value}</span>
    </li>
  )
}

function Stat({ label, value }) {
  return (
    <div className="bg-pagebg rounded-lg px-3 py-2.5">
      <div className="text-[10.5px] text-muted">{label}</div>
      <div className="text-[16px] font-bold text-teal">{value}</div>
    </div>
  )
}
