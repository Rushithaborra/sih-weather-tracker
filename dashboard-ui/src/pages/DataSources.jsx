import React from 'react'
import TopBar from '../components/TopBar'
import { CheckCircle2, Circle } from 'lucide-react'
import { DATA_SOURCES } from '../data/concept'
import { useCase } from '../context/CaseContext'

const IN_USE = [
  { name: 'ERA5 reanalysis', detail: '0.25° (~28 km), via WeatherBench 2 on Google Cloud (gs://weatherbench2/datasets/era5/). Hersbach et al. 2020, Copernicus/ECMWF.' },
  { name: 'IBTrACS v04r01', detail: 'NOAA NCEI, North Indian basin CSV — observed best track used as ground truth for validation. Knapp et al. 2010, BAMS. Public domain.' },
]

const PLANNED = [
  { name: 'NEPS-G', detail: '12 km, 23-member NCMRWF ensemble — would replace single-member ERA5 reanalysis as the forecast input.' },
  { name: 'NCUM-G', detail: 'Deterministic NCMRWF global model, mentioned in the roadmap as a possible additional input.' },
  { name: 'IMDAA', detail: 'India Meteorological Department regional reanalysis — a candidate source of higher-resolution truth for downscaler training.' },
  { name: 'IMD observations', detail: 'Station and best-track data beyond IBTrACS, for tighter validation.' },
  { name: 'GPM IMERG', detail: 'Satellite precipitation — would let the pipeline validate rainfall, which today is display-only with no climatology.' },
  { name: 'Copernicus DEM', detail: 'Elevation data, relevant to a real downscaler conditioning on terrain.' },
]

export default function DataSources() {
  const { mode } = useCase()
  if (mode === 'concept') {
    return (
      <div className="space-y-4">
        <TopBar title="Data sources" conceptSubtitle="From the pitch deck's Research and References slide" />
        <div className="bg-card rounded-card px-5 py-4">
          <div className="space-y-3">
            {DATA_SOURCES.map((s) => (
              <div key={s.name} className="flex gap-3">
                <span className="text-[11px] font-bold text-brand bg-brand/10 rounded-full px-2.5 py-0.5 h-fit shrink-0">deck</span>
                <div>
                  <div className="font-semibold text-ink text-[13px]">{s.name}</div>
                  <div className="text-[12px] text-muted">{s.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-4">
      <TopBar title="Data sources" subtitle="What the pipeline reads today vs. what the roadmap calls for" />

      <div className="bg-card rounded-card px-5 py-4">
        <h3 className="font-bold text-ink text-[14.5px] mb-3 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-brand" /> In use
        </h3>
        <div className="space-y-3">
          {IN_USE.map((s) => (
            <div key={s.name} className="flex gap-3">
              <span className="text-[11px] font-bold text-brand bg-brand/10 rounded-full px-2.5 py-0.5 h-fit shrink-0">live</span>
              <div>
                <div className="font-semibold text-ink text-[13px]">{s.name}</div>
                <div className="text-[12px] text-muted">{s.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-card px-5 py-4">
        <h3 className="font-bold text-ink text-[14.5px] mb-3 flex items-center gap-2">
          <Circle size={16} className="text-muted" /> Roadmap — not yet integrated
        </h3>
        <div className="space-y-3">
          {PLANNED.map((s) => (
            <div key={s.name} className="flex gap-3">
              <span className="text-[11px] font-bold text-muted bg-bg rounded-full px-2.5 py-0.5 h-fit shrink-0">planned</span>
              <div>
                <div className="font-semibold text-ink text-[13px]">{s.name}</div>
                <div className="text-[12px] text-muted">{s.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
