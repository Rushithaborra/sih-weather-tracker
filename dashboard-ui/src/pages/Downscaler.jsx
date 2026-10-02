import React from 'react'
import TopBar from '../components/TopBar'
import { useCase } from '../context/CaseContext'

// Results are written by .github/workflows/downscaler.yml (scripts/downscale_train.py); until that
// file exists this page says so instead of showing any numbers.
const found = import.meta.glob('../data/downscaler.js', { eager: true })
const D = Object.values(found)[0]?.DOWNSCALER ?? null

const MODELS = [
  ['bilinear', 'Bilinear', 'no learning'],
  ['bicubic', 'Bicubic', 'no learning'],
  ['unet', 'U-Net (MSE)', 'learned'],
  ['unet_conserve', 'U-Net + conservation', 'learned + physics constraint'],
  ['diffusion_member', 'Diffusion, 1 member', 'generative'],
  ['diffusion_mean', 'Diffusion, 8-member mean', 'generative'],
]
const NAME = { amphan: 'Amphan', nivar: 'Nivar', yaas: 'Yaas', phailin: 'Phailin', hudhud: 'Hudhud' }

export default function Downscaler() {
  const { mode } = useCase()
  return (
    <div className="space-y-4">
      <TopBar
        title="Downscaler (Stage 2)"
        subtitle="Learned downscaling of coarse ERA5 rain (1.5°) to the IMD gauge grid (0.25°), tested against Indian gauge observations"
        forceMode={mode === 'gefs' ? 'validated' : mode}
      />
      {!D ? (
        <div className="bg-card rounded-card px-6 py-8 text-center text-[13px] text-muted">
          Results pending — the experiment runs on GitHub Actions and this page fills in when it finishes.
        </div>
      ) : <Results />}
    </div>
  )
}

