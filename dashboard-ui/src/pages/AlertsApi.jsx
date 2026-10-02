import React, { useState } from 'react'
import { Copy, Check, Play, Loader2 } from 'lucide-react'
import TopBar from '../components/TopBar'
import { useCase } from '../context/CaseContext'

export default function AlertsApi() {
  const { mode, data } = useCase()
  const ex = data.alertSnapshot.examples.severe ?? data.alertSnapshot.examples.moderate
  const endpoints = [
    { path: `/api/alerts?case=${data.id}&lat=${ex.lat}&lon=${ex.lon}`, desc: 'Alert tier of the 0.25° cell at a point for this case, plus the nearest severe / moderate / low cell.' },
    { path: `/api/alerts?case=${data.id}`, desc: 'Counts per tier and the 10 strongest cells. Add &format=geojson for the full alert GeoJSON.' },
    { path: `/api/cap?case=${data.id}`, desc: 'The same alert as CAP 1.2 XML (the format of India\'s SACHET system), status Exercise.' },
    { path: '/api/live', desc: 'Latest live runs: ECMWF IFS (systems, wind alerts, rain by IMD day) and the GEFS ensemble summary.' },
    { path: '/api/cap?live=ifs', desc: 'CAP 1.2 for the systems in the latest IFS run (an alert with no info block when there are none).' },
  ]

  return (
    <div className="space-y-4">
      <TopBar
        title="Alerts API"
        subtitle="Live REST endpoints serving the pipeline's alerts as JSON and CAP 1.2 — research prototype, not an official warning"
        forceMode={mode === 'gefs' ? 'validated' : mode}
      />
      <div className="bg-card rounded-card px-5 py-4 space-y-3">
        <p className="text-[12px] text-muted">
          Serverless functions deployed with this site (<code className="bg-bg px-1 rounded">dashboard-ui/api/</code>), open to any client
          (CORS enabled, no key). Every response carries the disclaimer; CAP alerts are always <code className="bg-bg px-1 rounded">status=Exercise</code>.
        </p>
        {endpoints.map((e) => <Endpoint key={e.path} {...e} />)}
      </div>
      <div className="bg-card rounded-card px-5 py-4">
        <h3 className="font-bold text-ink text-[13.5px] mb-2">
          What fields mean (from pipeline/alerts.py)
        </h3>
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
    <tr className="border-b border-line">
      <td className="py-2 pr-4 font-mono text-brand whitespace-nowrap align-top">{field}</td>
      <td className="py-2 text-muted">{desc}</td>
    </tr>
  )
}

function Endpoint({ path, desc }) {
  const [state, setState] = useState({ status: 'idle' })
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}${path}`
  const run = async () => {
    setState({ status: 'loading' })
    try {
      const r = await fetch(path, { signal: AbortSignal.timeout(30000) })
      const ct = r.headers.get('content-type') || ''
      if (!ct.includes('json') && !ct.includes('xml')) throw new Error('the API runs on the deployed site, not the local dev server')
      setState({ status: 'ok', code: r.status, body: ct.includes('json') ? JSON.stringify(await r.json(), null, 2) : await r.text() })
    } catch (e) {
      setState({ status: 'error', body: e.message })
    }
  }
  const copy = () => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500) }
  return (
    <div className="border border-line rounded-lg px-3.5 py-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <code className="font-mono text-[12px] text-ink break-all"><span className="text-brand font-semibold">GET</span> {path}</code>
        <div className="flex gap-1.5">
          <button onClick={copy} className="flex items-center gap-1 bg-bg hover:bg-line text-ink text-[11px] px-2.5 py-1 rounded-md transition-colors">
            {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy URL'}
          </button>
          <button onClick={run} className="flex items-center gap-1 bg-brand hover:bg-brand/90 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors">
            {state.status === 'loading' ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />} Try it
          </button>
        </div>
      </div>
      <p className="text-[11.5px] text-muted mt-1">{desc}</p>
      {state.status === 'ok' && (
        <pre className="text-[11px] bg-ink900 text-stone-100 rounded-lg px-3 py-2.5 mt-2 overflow-auto max-h-72"><code>HTTP {state.code}{'\n'}{state.body}</code></pre>
      )}
      {state.status === 'error' && <p className="text-[11.5px] text-red-600 mt-2">Request failed: {state.body}</p>}
    </div>
  )
}
