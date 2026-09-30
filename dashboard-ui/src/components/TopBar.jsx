import React from 'react'
import { Download } from 'lucide-react'
import { useCase } from '../context/CaseContext'
import { CASES } from '../data/cases'

export default function TopBar({ title, subtitle }) {
  const { caseId, setCaseId, data, maxT } = useCase()

  const exportFile = () => {
    const href = `${import.meta.env.BASE_URL}${caseId}_alerts_sample.geojson`
    const a = document.createElement('a')
    a.href = href
    a.download = `${caseId}_alerts_ws_sample.geojson`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  return (
    <div className="bg-white rounded-card px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-[19px] font-bold text-ink leading-tight">{title}</h1>
        {subtitle && <p className="text-[12.5px] text-muted mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={caseId}
          onChange={(e) => setCaseId(e.target.value)}
          className="text-[11.5px] font-medium bg-pagebg text-ink rounded-full px-3.5 py-1.5 border-none outline-none cursor-pointer"
        >
          {Object.values(CASES).map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
        <Chip>{data.role === 'in-sample' ? 'In-sample' : 'Held out'}</Chip>
        <Chip>ERA5 0.25° reanalysis</Chip>
        <Chip>{`T+0 → ${maxT} h`}</Chip>
        <button
          onClick={exportFile}
          className="flex items-center gap-1.5 bg-teal hover:bg-teal/90 text-white text-[12px] font-semibold px-3.5 py-1.5 rounded-full transition-colors"
        >
          <Download size={13} strokeWidth={2.5} />
          Export alerts GeoJSON
        </button>
        <div className="w-8 h-8 rounded-full bg-navy text-white text-[11px] font-bold flex items-center justify-center">
          FC
        </div>
      </div>
    </div>
  )
}

function Chip({ children }) {
  return (
    <span className="text-[11.5px] font-medium bg-pagebg text-ink rounded-full px-3.5 py-1.5">
      {children}
    </span>
  )
}
