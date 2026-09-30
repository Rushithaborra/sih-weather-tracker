import React from 'react'
import TopBar from '../components/TopBar'
import KpiCards from '../components/KpiCards'
import ConceptKpis from '../components/ConceptKpis'
import { useCase } from '../context/CaseContext'
import { PIPELINE_META } from '../data/cases'

const PIPELINE_STEPS = [
  { label: '4D ensemble ingest', desc: 'NEPS-G 12 km, 23 members + NCUM · ERA5 / IMDAA 30-yr climate' },
  { label: 'Spherical icosahedral mesh', desc: 'Lat–lon grid → icosahedral graph: no polar or map-edge distortion' },
  { label: 'Stage 1 — GNN anomaly tracker', desc: 'EFI vs 30-yr ERA5 baseline → 4D bounding box + 3–10 day track' },
  { label: 'Stage 2 — Conditional diffusion downscaler', desc: '12 km crop → 5 km scenarios, terrain-aware, extreme peaks kept' },
  { label: 'Physics-informed guardrails', desc: 'Moisture-convergence, mass & energy penalties in the loss' },
  { label: 'Dashboard + Alerting REST API', desc: 'Pinpoint core · Low / Moderate / Severe within a 5 km radius' },
]

const UNIQUE = [
  { title: 'Peaks kept, not averaged', desc: 'generative diffusion preserves extreme rain and wind that CNN/U-Nets blur' },
  { title: 'Globe-true tracking', desc: 'an icosahedral GNN follows storms across the sphere with no map-edge or polar distortion' },
  { title: 'Threat-first compute', desc: 'only flagged boxes are downscaled, so live inference fits on one cloud GPU' },
  { title: 'Probabilistic & physics-checked', desc: '23-member probabilities plus conservation penalties, not a single guess' },
]

export default function Overview() {
  const { mode, data } = useCase()
  if (mode === 'concept') {
    return (
      <div className="space-y-4">
        <TopBar title="Overview" conceptSubtitle="SIH 2026 · PS 26078 — two-stage hybrid AI: track globally on a sphere, sharpen locally to 5 km" />
        <ConceptKpis />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-card px-5 py-4">
            <h3 className="font-bold text-ink text-[14.5px] mb-3">Proposed solution</h3>
            <ol className="text-[12.5px] space-y-2.5">
              {PIPELINE_STEPS.map((s, i) => (
                <li key={s.label} className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-teal/10 text-teal text-[10.5px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <div>
                    <span className="font-semibold text-ink">{s.label}</span>
                    <div className="text-muted">{s.desc}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="bg-white rounded-card px-5 py-4">
            <h3 className="font-bold text-ink text-[14.5px] mb-3">What makes our solution unique</h3>
            <ul className="text-[12.5px] space-y-2.5">
              {UNIQUE.map((u) => (
                <li key={u.title} className="flex gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal mt-1.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-ink">{u.title}:</span>{' '}
                    <span className="text-muted">{u.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="bg-white rounded-card px-5 py-4">
          <p className="text-[12.5px] text-muted leading-relaxed">
            Switch to <span className="font-semibold text-ink">Validated results</span> mode (top bar) to see the
            part of this pipeline that's already built and run on real data — ERA5 tracking and IBTrACS
            validation for Amphan 2020 and Yaas 2021.
          </p>
        </div>
      </div>
    )
  }
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
