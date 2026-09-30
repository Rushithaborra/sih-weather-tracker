import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import TopBar from '../components/TopBar'
import { useCase } from '../context/CaseContext'
import { ALERT_API_SAMPLE } from '../data/concept'

export default function AlertsApi() {
  const { mode, data } = useCase()
  const isConcept = mode === 'concept'

  const ex = !isConcept ? (data.alertSnapshot.examples.severe ?? data.alertSnapshot.examples.moderate) : null
  const tier = !isConcept && data.alertSnapshot.examples.severe ? 'SEVERE' : 'MODERATE'
  const sample = isConcept
    ? ALERT_API_SAMPLE
    : {
        case: data.id, time: data.alertSnapshot.time, variable: 'ws', tier, lat: ex.lat, lon: ex.lon,
        cell_deg: 0.25, z: ex.z, wind_ms: ex.windMs,
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
      <TopBar
        title="Alerts API"
        subtitle="Shape of the alert records the pipeline actually produces (this is the concept UI's read of a static export, not a live endpoint)"
        conceptSubtitle="Planned REST endpoint, from the pitch deck's technical approach — not yet built"
        forceMode={mode === 'gefs' ? 'validated' : mode}
      />
      <div className="bg-card rounded-card px-5 py-4">
        <div className="font-mono text-[12px] text-ink bg-bg rounded-lg px-4 py-2.5 mb-3">
          GET /v1/alerts?{isConcept ? `lat=${ALERT_API_SAMPLE.core[0]}&lon=${ALERT_API_SAMPLE.core[1]}` : `case=${data.id}&lat=${ex.lat}&lon=${ex.lon}`}
        </div>
        <p className="text-[12px] text-muted mb-3">
          {isConcept
            ? "There is no live endpoint yet — this is the exact sample response from the pitch deck's Technical Approach slide, showing the planned FastAPI alert service shape."
            : "There is no live endpoint yet — the real pipeline exports GeoJSON per timestep from the Streamlit app's download buttons. This is one record from that export, reshaped as JSON."}
        </p>
        <div className="relative">
          <pre className="text-[12px] bg-ink900 text-stone-100 rounded-lg px-4 py-3.5 overflow-x-auto"><code>{jsonStr}</code></pre>
          <button
            onClick={copy}
            className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white text-[11px] px-2.5 py-1 rounded-md transition-colors"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
      <div className="bg-card rounded-card px-5 py-4">
        <h3 className="font-bold text-ink text-[13.5px] mb-2">
          {isConcept ? 'What fields mean (planned service)' : 'What fields mean (from pipeline/alerts.py)'}
        </h3>
        <table className="w-full text-[12px]">
          <tbody>
            {isConcept ? (
              <>
                <FieldRow field="p_exceed_204mm" desc="probability the 23-member ensemble puts 24 h rain over IMD's 'extremely heavy' mark (204.5 mm) at the core" />
                <FieldRow field="level" desc="LOW / MODERATE / SEVERE — auto-ranked; SEVERE needs forecaster sign-off before CAP push" />
                <FieldRow field="radius_km" desc="alert zone radius around the pinpoint core, from the 5 km diffusion downscale" />
                <FieldRow field="cap" desc="path to the generated CAP XML for NDMA SACHET geo-targeted SMS" />
              </>
            ) : (
              <>
                <FieldRow field="tier" desc="none / low / moderate / severe — z-score AND an absolute IMD wind gate (8.7 / 17 / 25 m/s)" />
                <FieldRow field="z" desc="anomaly z-score vs the per-UTC-hour ERA5 climatology (single member, not an ensemble EFI)" />
                <FieldRow field="wind_ms" desc="10 m wind speed, m/s, at that cell and time" />
                <FieldRow field="cell_deg" desc="0.25° ERA5 grid cell — not a radius; there is no distance-based alert zone" />
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FieldRow({ field, desc }) {
  return (
    <tr className="border-b border-line">
      <td className="py-2 pr-4 font-mono text-brand whitespace-nowrap align-top">{field}</td>
      <td className="py-2 text-muted">{desc}</td>
    </tr>
  )
}
