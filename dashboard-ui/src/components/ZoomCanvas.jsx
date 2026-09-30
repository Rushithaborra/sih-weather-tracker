import React, { useEffect, useRef } from 'react'
import { useCase, interpolateTrack } from '../context/CaseContext'
import { fmtTime } from '../lib/format'
import { ZOOM_FIELDS, ZOOM_GRID_N } from '../data/zoomFields'

const STOPS = [
  [0, [244, 247, 251]], [0.2, [207, 230, 247]], [0.4, [140, 198, 238]],
  [0.6, [63, 146, 216]], [0.8, [39, 174, 96]], [1, [224, 58, 47]],
]
const WS_MAX = 35 // m/s, fixed domain so colour is comparable across cases/steps

function lerp(a, b, f) { return a + (b - a) * f }
function colorAt(v) {
  const x = Math.max(0, Math.min(1, v))
  for (let i = 0; i < STOPS.length - 1; i++) {
    const [p0, c0] = STOPS[i], [p1, c1] = STOPS[i + 1]
    if (x >= p0 && x <= p1) {
      const f = (x - p0) / (p1 - p0)
      return `rgb(${Math.round(lerp(c0[0], c1[0], f))},${Math.round(lerp(c0[1], c1[1], f))},${Math.round(lerp(c0[2], c1[2], f))})`
    }
  }
  return `rgb(${STOPS[STOPS.length - 1][1].join(',')})`
}

export default function ZoomCanvas() {
  const ref = useRef(null)
  const { data, t } = useCase()
  const track = data.track
  const nearest = track.reduce((b, p) => (Math.abs(p.t - t) < Math.abs(b.t - t) ? p : b), track[0])
  const now = interpolateTrack(track, t)
  const field = ZOOM_FIELDS[data.id]?.[String(nearest.t)]

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !field) return
    const N = ZOOM_GRID_N
    const size = canvas.width
    const ctx = canvas.getContext('2d')
    const cell = size / N
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const ws = field.grid[i * N + j]
        ctx.fillStyle = colorAt(ws / WS_MAX)
        // grid is row-major over lat (i, ascending) x lon (j, ascending); canvas y grows
        // downward, so flip the row to keep north at the top.
        ctx.fillRect(j * cell, (N - 1 - i) * cell, cell + 0.5, cell + 0.5)
      }
    }
    // pmin pin, mapped from real lat/lon into this box's canvas pixels
    const [latMin, latMax, lonMin, lonMax] = field.box
    const px = ((nearest.pminLon - lonMin) / (lonMax - lonMin)) * size
    const py = (1 - (nearest.pminLat - latMin) / (latMax - latMin)) * size
    ctx.beginPath()
    ctx.arc(px, py, 5, 0, Math.PI * 2)
    ctx.fillStyle = '#16293D'
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = '#ffffff'
    ctx.stroke()
  }, [field, nearest])

  if (!field) {
    return <div className="text-[11.5px] text-muted italic py-8 text-center">No field data for this step.</div>
  }

  return (
    <div>
      <canvas ref={ref} width={320} height={320} className="w-full rounded-md border border-line" />
      <div className="mt-2 text-[11px] text-muted leading-snug">
        Real bilinear interpolation of the ERA5 wind field inside the tracked object's 0.25° box
        ({ZOOM_GRID_N}×{ZOOM_GRID_N} display grid) — the same method (<code>pipeline/downscale.bilinear_box</code>)
        the working Streamlit prototype's 5 km panel uses. Peak {nearest.maxWs.toFixed(1)} m/s,{' '}
        {nearest.minMsl.toFixed(1)} hPa · {fmtTime(nearest.time)}. It{' '}
        <span className="italic">adds no new information</span> beyond the 0.25° analysis — this is a genuine
        interpolated field, not an invented shape, and it does not claim finer real resolution than that.
      </div>
    </div>
  )
}
