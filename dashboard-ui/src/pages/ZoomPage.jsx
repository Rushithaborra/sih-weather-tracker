import React from 'react'
import TopBar from '../components/TopBar'
import TimelineSlider from '../components/TimelineSlider'
import ZoomCanvas from '../components/ZoomCanvas'
import { useCase, interpolateTrack } from '../context/CaseContext'
import { fmtTime } from '../lib/format'

export default function ZoomPage() {
  const { mode, data, t } = useCase()

  const now = interpolateTrack(data.track, t)
  return (
    <div className="space-y-4">
      <TopBar
        title="5 km zoom"
        subtitle={`${data.label} — ERA5 wind around the tracked object, bilinear interpolation (adds no information)`}
        forceMode={mode === 'gefs' ? 'validated' : mode}
      />
      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-4 items-start">
        <div className="bg-card rounded-card px-5 py-4">
          <h3 className="font-bold text-ink text-[14.5px] mb-2">Field shape at T+{t} h</h3>
          <ZoomCanvas />
          <TimelineSlider />
        </div>
        <div className="bg-card rounded-card px-5 py-4 space-y-3">
          <h3 className="font-bold text-ink text-[14.5px]">Why this is a placeholder, not a downscaler</h3>
          <p className="text-[12.5px] text-muted leading-relaxed">
            The field on the left is interpolation, not a downscaler: <code className="bg-bg px-1 rounded">pipeline/downscale.bilinear_box</code>,
            the same function the working Streamlit prototype's 5 km panel calls, run on this case's actual
            ERA5 wind field and exported once per track step. It stands in for the conditional diffusion
            downscaler, which is designed but not implemented. Per the prototype's own documentation:{' '}
            <span className="italic">"Bilinear interpolation from 0.25° to 0.05°. Adds no new information."</span>
          </p>
          <p className="text-[12.5px] text-muted leading-relaxed">
            Interpolation only draws a smoother picture of the same coarse cells — it cannot recover detail the
            0.25° analysis never had. A real downscaler would need to add genuinely new, physically plausible
            detail, which is exactly what the diffusion stage is designed (not implemented) to do.
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
    <div className="bg-bg rounded-lg px-3 py-2.5">
      <div className="text-[10.5px] text-muted">{label}</div>
      <div className="text-[14px] font-bold text-brand">{value}</div>
    </div>
  )
}
