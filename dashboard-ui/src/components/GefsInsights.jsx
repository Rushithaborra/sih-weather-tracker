import React from 'react'
import { useCase } from '../context/CaseContext'
import { GEFS_AGREEMENT, GEFS_SEVERE_FRACTION, GEFS_MEMBERS } from '../data/gefsEnsemble'

function Sparkline({ points, valueKey, max, color, format }) {
  const w = 280, h = 56, pad = 4
  const xs = points.map((p) => p.leadH)
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const xAt = (x) => pad + ((x - minX) / (maxX - minX)) * (w - 2 * pad)
  const yAt = (v) => h - pad - (v / max) * (h - 2 * pad)
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(p.leadH).toFixed(1)} ${yAt(p[valueKey]).toFixed(1)}`).join(' ')
  const peak = points.reduce((a, b) => (b[valueKey] > a[valueKey] ? b : a), points[0])
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-14">
      <path d={path} fill="none" stroke={color} strokeWidth="2" />
      <circle cx={xAt(peak.leadH)} cy={yAt(peak[valueKey])} r="3" fill={color} />
      <text x={xAt(peak.leadH)} y={yAt(peak[valueKey]) - 6} fontSize="9" fill={color} textAnchor="middle" fontWeight="700">
        {format(peak[valueKey])}
      </text>
    </svg>
  )
}

export default function GefsInsights() {
  const { gefsLeadH } = useCase()
  const sorted = [...GEFS_MEMBERS].sort((a, b) => a.validation.medianKm - b.validation.medianKm)
  const best = sorted[0], worst = sorted[sorted.length - 1]

  return (
    <div className="bg-card rounded-card px-5 py-4 space-y-4">
      <div className="flex items-baseline justify-between">
        <h3 className="font-bold text-ink text-[14.5px]">Ensemble signal over lead time</h3>
        <span className="text-[10.5px] text-muted">real, computed per member</span>
      </div>

      <div>
        <div className="text-[11.5px] font-semibold text-ink mb-1">Members agreeing (within 100 km of truth)</div>
        <Sparkline points={GEFS_AGREEMENT} valueKey="membersAgreeing" max={10} color="#1D72B8" format={(v) => `${v}`} />
      </div>

      <div>
        <div className="text-[11.5px] font-semibold text-ink mb-1">Fraction of members forecasting Severe winds</div>
        <Sparkline points={GEFS_SEVERE_FRACTION} valueKey="fraction" max={1} color="#C0392B" format={(v) => `${Math.round(v * 100)}%`} />
      </div>

      <div className="pt-1 border-t border-line">
        <div className="text-[11.5px] font-semibold text-ink mb-1.5">Member spread (track error, median km)</div>
        <div className="flex justify-between text-[11.5px]">
          <span className="text-ink">Best: <span className="font-semibold text-brand">{best.id}</span> — {best.validation.medianKm} km</span>
          <span className="text-ink">Worst: <span className="font-semibold text-red-600">{worst.id}</span> — {worst.validation.medianKm} km</span>
        </div>
        <div className="text-[10.5px] text-muted mt-1.5 leading-snug">
          30 independently perturbed forecasts of the same storm, same init time — this spread is the real
          signal an ensemble is supposed to capture, not noise. Currently viewing T+{gefsLeadH}h on the map.
        </div>
      </div>
    </div>
  )
}
