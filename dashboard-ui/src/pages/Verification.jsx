import React from 'react'
import TopBar from '../components/TopBar'
import { CASES } from '../data/cases'
import { ENSO } from '../data/enso'
import { DETECTION_SKILL } from '../data/detectionSkill'
import { QUIET_PERIODS } from '../data/quietPeriods'
import { RAINFALL_VS_IMD } from '../data/rainfallVsImd'
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

      <DetectionSkill />

      <QuietPeriods />

      <RainfallVsImd />

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

const pct = (x) => (x == null ? '—' : `${Math.round(x * 100)}%`)

function DetectionSkill() {
  const { cases, pooledHeldOut: P } = DETECTION_SKILL
  const label = (id) => CASES[id]?.label ?? id
  const miss = P.missesByStageWmo
  return (
    <div className="bg-card rounded-card px-5 py-4">
      <h3 className="font-bold text-ink text-[14.5px] mb-1">Done: detection skill — hits, misses, objects outside the storm</h3>
      <p className="text-[12px] text-muted mb-3">
        Best-track steps: IBTrACS at 00/06/12/18 UTC inside each case window and the 5–30°N, 75–100°E region, with
        wind ≥ 34 kt. A hit is any detected object whose pressure minimum is within 300 km. POD uses WMO wind
        (IMD, 3-min sustained); JTWC 1-min in brackets.
      </p>
      <table className="w-full text-[12px]">
        <thead>
          <tr className="text-left text-muted border-b border-line">
            {['Case', 'In climatology years?', 'POD, WMO (JTWC)', 'Hits / steps', 'Objects outside the storm (300 / 200 km)', 'Pmin median (km)', 'Centroid median (km)'].map((h) => (
              <th key={h} className="py-2 pr-4 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => (
            <tr key={c.case} className="border-b border-line">
              <td className="py-2 pr-4 text-ink font-medium">{label(c.case)} ({c.role})</td>
              <td className="py-2 pr-4 text-ink">{c.inClimatology ? `yes (${c.climYears})` : 'no'}</td>
              <td className="py-2 pr-4 text-ink">{pct(c.podWmo.pod)} ({pct(c.podUsa.pod)})</td>
              <td className="py-2 pr-4 text-ink">{c.podWmo.hits} / {c.podWmo.steps}</td>
              <td className="py-2 pr-4 text-ink">{c.falseAlarms} / {c.falseAlarms200km}</td>
              <td className="py-2 pr-4 text-ink">{c.pminMedianKm}</td>
              <td className="py-2 pr-4 text-ink">{c.centroidMedianKm}</td>
            </tr>
          ))}
          <tr className="font-semibold">
            <td className="py-2 pr-4 text-ink">Pooled, {P.storms} held-out storms</td>
            <td className="py-2 pr-4 text-ink">{P.inClimatology.length} of {P.storms}</td>
            <td className="py-2 pr-4 text-ink">{pct(P.podWmo.pod)} ({pct(P.podUsa.pod)})</td>
            <td className="py-2 pr-4 text-ink">{P.podWmo.hits} / {P.podWmo.steps}</td>
            <td className="py-2 pr-4 text-ink">{P.falseAlarms} / {P.falseAlarms200km}</td>
            <td className="py-2 pr-4 text-ink">{P.pminMedianKm} (mean {P.pminMeanKm})</td>
            <td className="py-2 pr-4 text-ink">{P.centroidMedianKm} (mean {P.centroidMeanKm})</td>
          </tr>
          <tr className="border-t border-line">
            <td className="py-2 pr-4 text-ink font-semibold">Fragmented tracks</td>
            <td className="py-2 pr-4 text-ink">{P.fragmentedStorms.length} of {P.storms} storms</td>
            <td className="py-2 pr-4 text-muted" colSpan={5}>
              {cases.filter((c) => c.fragmentKm.length).map((c) => `${label(c.case).split(',')[0]} ${c.fragmentKm.join(', ')} km`).join(' · ')}
              {' '}— extra-track objects' distance from the best track
            </td>
          </tr>
        </tbody>
      </table>
      <ul className="text-[11.5px] text-muted mt-3 space-y-1.5 list-disc pl-4">
        <li>
          Pooled over all {P.matchedSteps} matched steps, the median pressure-minimum error is {P.pminMedianKm} km — on the
          order of one ERA5 grid cell (~28 km).
        </li>
        <li>
          Of {miss.before + miss.during + miss.after} missed steps, {miss.before} fall before the first detection (the
          early 35–55 kt stage, where ERA5's analysed wind hasn't yet reached the 17 m/s gate), {miss.after} after the
          last (decay over land) and {miss.during} mid-life. Titli (40%) and Fani (64%) are the weakest.
        </li>
        <li>
          {P.inClimatology.length} of {P.storms} held-out storms ({P.inClimatology.map(label).join(', ')}) fall within the
          2015–2019 climatology they are compared against; a storm inside its own baseline raises the mean and spread,
          which is expected to make detection harder, not easier.
        </li>
        <li>
          No objects outside the storm within the case windows (300 km); {P.falseAlarms200km} at 200 km (the two
          single-step Yaas objects). Cyclone-free periods: see the quiet-period test below.
        </li>
        <li>
          POD counts {P.podWmo.hits} hit steps and the error uses {P.matchedSteps}: a hit is any detected object, fragments
          included, within 300 km of a ≥ 34 kt best-track step, while the error uses only the main track's steps inside
          the best-track period at any wind speed (Hudhud and Bulbul gain 3 hits from fragments; Yaas has 2 error steps
          below 34 kt).
        </li>
      </ul>
    </div>
  )
}

