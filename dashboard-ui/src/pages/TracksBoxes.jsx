import React from 'react'
import TopBar from '../components/TopBar'
import KpiCards from '../components/KpiCards'
import GefsKpis from '../components/GefsKpis'
import TrackMap from '../components/TrackMap'
import GefsMap from '../components/GefsMap'
import TimelineSlider from '../components/TimelineSlider'
import ZoomCanvas from '../components/ZoomCanvas'
import AlertsCard from '../components/AlertsCard'
import GefsInsights from '../components/GefsInsights'
import { useCase } from '../context/CaseContext'

export default function TracksBoxes() {
  const { mode, data, gefsLeadH, setGefsLeadH } = useCase()
  const isGefs = mode === 'gefs'

  return (
    <div className="space-y-4">
      <TopBar
        title={isGefs ? 'Ensemble forecast tracks' : 'Tracks & 4D bounding boxes'}
        subtitle={`${data.label} replay — tracked on ERA5 reanalysis, validated against IBTrACS`}
        gefsSubtitle="30-member NOAA GEFS forecast, real detection + tracking + IBTrACS validation"
      />
      {isGefs ? <GefsKpis /> : <KpiCards />}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-4 items-start">
        <div className="bg-card rounded-card px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-ink text-[14.5px]">
              {isGefs ? '30 forecast members' : 'Tracked path'}
            </h3>
            {isGefs ? <GefsLegend /> : <Legend />}
          </div>
          {isGefs ? <GefsMap /> : <TrackMap />}
          {isGefs ? (
            <TimelineSlider value={gefsLeadH} onChange={setGefsLeadH} max={144} step={6} tickStep={24} />
          ) : (
            <TimelineSlider />
          )}
        </div>
        <div className="space-y-4">
          {isGefs ? (
            <GefsInsights />
          ) : (
            <>
              <div className="bg-card rounded-card px-5 py-4">
                <div className="flex items-baseline justify-between mb-2">
                  <h3 className="font-bold text-ink text-[14.5px]">
                    5 km zoom — near peak intensity
                  </h3>
                  <span className="text-[10.5px] text-muted">interpolation, adds no information</span>
                </div>
                <ZoomCanvas />
              </div>
              <AlertsCard />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Legend() {
  return (
    <div className="flex items-center gap-3.5 text-[10.5px] text-muted flex-wrap">
      <span className="flex items-center gap-1.5"><span className="w-4 h-[2px] bg-[#16293D] inline-block" /> mean</span>
      <span className="flex items-center gap-1.5"><span className="w-4 h-[2px] bg-[#16293D] inline-block" style={{ backgroundImage: 'repeating-linear-gradient(90deg,#16293D 0 4px,transparent 4px 7px)' }} /> IBTrACS best track</span>
      <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 border border-dashed inline-block" style={{ borderColor: '#C2185B' }} /> 4D box</span>
    </div>
  )
}

function GefsLegend() {
  return (
    <div className="flex items-center gap-3.5 text-[10.5px] text-muted flex-wrap">
      <span className="flex items-center gap-1.5"><span className="w-4 h-[2px] bg-[#1D72B8] inline-block" /> control</span>
      <span className="flex items-center gap-1.5"><span className="w-4 h-[2px] bg-[#8a94a3] inline-block" style={{ opacity: 0.5 }} /> 29 members</span>
      <span className="flex items-center gap-1.5"><span className="w-4 h-[2px] bg-[#16293D] inline-block" style={{ backgroundImage: 'repeating-linear-gradient(90deg,#16293D 0 4px,transparent 4px 7px)' }} /> IBTrACS truth</span>
    </div>
  )
}
