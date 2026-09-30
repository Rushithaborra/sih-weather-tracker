import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import TopBar from '../components/TopBar'
import { useCase } from '../context/CaseContext'

export default function AlertsApi() {
  const { data } = useCase()
  const ex = data.alertSnapshot.examples.severe ?? data.alertSnapshot.examples.moderate
  const tier = data.alertSnapshot.examples.severe ? 'SEVERE' : 'MODERATE'
  const sample = {
    case: data.id,
    time: data.alertSnapshot.time,
    variable: 'ws',
    tier,
    lat: ex.lat,
    lon: ex.lon,
    cell_deg: 0.25,
    z: ex.z,
    wind_ms: ex.windMs,
    tiers_note: 'z-score AND IMD wind gate, inside tracked-object boxes + 1 deg',
    geojson: `/${data.id}_alerts_sample.geojson`,
  }
  const jsonStr = JSON.stringify(sample, null, 2)
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(jsonStr)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="space-y-4">
      <TopBar title="Alerts API" subtitle="Shape of the alert records the pipeline actually produces (this is the concept UI's read of a static export, not a live endpoint)" />
      <div className="bg-white rounded-card px-5 py-4">
        <div className="font-mono text-[12px] text-ink bg-pagebg rounded-lg px-4 py-2.5 mb-3">
          GET /v1/alerts?case={data.id}&lat={ex.lat}&lon={ex.lon}
        </div>
        <p className="text-[12px] text-muted mb-3">
          There is no live endpoint yet — the real pipeline exports GeoJSON per timestep from the Streamlit app's
          download buttons. This is one record from that export, reshaped as JSON.
        </p>
        <div className="relative">
          <pre className="text-[12px] bg-navy text-slate-100 rounded-lg px-4 py-3.5 overflow-x-auto"><code>{jsonStr}</code></pre>
          <button
            onClick={copy}
            className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white text-[11px] px-2.5 py-1 rounded-md transition-colors"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
      <div className="bg-white rounded-card px-5 py-4">
        <h3 className="font-bold text-ink text-[13.5px] mb-2">What fields mean (from pipeline/alerts.py)</h3>
        <table className="w-full text-[12px]">
          <tbody>
            <FieldRow field="tier" desc="none / low / moderate / severe — z-score AND an absolute IMD wind gate (8.7 / 17 / 25 m/s)" />
            <FieldRow field="z" desc="anomaly z-score vs the per-UTC-hour ERA5 climatology (single member, not an ensemble EFI)" />
            <FieldRow field="wind_ms" desc="10 m wind speed, m/s, at that cell and time" />
            <FieldRow field="cell_deg" desc="0.25° ERA5 grid cell — not a radius; there is no distance-based alert zone" />
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FieldRow({ field, desc }) {
  return (
    <tr className="border-b border-slate-50">
      <td className="py-2 pr-4 font-mono text-teal whitespace-nowrap align-top">{field}</td>
      <td className="py-2 text-muted">{desc}</td>
    </tr>
  )
}
