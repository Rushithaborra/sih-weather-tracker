import React from 'react'
import TopBar from '../components/TopBar'
import KpiCards from '../components/KpiCards'
import TrackMap from '../components/TrackMap'
import TimelineSlider from '../components/TimelineSlider'
import ZoomCanvas from '../components/ZoomCanvas'
import AlertsCard from '../components/AlertsCard'
import { useCase } from '../context/CaseContext'

export default function TracksBoxes() {
  const { data } = useCase()
  return (
    <div className="space-y-4">
      <TopBar
        title="Tracks & 4D bounding boxes"
        subtitle={`${data.label} replay — tracked on ERA5 reanalysis, validated against IBTrACS`}
      />
      <KpiCards />
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-4 items-start">
        <div className="bg-white rounded-card px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-ink text-[14.5px]">Tracked path</h3>
            <Legend />
          </div>
          <TrackMap />
          <TimelineSlider />
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-card px-5 py-4">
            <div className="flex items-baseline justify-between mb-2">
              <h3 className="font-bold text-ink text-[14.5px]">5 km zoom — near peak intensity</h3>
              <span className="text-[10.5px] text-muted">interpolation placeholder</span>
            </div>
            <ZoomCanvas />
          </div>
          <AlertsCard />
        </div>
      </div>
    </div>
  )
}

function Legend() {
  return (
    <div className="flex items-center gap-3.5 text-[10.5px] text-muted">
      <span className="flex items-center gap-1.5"><span className="w-4 h-[2px] bg-[#12213A] inline-block" /> tracked (min MSLP)</span>
      <span className="flex items-center gap-1.5"><span className="w-4 h-[2px] bg-[#12213A] inline-block" style={{ backgroundImage: 'repeating-linear-gradient(90deg,#12213A 0 4px,transparent 4px 7px)' }} /> IBTrACS best track</span>
      <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 border border-dashed inline-block" style={{ borderColor: '#C2185B' }} /> 4D box</span>
    </div>
  )
}