function Results() {
  const T = D.test
  const best = (k, better) => MODELS.map(([m]) => T[m]?.[k]).filter((v) => v != null).reduce((a, b) => (better(b, a) ? b : a))
  const bestR = best('r', (a, b) => a > b), bestRmse = best('rmseMm', (a, b) => a < b)
  const csi = (m, k) => T[m]?.[k]?.csi
  const bestCsi = (k) => Math.max(...MODELS.map(([m]) => csi(m, k) ?? -1))
  const hl = (v, b) => (v === b ? 'font-bold text-brand' : 'text-ink')
  return (
    <>
      <div className="bg-card rounded-card px-5 py-4">
        <h3 className="font-bold text-ink text-[14.5px] mb-1">Test set: {D.testDays} days (2020–2021 and the Phailin / Hudhud windows), IMD land cells</h3>
        <p className="text-[12px] text-muted mb-3">
          Trained on {D.trainDays} days ({D.trainYears[0]}–{D.trainYears[D.trainYears.length - 1]}), model selection on {D.valDays} days
          (2018–2019); design and split fixed in DEV_LOG before training. Best value per column in bold.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left text-muted border-b border-line">
                {['Model', 'Type', 'RMSE (mm)', 'r', 'Bias (mm)', 'CSI ≥ 64.5', 'CSI ≥ 115.6', 'CSI ≥ 204.5', 'Cells ≥ 204.5 (IMD)', 'Storm peak kept'].map((h) => (
                  <th key={h} className="py-2 pr-4 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODELS.filter(([m]) => T[m]?.rmseMm != null).map(([m, label, type]) => (
                <tr key={m} className="border-b border-line">
                  <td className="py-2 pr-4 text-ink font-medium whitespace-nowrap">{label}</td>
                  <td className="py-2 pr-4 text-muted">{type}</td>
                  <td className={`py-2 pr-4 ${hl(T[m].rmseMm, bestRmse)}`}>{T[m].rmseMm}</td>
                  <td className={`py-2 pr-4 ${hl(T[m].r, bestR)}`}>{T[m].r}</td>
                  <td className="py-2 pr-4 text-ink">{T[m].biasMm}</td>
                  {['heavy', 'veryHeavy', 'extremelyHeavy'].map((k) => (
                    <td key={k} className={`py-2 pr-4 ${hl(csi(m, k), bestCsi(k))}`}>{csi(m, k) ?? '—'}</td>
                  ))}
                  <td className="py-2 pr-4 text-ink">{T[m].cellsGe204.model} ({T[m].cellsGe204.imd})</td>
                  <td className="py-2 pr-4 text-ink">{T[m].stormPeakKeptMedian == null ? '—' : `${Math.round(T[m].stormPeakKeptMedian * 100)}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {D.testSubset && <SubsetTable S={D.testSubset} />}

      <div className="bg-card rounded-card px-5 py-4">
        <h3 className="font-bold text-ink text-[14.5px] mb-2">Held-out storm days: maximum rain in the storm footprint (mm)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left text-muted border-b border-line">
                {['Storm', 'IMD day (ending 03 UTC)', 'IMD gauges', 'ERA5 0.25° native', ...MODELS.map(([, l]) => l), 'Diffusion members (range)'].map((h) => (
                  <th key={h} className="py-2 pr-3 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {D.storms.map((r) => (
                <tr key={r.storm + r.imdDay} className="border-b border-line">
                  <td className="py-2 pr-3 text-ink font-medium">{NAME[r.storm] ?? r.storm}</td>
                  <td className="py-2 pr-3 text-ink">{r.imdDay}</td>
                  <td className="py-2 pr-3 font-bold text-ink">{r.imdMaxMm}</td>
                  <td className="py-2 pr-3 text-ink">{r.era5NativeMaxMm ?? '—'}</td>
                  {MODELS.map(([m]) => <td key={m} className="py-2 pr-3 text-ink">{r[m] ?? '—'}</td>)}
                  <td className="py-2 pr-3 text-muted whitespace-nowrap">{r.diffusionMemberMaxMm ? `${Math.min(...r.diffusionMemberMaxMm)}–${Math.max(...r.diffusionMemberMaxMm)}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {D.maps?.length > 0 && (
        <div className="bg-card rounded-card px-5 py-4">
          <h3 className="font-bold text-ink text-[14.5px] mb-2">Storm landfall days, side by side</h3>
          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
            {D.maps.map((f) => (
              <img key={f} src={`${import.meta.env.BASE_URL}downscaler/${f}`} alt={f} className="w-full rounded-lg border border-line bg-white" loading="lazy" />
            ))}
          </div>
        </div>
      )}

      <div className="bg-card rounded-card px-5 py-4 text-[12px] text-muted leading-relaxed space-y-1.5">
        <div><span className="font-semibold text-ink">What this is:</span> a proxy for the designed 12 km → 5 km diffusion downscaler. The truth
          here is IMD's 0.25° gauge grid (land only), not 5 km, and the input is ERA5 at 1.5° (6× coarser), so it tests whether a learned
          model recovers the rain peaks coarse data smooths away.</div>
        <div><span className="font-semibold text-ink">Physics constraint:</span> "U-Net + conservation" rescales each 1.5° block to the input's
          mean rain, so the downscaler redistributes rain without creating or removing it.</div>
        <div><span className="font-semibold text-ink">Run:</span> U-Net trained on GitHub Actions CPUs ({D.settings?.epochs} epochs); the diffusion
          model trained on an Apple M3 GPU reusing that U-Net ({D.settings?.epochs} epochs, {D.settings?.members} members,
          {` ${D.settings?.ddimSteps}`} sampling steps). The deterministic results reproduce exactly on both machines.</div>
      </div>
    </>
  )
}

function SubsetTable({ S }) {
  const rows = MODELS.filter(([m]) => S[m])
  const csiBest = (k) => Math.max(...rows.map(([m]) => S[m][k].csi ?? -1))
  const peakBest = Math.max(...rows.map(([m]) => S[m].stormPeakKeptMedian ?? -1))
  return (
    <div className="bg-card rounded-card px-5 py-4">
      <h3 className="font-bold text-ink text-[14.5px] mb-1">All six models on the same {S.days} days (held-out storm days + 100 random test days)</h3>
      <p className="text-[12px] text-muted mb-3">Diffusion sampling is expensive, so every model is scored on this same subset for a like-for-like comparison.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-left text-muted border-b border-line">
              {['Model', 'RMSE (mm)', 'r', 'CSI ≥ 64.5', 'CSI ≥ 115.6', 'CSI ≥ 204.5', 'Cells ≥ 204.5 (IMD)', 'Storm peak kept'].map((h) => (
                <th key={h} className="py-2 pr-4 font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([m, label]) => {
              const peak = S[m].stormPeakKeptMedian ?? D.test[m]?.stormPeakKeptMedian
              return (
                <tr key={m} className="border-b border-line">
                  <td className="py-2 pr-4 text-ink font-medium whitespace-nowrap">{label}</td>
                  <td className="py-2 pr-4 text-ink">{S[m].rmseMm}</td>
                  <td className="py-2 pr-4 text-ink">{S[m].r}</td>
                  {['heavy', 'veryHeavy', 'extremelyHeavy'].map((k) => (
                    <td key={k} className={`py-2 pr-4 ${S[m][k].csi === csiBest(k) ? 'font-bold text-brand' : 'text-ink'}`}>{S[m][k].csi ?? '—'}</td>
                  ))}
                  <td className="py-2 pr-4 text-ink">{S[m].cellsGe204.model} ({S[m].cellsGe204.imd})</td>
                  <td className={`py-2 pr-4 ${peak === peakBest ? 'font-bold text-brand' : 'text-ink'}`}>{peak == null ? '—' : `${Math.round(peak * 100)}%`}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <ul className="text-[11.5px] text-muted mt-3 space-y-1.5 list-disc pl-4">
        <li>The plain MSE U-Net has the best correlation but the weakest peaks — the smoothing that MSE-trained models are known for.</li>
        <li>The mass-conservation constraint gives the best placement of heavy rain (highest CSI at every threshold).</li>
        <li>
          A single diffusion member keeps realistic storm peaks ({Math.round((S.diffusion_member.stormPeakKeptMedian ?? 0) * 100)}% of the observed
          maximum, and {S.diffusion_member.cellsGe204.model} extremely heavy cells vs {S.diffusion_member.cellsGe204.imd} observed) but places them less
          precisely, so CSI and RMSE are worse; some members overshoot. Averaging the members smooths the peaks away again — the ensemble's value is
          in its spread (exceedance probabilities), which still needs calibration.
        </li>
      </ul>
    </div>
  )
}