function QuietPeriods() {
  const { windows, summary: S } = QUIET_PERIODS
  const run = windows.filter((w) => w.start)
  const skipped = windows.filter((w) => !w.start)
  return (
    <div className="bg-card rounded-card px-5 py-4">
      <h3 className="font-bold text-ink text-[14.5px] mb-1">Done: quiet-period test — detections with no cyclone present</h3>
      <p className="text-[12px] text-muted mb-3">
        {run.length} windows of 10 days in 2020–2022, declared before running (DEV_LOG). Quiet = no IBTrACS system in
        5–30°N, 75–100°E within the window ± 2 days. ERA5, anomalies against the 2010–2019 month/hour climatology,
        frozen detector.
      </p>
      <table className="w-full text-[12px]">
        <thead>
          <tr className="text-left text-muted border-b border-line">
            {['Window', 'Month', 'Objects (tracks)', 'Strongest wind in region (m/s)', 'Without the 17 m/s gate: objects (tracks), over land'].map((h) => (
              <th key={h} className="py-2 pr-4 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {run.map((w) => (
            <tr key={w.id} className="border-b border-line">
              <td className="py-2 pr-4 text-ink">{w.start} → {w.end}{w.swaps.length ? ` (swapped ×${w.swaps.length})` : ''}</td>
              <td className="py-2 pr-4 text-ink">{w.month}</td>
              <td className="py-2 pr-4 text-ink">{w.objects} ({w.tracks})</td>
              <td className="py-2 pr-4 text-ink">{w.domainMaxWs}</td>
              <td className="py-2 pr-4 text-ink">{w.noWindGate.objects} ({w.noWindGate.tracks}), {w.noWindGate.landObjects} over land</td>
            </tr>
          ))}
          <tr className="font-semibold">
            <td className="py-2 pr-4 text-ink">All, {S.daysRun} days</td>
            <td className="py-2 pr-4 text-ink" />
            <td className="py-2 pr-4 text-ink">{S.objects} ({S.tracks})</td>
            <td className="py-2 pr-4 text-ink" />
            <td className="py-2 pr-4 text-ink">{S.noWindGateDiagnostic.objects} ({S.noWindGateDiagnostic.tracks}), {S.noWindGateDiagnostic.landObjects} over land</td>
          </tr>
        </tbody>
      </table>
      <ul className="text-[11.5px] text-muted mt-3 space-y-1.5 list-disc pl-4">
        <li>
          {S.objects} false objects in {S.daysRun} cyclone-free days. The regional wind never reached the 17 m/s gate in
          any window, so the gate alone rules everything out: without it, the same z-score rule would flag{' '}
          {S.noWindGateDiagnostic.tracks} tracks ({(S.noWindGateDiagnostic.tracks / run.length).toFixed(1)} per 10 days). The
          gate, not the z-score threshold, is what suppresses false alarms in quiet weather.
        </li>
        <li>
          July/August: {run.filter((w) => w.monsoonSeason).reduce((a, w) => a + w.objects, 0)} objects with the gate;
          without it, {run.filter((w) => w.monsoonSeason).reduce((a, w) => a + w.noWindGate.objects, 0)} objects, mostly over
          land. These may be monsoon lows, which IBTrACS does not list, so they are not verified either way.
        </li>
        {skipped.map((w) => (
          <li key={w.id}>
            {w.id} ({w.declared.slice(0, 7)}): no quiet window under the declared swap rule — March 2022 had two IBTrACS
            depressions (3–6 and 20–23 March).
          </li>
        ))}
      </ul>
    </div>
  )
}

