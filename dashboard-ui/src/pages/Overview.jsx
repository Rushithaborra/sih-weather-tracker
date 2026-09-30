import React from 'react'
import TopBar from '../components/TopBar'
import KpiCards from '../components/KpiCards'
import GefsKpis from '../components/GefsKpis'
import GnnSphereConcept from '../components/GnnSphereConcept'
import { useCase } from '../context/CaseContext'
import { PIPELINE_META, CASES } from '../data/cases'
import { GEFS_META, GEFS_SUMMARY } from '../data/gefsEnsemble'
import { ENSO } from '../data/enso'

export default function Overview() {
  const { mode, data } = useCase()
  if (mode === 'gefs') {
    return (
      <div className="space-y-4">
        <TopBar title="Overview" gefsSubtitle="The real ensemble-forecast step of the roadmap, actually run" />
        <GefsKpis />
        <div className="bg-card rounded-card px-5 py-4">
          <h3 className="font-bold text-ink text-[14.5px] mb-2">What this closes from the roadmap</h3>
          <p className="text-[12.5px] text-muted leading-relaxed mb-3">
            The ERA5 pipeline tracks a single reanalysis member — the observed past, zero lead time. This run
            instead tracks a real <span className="font-semibold text-ink">30-member NOAA GEFSv12 ensemble
            forecast</span> (0.25°, same grid as the ERA5 climatology, no regridding) for Yaas, initialized{' '}
            {GEFS_META.init.replace('T', ' ').slice(0, 16)}Z — {'~'}5 days before landfall. Same detector, same
            tracker, same IBTrACS validation code as the ERA5 cases; only the input data source changed.
          </p>
          <p className="text-[12.5px] text-muted leading-relaxed">
            The numbers are honest, not tuned to look good: {GEFS_SUMMARY.track_error_by_lead_time.median_km_all_members} km
            median forecast error (vs {CASES.yaas.validation.pmin.medianKm} km for the zero-lead reanalysis case) is what
            real medium-range forecast error looks like, and {GEFS_SUMMARY.peak_members_agreeing.members}/
            {GEFS_SUMMARY.peak_members_agreeing.of} member agreement is a genuinely strict bar, not the deck's invented 19/23.
          </p>
        </div>
        <div className="bg-card rounded-card px-5 py-4">
          <h3 className="font-bold text-ink text-[14.5px] mb-2">Still not implemented</h3>
          <ol className="text-[12.5px] text-muted list-decimal list-inside space-y-1 mb-4">
            <li>GNN tracker on an icosahedral mesh — this still uses the classical connected-component + Hungarian tracker, just run once per member.</li>
            <li>Conditional diffusion downscaler — no 5 km output for the GEFS case yet.</li>
            <li>Ensemble EFI proper (vs a model's own reforecast climate) — the severe-fraction score here is a simpler, defensible stand-in.</li>
            <li>NEPS-G itself — GEFS was used as the open, no-credential-needed substitute.</li>
          </ol>
          <div className="pt-3 border-t border-line">
            <h4 className="font-semibold text-ink text-[12.5px] mb-2">Stage 1 · GNN on a sphere</h4>
            <GnnSphereConcept />
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-4">
      <TopBar title="Overview" subtitle="SIH 2026 · PS 26078 — AI-driven spatio-temporal tracking of extreme weather anomalies" />
      <KpiCards />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-card px-5 py-4">
          <h3 className="font-bold text-ink text-[14.5px] mb-2">What's actually running</h3>
          <p className="text-[12.5px] text-muted leading-relaxed mb-3">
            This is tracking of an <span className="font-semibold text-ink">observed event on reanalysis</span>,
            not a forecast — nothing here measures forecast skill. Detection, tracking and validation are
            implemented and run on {Object.keys(CASES).length} Bay of Bengal cyclones; the GNN tracker and diffusion downscaler below
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
        <div className="bg-card rounded-card px-5 py-4">
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
          {ENSO[data.id] && (
            <div className="mt-3 pt-3 border-t border-line">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted">ENSO phase at formation (NOAA ONI, {ENSO[data.id].season})</span>
                <span className="text-[11px] font-bold text-brand">{ENSO[data.id].oni > 0 ? '+' : ''}{ENSO[data.id].oni}</span>
              </div>
              <div className="text-[12px] font-semibold text-ink mt-0.5">{ENSO[data.id].phase}</div>
              <div className="text-[10.5px] text-muted mt-1 leading-snug">
                Context only — the detection/climatology pipeline does not condition on ENSO phase.
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="bg-card rounded-card px-5 py-4">
        <h3 className="font-bold text-ink text-[14.5px] mb-2">Roadmap</h3>
        <ol className="text-[12.5px] text-muted list-decimal list-inside space-y-1 mb-4">
          <li><span className="line-through opacity-70">Ensemble ingestion in place of single-member reanalysis.</span> Done, with NOAA GEFS
            standing in for NEPS-G — see <span className="font-semibold text-ink">GEFS forecast</span> mode (top bar).</li>
          <li>Ensemble EFI against the model's own reforecast climate (still simplified to a severe-wind fraction).</li>
          <li>GNN tracker on an icosahedral mesh per ensemble member — probabilistic 4D tracked boxes. Designed, not implemented.</li>
          <li>Conditional diffusion downscaler with a physics-informed loss — probabilistic ~5 km exceedance maps. Designed, not implemented.</li>
          <li>5 km truth data for training the downscaler (scarce for India — the main open risk).</li>
          <li>ENSO-conditioned climatology — our 8 cases already span El Niño, La Niña and neutral years
            (see the ENSO panel alongside), but splitting the ~115-sample-per-hour climatology further
            by ENSO phase would leave too few samples per bucket to be reliable; needs more years of data first.</li>
        </ol>
        <div className="pt-3 border-t border-line">
          <h4 className="font-semibold text-ink text-[12.5px] mb-2">Stage 1 · GNN on a sphere</h4>
          <GnnSphereConcept />
        </div>
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
    <div className="bg-bg rounded-lg px-3 py-2.5">
      <div className="text-[10.5px] text-muted">{label}</div>
      <div className="text-[16px] font-bold text-brand">{value}</div>
    </div>
  )
}
