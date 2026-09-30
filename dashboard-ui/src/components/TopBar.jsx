import React from 'react'
import { Download } from 'lucide-react'
import { useCase } from '../context/CaseContext'
import { CASES } from '../data/cases'

export default function TopBar({ title, subtitle, conceptSubtitle }) {
  const { mode, setMode, caseId, setCaseId, data, maxT } = useCase()
  const isConcept = mode === 'concept'

  const exportFile = () => {
    const href = isConcept ? `${import.meta.env.BASE_URL}BOB-2020-01.xml` : `${import.meta.env.BASE_URL}${caseId}_alerts_sample.geojson`
    const a = document.createElement('a')
    a.href = href
    a.download = isConcept ? 'BOB-2020-01.xml' : `${caseId}_alerts_ws_sample.geojson`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  return (
    <div className="space-y-2.5">
      <ModeToggle mode={mode} setMode={setMode} />
      <div className="bg-card rounded-card px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[19px] font-bold text-ink leading-tight">{title}</h1>
          <p className="text-[12.5px] text-muted mt-0.5">
            {isConcept ? (conceptSubtitle ?? 'Bay of Bengal super-cyclone replay — illustrative data') : subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isConcept ? (
            <>
              <Chip>NEPS-G 00 UTC</Chip>
              <Chip>23 members</Chip>
              <Chip>T+0 → 240 h</Chip>
            </>
          ) : (
            <>
              <select
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                className="text-[11.5px] font-medium bg-bg text-ink rounded-full px-3.5 py-1.5 border-none outline-none cursor-pointer"
              >
                {Object.values(CASES).map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
              <Chip>{data.role === 'in-sample' ? 'In-sample' : 'Held out'}</Chip>
              <Chip>ERA5 0.25° reanalysis</Chip>
              <Chip>{`T+0 → ${maxT} h`}</Chip>
            </>
          )}
          <button
            onClick={exportFile}
            className="flex items-center gap-1.5 bg-brand hover:bg-brand/90 text-white text-[12px] font-semibold px-3.5 py-1.5 rounded-full transition-colors"
          >
            <Download size={13} strokeWidth={2.5} />
            {isConcept ? 'Export CAP' : 'Export alerts GeoJSON'}
          </button>
          <div className="w-8 h-8 rounded-full bg-ink900 text-white text-[11px] font-bold flex items-center justify-center">
            FC
          </div>
        </div>
      </div>
    </div>
  )
}

function ModeToggle({ mode, setMode }) {
  return (
    <div className="flex items-center gap-1 bg-card rounded-full p-1 w-fit">
      {[
        { id: 'concept', label: 'Concept mock-up' },
        { id: 'validated', label: 'Validated results' },
      ].map((m) => (
        <button
          key={m.id}
          onClick={() => setMode(m.id)}
          className={`text-[11.5px] font-semibold px-3.5 py-1.5 rounded-full transition-colors ${
            mode === m.id ? 'bg-ink900 text-white' : 'text-muted hover:text-ink'
          }`}
        >
          {m.label}
        </button>
      ))}
      <span className="text-[10.5px] text-muted px-2 hidden md:inline">
        {mode === 'concept' ? 'Matches the pitch deck mock-up (synthetic)' : 'Real ERA5/IBTrACS pipeline output'}
      </span>
    </div>
  )
}

function Chip({ children }) {
  return <span className="text-[11.5px] font-medium bg-bg text-ink rounded-full px-3.5 py-1.5">{children}</span>
}
