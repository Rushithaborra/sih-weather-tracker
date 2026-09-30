import React from 'react'
import TopBar from '../components/TopBar'
import { CASES } from '../data/cases'
import { ENSO } from '../data/enso'
import { useCase } from '../context/CaseContext'

export default function Verification() {
  const { mode } = useCase()
  return (
    <div className="space-y-4">
      <TopBar
        title="Verification"
        subtitle="What's actually been validated, vs. what's planned"
        forceMode={mode === 'gefs' ? 'validated' : mode}
      />

      <div className="bg-card rounded-card px-5 py-4">
        <h3 className="font-bold text-ink text-[14.5px] mb-1">Done: track error vs IBTrACS</h3>
        <p className="text-[12px] text-muted mb-3">
          Parameters chosen on Amphan (in-sample); every other storm is held out — run with the same frozen
          parameters, nothing adjusted. One ERA5 grid cell ≈ 28 km.
        </p>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-left text-muted border-b border-line">
              {['Case', 'ENSO phase (ONI)', 'Objects', 'Tracks', 'Matched steps', 'Pmin error: mean / median / min / max (km)', 'Centroid error: mean / median / min / max (km)'].map((h) => (
                <th key={h} className="py-2 pr-4 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.values(CASES).map((c) => (
              <tr key={c.id} className="border-b border-line">
                <td className="py-2 pr-4 text-ink font-medium">{c.label} {c.role === 'in-sample' ? '(in-sample)' : '(held out)'}</td>
                <td className="py-2 pr-4 text-ink whitespace-nowrap">
                  {ENSO[c.id] ? `${ENSO[c.id].phase.split(' (')[0]} (${ENSO[c.id].oni > 0 ? '+' : ''}${ENSO[c.id].oni})` : '—'}
                </td>
                <td className="py-2 pr-4 text-ink">{c.track.length}</td>
                <td className="py-2 pr-4 text-ink">{c.validation.nTracks ?? 1}</td>
                <td className="py-2 pr-4 text-ink">{c.validation.matchedSteps}</td>
                <td className="py-2 pr-4 text-ink">
                  {c.validation.pmin.meanKm} / {c.validation.pmin.medianKm} / {c.validation.pmin.minKm} / {c.validation.pmin.maxKm}
                </td>
                <td className="py-2 pr-4 text-ink">
                  {c.validation.centroid.meanKm} / {c.validation.centroid.medianKm} / {c.validation.centroid.minKm} / {c.validation.centroid.maxKm}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[11.5px] text-muted mt-3">
          Eight Bay of Bengal storms is still a small sample. The largest errors sit at the ends of tracks —
          Amphan's last three steps (near landfall) and Yaas's first three — as the pressure-minimum position
          degrades right at and after landfall and the wind-anomaly centroid drifts over the sea. Titli matches
          only 4 steps: ERA5 resolves it as a weaker, shorter-lived system than observed.
        </p>
        <p className="text-[11.5px] text-muted mt-2">
          <span className="font-semibold text-ink">ENSO phase</span> (NOAA ONI, per storm's formation month) is
          context, not a detection input — but the sample happens to span El Niño years (Hudhud, Titli, Fani,
          Bulbul), a strong La Niña year (Nivar) and neutral years (Phailin, Amphan, Yaas), and the same frozen
          detection rule (with each storm's own seasonal climatology) holds up across all of them without any
          ENSO-specific tuning.
        </p>
      </div>

      <div className="bg-card rounded-card px-5 py-4">
        <h3 className="font-bold text-ink text-[14.5px] mb-2">Planned, not yet implemented</h3>
        <ul className="text-[12.5px] text-ink space-y-2">
          <PlannedRow title="CRPS, rank histogram" desc="Needs an ensemble (NEPS-G); this pipeline currently tracks a single reanalysis member." />
          <PlannedRow title="POD / FAR / CSI at 5 km" desc="Grid-based hit/miss verification against 5 km truth — the 5 km layer here is a bilinear-interpolation placeholder, not model output." />
          <PlannedRow title="Baselines: bicubic + MSE U-Net" desc="Comparison downscaling baselines for the (not yet implemented) diffusion downscaler." />
          <PlannedRow title="Alert-tier validation against observed impacts" desc="Current tiers are z-score + IMD wind gates, set after observing results — not checked against real damage/impact reports." />
        </ul>
      </div>
    </div>
  )
}

function PlannedRow({ title, desc }) {
  return (
    <li className="flex gap-3">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
      <div>
        <span className="font-semibold text-ink">{title}</span>
        <span className="text-muted"> — {desc}</span>
      </div>
    </li>
  )
}
