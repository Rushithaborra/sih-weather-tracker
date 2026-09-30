import React from 'react'
import TopBar from '../components/TopBar'
import { useCase } from '../context/CaseContext'
import { fmtTime } from '../lib/format'
import { categoryFor } from '../lib/category'
import { ALERTS } from '../data/concept'
import ConceptAlerts from '../components/ConceptAlerts'

const TIER_COLOR = { severe: '#C0392B', moderate: '#D35400', low: '#B7950B' }

export default function ActiveAnomalies() {
  const { mode, data, t, setT } = useCase()
  if (mode === 'concept') {
    return (
      <div className="space-y-4">
        <TopBar title="Active anomalies" conceptSubtitle="The 3 anomalies currently flagged in the replay — 1 severe, 1 moderate, 1 low" />
        <div className="bg-white rounded-card px-5 py-4 overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left text-muted border-b border-slate-100">
                {['Tier', 'Anomaly', 'Location', 'Zone', 'Metric', 'Lead time'].map((h) => (
                  <th key={h} className="py-2 pr-4 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALERTS.map((a) => (
                <tr key={a.title} className="border-b border-slate-50">
                  <td className="py-2 pr-4">
                    <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full text-white uppercase" style={{ background: TIER_COLOR[a.tier] }}>
                      {a.tier}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-ink font-medium">{a.title}</td>
                  <td className="py-2 pr-4 text-ink">{a.location}</td>
                  <td className="py-2 pr-4 text-ink">{a.radius}</td>
                  <td className="py-2 pr-4 text-ink">{a.metric}</td>
                  <td className="py-2 pr-4 text-ink">{a.lead}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ConceptAlerts />
      </div>
    )
  }
  return (
    <div className="space-y-4">
      <TopBar title="Active anomalies" subtitle={`Every tracked object for ${data.label}, 8-connected cells over the detection threshold`} />
      <div className="bg-white rounded-card px-5 py-4 overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-left text-muted border-b border-slate-100">
              {['Time (UTC)', 'Category', 'Cells', 'Area (km²)', 'Max wind (m/s)', 'Min MSLP (hPa)', 'Max z', 'Track error (km)'].map((h) => (
                <th key={h} className="py-2 pr-4 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.track.map((p) => {
              const cat = categoryFor(p.maxWs)
              const active = p.t === t
              return (
                <tr
                  key={p.t}
                  onClick={() => setT(p.t)}
                  className={`border-b border-slate-50 cursor-pointer ${active ? 'bg-teal/5' : 'hover:bg-pagebg'}`}
                >
                  <td className="py-2 pr-4 text-ink whitespace-nowrap">{fmtTime(p.time)}</td>
                  <td className="py-2 pr-4">
                    <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: cat.color }}>
                      {cat.code}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-ink">{p.nCells}</td>
                  <td className="py-2 pr-4 text-ink">{Math.round(p.areaKm2).toLocaleString()}</td>
                  <td className="py-2 pr-4 text-ink">{p.maxWs.toFixed(1)}</td>
                  <td className="py-2 pr-4 text-ink">{p.minMsl.toFixed(1)}</td>
                  <td className="py-2 pr-4 text-ink">{p.maxZ.toFixed(1)}</td>
                  <td className="py-2 pr-4 text-ink">{p.pminErrKm.toFixed(0)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {data.extraObjects && (
        <div className="bg-white rounded-card px-5 py-4">
          <h3 className="font-bold text-ink text-[13.5px] mb-2">Unmatched single-step objects</h3>
          <p className="text-[11.5px] text-muted mb-2">
            Detected but not linked into the main track (displacement gate or short-lived) — roughly 300 km
            from the best-track centre in both cases.
          </p>
          <div className="space-y-1.5">
            {data.extraObjects.map((o) => (
              <div key={o.time} className="text-[12px] text-ink flex gap-4">
                <span className="text-muted w-[130px]">{fmtTime(o.time)}</span>
                <span>{o.maxWs.toFixed(1)} m/s</span>
                <span>{o.minMsl.toFixed(1)} hPa</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
