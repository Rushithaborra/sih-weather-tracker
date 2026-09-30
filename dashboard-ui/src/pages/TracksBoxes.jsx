import React from 'react'
import TopBar from '../components/TopBar'
import KpiCards from '../components/KpiCards'
import ConceptKpis from '../components/ConceptKpis'
import GefsKpis from '../components/GefsKpis'
import TrackMap from '../components/TrackMap'
import ConceptMap from '../components/ConceptMap'
import GefsMap from '../components/GefsMap'
import TimelineSlider from '../components/TimelineSlider'
import ZoomCanvas from '../components/ZoomCanvas'
import ConceptZoom from '../components/ConceptZoom'
import AlertsCard from '../components/AlertsCard'
import ConceptAlerts from '../components/ConceptAlerts'
import GefsInsights from '../components/GefsInsights'
import { useCase } from '../context/CaseContext'

export default function TracksBoxes() {
  const { mode, data, conceptT, setConceptT, gefsLeadH, setGefsLeadH } = useCase()
  const isConcept = mode === 'concept'
  const isGefs = mode === 'gefs'

  return (
    <div className="space-y-4">
      <TopBar
        title={isGefs ? 'Ensemble forecast tracks' : 'Tracks & 4D bounding boxes'}
        subtitle={`${data.label} replay — tracked on ERA5 reanalysis, validated against IBTrACS`}
        gefsSubtitle="30-member NOAA GEFS forecast, real detection + tracking + IBTrACS validation"
      />
      {isConcept ? <ConceptKpis /> : isGefs ? <GefsKpis /> : <KpiCards />}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-4 items-start">
        <div className="bg-card rounded-card px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-ink text-[14.5px]">
              {isConcept ? 'Ensemble tracks' : isGefs ? '30 forecast members' : 'Tracked path'}
            </h3>
            {isGefs ? <GefsLegend /> : <Legend concept={isConcept} />}
          </div>
          {isConcept ? <ConceptMap /> : isGefs ? <GefsMap /> : <TrackMap />}
          {isConcept ? (
            <TimelineSlider value={conceptT} onChange={setConceptT} max={240} step={24} tickStep={24} />
          ) : isGefs ? (
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
                    {isConcept ? '5 km zoom — landfall, T+96 h' : '5 km zoom — near peak intensity'}
                  </h3>
                  <span className="text-[10.5px] text-muted">{isConcept ? 'diffusion output (concept)' : 'interpolation placeholder'}</span>
                </div>
                {isConcept ? <ConceptZoom /> : <ZoomCanvas />}
                {isConcept && <ConceptZoomLegend />}
              </div>
              {isConcept ? <ConceptAlerts /> : <AlertsCard />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Legend({ concept }) {
  return (
    <div className="flex items-center gap-3.5 text-[10.5px] text-muted flex-wrap">
      <span className="flex items-center gap-1.5"><span className="w-4 h-[2px] bg-[#3B2A20] inline-block" /> mean</span>
      {concept && <span className="flex items-center gap-1.5"><span className="w-4 h-[2px] bg-[#8a94a3] inline-block" style={{ opacity: 0.5 }} /> members</span>}
      {!concept && <span className="flex items-center gap-1.5"><span className="w-4 h-[2px] bg-[#3B2A20] inline-block" style={{ backgroundImage: 'repeating-linear-gradient(90deg,#3B2A20 0 4px,transparent 4px 7px)' }} /> IBTrACS best track</span>}
      <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 border border-dashed inline-block" style={{ borderColor: '#C2185B' }} /> 4D box</span>
    </div>
  )
}

function GefsLegend() {
  return (
    <div className="flex items-center gap-3.5 text-[10.5px] text-muted flex-wrap">
      <span className="flex items-center gap-1.5"><span className="w-4 h-[2px] bg-[#9C6B3E] inline-block" /> control</span>
      <span className="flex items-center gap-1.5"><span className="w-4 h-[2px] bg-[#8a94a3] inline-block" style={{ opacity: 0.5 }} /> 29 members</span>
      <span className="flex items-center gap-1.5"><span className="w-4 h-[2px] bg-[#3B2A20] inline-block" style={{ backgroundImage: 'repeating-linear-gradient(90deg,#3B2A20 0 4px,transparent 4px 7px)' }} /> IBTrACS truth</span>
    </div>
  )
}

function ConceptZoomLegend() {
  const rings = [
    { color: '#C0392B', label: 'Severe', dist: 'within 5 km' },
    { color: '#E67E22', label: 'Moderate', dist: '5 – 15 km' },
    { color: '#F1C40F', label: 'Low', dist: '15 – 30 km' },
  ]
  return (
    <div className="mt-2 space-y-1.5">
      {rings.map((r) => (
        <div key={r.label} className="flex items-center gap-2 text-[11.5px]">
          <span className="w-3 h-3 rounded-full border-2 inline-block" style={{ borderColor: r.color }} />
          <span className="font-semibold text-ink">{r.label}</span>
          <span className="text-muted">{r.dist}</span>
        </div>
      ))}
      <p className="text-[10.5px] text-muted pt-1 leading-snug">
        Pin = core of the anomaly (highest 5 km cell). Peak kept at 292 mm/24 h instead of being averaged away.
      </p>
    </div>
  )
}
