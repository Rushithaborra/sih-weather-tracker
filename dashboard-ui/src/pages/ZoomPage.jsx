import React from 'react'
import TopBar from '../components/TopBar'
import TimelineSlider from '../components/TimelineSlider'
import ZoomCanvas from '../components/ZoomCanvas'
import ConceptZoom from '../components/ConceptZoom'
import { useCase, interpolateTrack } from '../context/CaseContext'
import { fmtTime } from '../lib/format'
import { RAIN_PEAK_MM } from '../data/concept'

export default function ZoomPage() {
  const { mode, data, t, conceptT, setConceptT } = useCase()

  if (mode === 'concept') {
    return (
      <div className="space-y-4">
        <TopBar title="5 km zoom" conceptSubtitle="Landfall, T+96 h — conditional diffusion downscaler output (concept)" />
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-4 items-start">
          <div className="bg-white rounded-card px-5 py-4">
            <h3 className="font-bold text-ink text-[14.5px] mb-2">Rain field at T+{conceptT} h</h3>
            <ConceptZoom />
            <TimelineSlider value={conceptT} onChange={setConceptT} max={240} step={24} tickStep={24} />
          </div>
          <div className="bg-white rounded-card px-5 py-4 space-y-3">
            <h3 className="font-bold text-ink text-[14.5px]">Why peaks matter</h3>
            <p className="text-[12.5px] text-muted leading-relaxed">
              An MSE-trained CNN/U-Net spreads a storm's peak rain across a wide, smooth blob — averaging a real
              300 mm/24h extreme down to roughly 147 mm, below IMD's "extremely heavy" mark (204.5 mm/24h), so
              the alert never fires. The proposed conditional diffusion downscaler is trained to keep that peak
              instead of blurring it.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Fact label="Peak rain kept" value={`${RAIN_PEAK_MM} mm/24h`} />
              <Fact label="IMD 'extremely heavy'" value="204.5 mm/24h" />
            </div>
            <h3 className="font-bold text-ink text-[13.5px] pt-2">Status</h3>
            <p className="text-[12.5px] text-muted leading-relaxed">
              This panel is illustrative — the conditional diffusion downscaler (12 km → 5 km, physics-informed
              loss) is designed, not yet trained or implemented. See <span className="font-semibold text-ink">Validated
              results</span> mode for what's actually running today.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const now = interpolateTrack(data.track, t)
  return (
    <div className="space-y-4">
      <TopBar title="5 km zoom" subtitle={`${data.label} — interpolation placeholder around the tracked object`} />
      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-4 items-start">
        <div className="bg-white rounded-card px-5 py-4">
          <h3 className="font-bold text-ink text-[14.5px] mb-2">Field shape at T+{t} h</h3>
          <ZoomCanvas />
          <TimelineSlider />
        </div>
        <div className="bg-white rounded-card px-5 py-4 space-y-3">
          <h3 className="font-bold text-ink text-[14.5px]">Why this is a placeholder, not a downscaler</h3>
          <p className="text-[12.5px] text-muted leading-relaxed">
            The working prototype's 5 km layer is bilinear interpolation from 0.25° to 0.05° inside the
            object's box — it stands in for the conditional diffusion downscaler, which is designed but not
            implemented. Per the prototype's own documentation: <span className="italic">"Bilinear interpolation
            from 0.25° to 0.05°. Adds no new information."</span>
          </p>
          <p className="text-[12.5px] text-muted leading-relaxed">
            This concept view goes one step further for presentation purposes — it draws an illustrative vortex
            shape rather than a real interpolated grid — so treat the picture as a placeholder for a placeholder.
            The real numbers driving it are genuine: peak wind, minimum MSLP and max anomaly z-score at this
            timestep, pulled directly from <code className="bg-pagebg px-1 rounded">data/processed/{data.id}/tracks.json</code>.
          </p>
          <div className="grid grid-cols-3 gap-3 pt-1">
            <Fact label="Max wind" value={`${now.maxWs.toFixed(1)} m/s`} />
            <Fact label="Min MSLP" value={`${now.minMsl.toFixed(1)} hPa`} />
            <Fact label="Time" value={fmtTime(now.time ?? data.track[0].time)} />
          </div>
          <h3 className="font-bold text-ink text-[13.5px] pt-2">Training-data risk for the real downscaler</h3>
          <p className="text-[12.5px] text-muted leading-relaxed">
            High-resolution (~5 km) observations or regional reanalysis for India are scarce — this is flagged
            in the roadmap as the main open risk before a real diffusion downscaler can be trained.
          </p>
        </div>
      </div>
    </div>
  )
}

function Fact({ label, value }) {
  return (
    <div className="bg-pagebg rounded-lg px-3 py-2.5">
      <div className="text-[10.5px] text-muted">{label}</div>
      <div className="text-[14px] font-bold text-teal">{value}</div>
    </div>
  )
}
