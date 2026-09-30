import React from 'react'
import TopBar from '../components/TopBar'
import { CASES } from '../data/cases'
import { VALIDATION_PLAN } from '../data/concept'
import { useCase } from '../context/CaseContext'

export default function Verification() {
  const { mode } = useCase()
  if (mode === 'concept') {
    return (
      <div className="space-y-4">
        <TopBar
          title="Verification"
          conceptSubtitle="How we will validate — from the pitch deck's Research and References slide"
        />
        <div className="bg-card rounded-card px-5 py-4">
          <h3 className="font-bold text-ink text-[14.5px] mb-3">Validation plan</h3>
          <ul className="text-[12.5px] text-ink space-y-2.5">
            {VALIDATION_PLAN.map((v) => (
              <li key={v.label} className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 shrink-0" />
                <div>
                  <span className="font-semibold text-ink">{v.label}</span>
                  <span className="text-muted"> — {v.desc}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-card rounded-card px-5 py-4">
          <h3 className="font-bold text-ink text-[14.5px] mb-2">Already proven on real data</h3>
          <p className="text-[12.5px] text-muted leading-relaxed">
            Switch to <span className="font-semibold text-ink">Validated results</span> mode (top bar) to see
            actual track-error numbers against IBTrACS for Amphan 2020 and the held-out Yaas 2021 — the tracking
            half of this validation plan is already implemented and run, not just planned.
          </p>
        </div>
      </div>
    )
  }
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
          Track position chosen on Amphan (in-sample), confirmed on Yaas (held out, nothing adjusted). One ERA5
          grid cell ≈ 28 km.
        </p>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-left text-muted border-b border-line">
              {['Case', 'Objects', 'Tracks', 'Matched steps', 'Pmin error: mean / median / min / max (km)', 'Centroid error: mean / median / min / max (km)'].map((h) => (
                <th key={h} className="py-2 pr-4 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.values(CASES).map((c) => (
              <tr key={c.id} className="border-b border-line">
                <td className="py-2 pr-4 text-ink font-medium">{c.label} {c.role === 'in-sample' ? '(in-sample)' : '(held out)'}</td>
                <td className="py-2 pr-4 text-ink">{c.track.length}</td>
                <td className="py-2 pr-4 text-ink">1</td>
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
          Two cases is a small sample. Amphan's last three steps (near landfall) and Yaas's first three steps
          have the largest errors — the pressure-minimum position degrades right at and after landfall, as the
          wind-anomaly centroid drifts over the sea.
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
