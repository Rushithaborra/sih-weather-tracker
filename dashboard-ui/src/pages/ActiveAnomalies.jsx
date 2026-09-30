import React from 'react'
import TopBar from '../components/TopBar'
import { useCase } from '../context/CaseContext'
import { fmtTime } from '../lib/format'
import { categoryFor } from '../lib/category'

export default function ActiveAnomalies() {
  const { mode, data, t, setT } = useCase()
  return (
    <div className="space-y-4">
      <TopBar
        title="Active anomalies"
        subtitle={`Every tracked object for ${data.label}, 8-connected cells over the detection threshold`}
        forceMode={mode === 'gefs' ? 'validated' : mode}
      />
      <div className="bg-card rounded-card px-5 py-4 overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-left text-muted border-b border-line">
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
                  className={`border-b border-line cursor-pointer ${active ? 'bg-brand/5' : 'hover:bg-bg'}`}
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
                  <td className="py-2 pr-4 text-ink">{p.pminErrKm == null ? '—' : p.pminErrKm.toFixed(0)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {data.extraObjects && (
        <div className="bg-card rounded-card px-5 py-4">
          <h3 className="font-bold text-ink text-[13.5px] mb-2">Objects outside the main track</h3>
          <p className="text-[11.5px] text-muted mb-2">
            Detected but not linked into the main track — short-lived, beyond the 400 km displacement gate, or a
            separate system.
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