function RainfallVsImd() {
  const { rows, pooled: P } = RAINFALL_VS_IMD
  const label = (id) => (CASES[id]?.label ?? id).split(',')[0]
  const done = rows.filter((r) => r.r != null)
  const missing = [...new Set(rows.filter((r) => r.r == null).map((r) => label(r.storm)))]
  const ext = P.cellsAtOrAbove.extremelyHeavy
  const cats = [['heavy', '≥ 64.5'], ['veryHeavy', '≥ 115.6'], ['extremelyHeavy', '≥ 204.5']]
  return (
    <div className="bg-card rounded-card px-5 py-4">
      <h3 className="font-bold text-ink text-[14.5px] mb-1">Done: rainfall vs IMD observations — how much of the peak ERA5 keeps</h3>
      <p className="text-[12px] text-muted mb-3">
        IMD 0.25° daily gridded rainfall (gauge-based) against ERA5 hourly rain summed over the same IMD day
        (03–03 UTC), on IMD land cells inside each storm's track box + 1°, for the landfall day and the day after.
      </p>
      <table className="w-full text-[12px]">
        <thead>
          <tr className="text-left text-muted border-b border-line">
            {['Storm', 'IMD day (ending 03 UTC)', 'IMD max (mm)', 'ERA5 max (mm)', 'Peak kept', 'Correlation r', 'Bias (mm)'].map((h) => (
              <th key={h} className="py-2 pr-4 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {done.map((r) => (
            <tr key={r.storm + r.imdDay} className="border-b border-line">
              <td className="py-2 pr-4 text-ink font-medium">{label(r.storm)}</td>
              <td className="py-2 pr-4 text-ink">{r.imdDay}</td>
              <td className="py-2 pr-4 text-ink">{r.imdMaxMm}</td>
              <td className="py-2 pr-4 text-ink">{r.era5MaxMm}</td>
              <td className="py-2 pr-4 text-ink">{r.peakRetention == null ? 'n/a (IMD max < 64.5 mm)' : `${Math.round(r.peakRetention * 100)}%`}</td>
              <td className="py-2 pr-4 text-ink">{r.r}</td>
              <td className="py-2 pr-4 text-ink">{r.biasMm}</td>
            </tr>
          ))}
          <tr className="font-semibold">
            <td className="py-2 pr-4 text-ink">Pooled, {P.storms} storms</td>
            <td className="py-2 pr-4 text-ink">{P.stormDays} storm-days</td>
            <td className="py-2 pr-4 text-ink" colSpan={2}>{P.cells} land cells</td>
            <td className="py-2 pr-4 text-ink">median {Math.round(P.peakRetentionMedian * 100)}% ({P.peakRetentionDays} days)</td>
            <td className="py-2 pr-4 text-ink">{P.r}</td>
            <td className="py-2 pr-4 text-ink">{P.biasMm}</td>
          </tr>
        </tbody>
      </table>
      <div className="flex gap-6 flex-wrap mt-3 text-[12px]">
        {cats.map(([k, t]) => (
          <div key={k} className="bg-bg rounded-lg px-3 py-2">
            <div className="text-[10.5px] text-muted">Cells {t} mm (IMD vs ERA5)</div>
            <div className="font-bold text-brand tabular-nums">{P.cellsAtOrAbove[k].imd} vs {P.cellsAtOrAbove[k].era5}</div>
          </div>
        ))}
      </div>
      <ul className="text-[11.5px] text-muted mt-3 space-y-1.5 list-disc pl-4">
        <li>
          ERA5 places the rain well (pooled r = {P.r}) and the average is close (bias {P.biasMm} mm), but it keeps a median
          of {Math.round(P.peakRetentionMedian * 100)}% of the observed peak and only {Math.round((100 * ext.era5) / ext.imd)}% of
          the extremely heavy area ({ext.era5} of {ext.imd} cells ≥ 204.5 mm) — the smoothing problem a downscaler has to fix.
          Peak kept is computed only where IMD's maximum reaches heavy (64.5 mm).
        </li>
        {done.some((r) => r.peakRetention != null && r.peakRetention < 0.25) && (
          <li>
            Lowest: {done.filter((r) => r.peakRetention != null && r.peakRetention < 0.25).map((r) => `${label(r.storm)} ${r.imdDay} (${Math.round(r.peakRetention * 100)}%)`).join(', ')} —
            all the day after landfall, when the storm is decaying inland; ERA5 dries out faster than the gauges there.
          </li>
        )}
        {missing.length > 0 && (
          <li>Not yet compared: {missing.join(', ')} — the IMD server dropped those year files before the needed days arrived.</li>
        )}
      </ul>
    </div>
  )
}
