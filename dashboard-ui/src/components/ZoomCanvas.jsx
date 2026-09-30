import React, { useEffect, useRef } from 'react'
import { useCase, interpolateTrack } from '../context/CaseContext'
import { fmtTime } from '../lib/format'

const STOPS = [
  [0, [244, 247, 251]], [0.2, [207, 230, 247]], [0.4, [140, 198, 238]],
  [0.6, [63, 146, 216]], [0.8, [39, 174, 96]], [1, [224, 58, 47]],
]

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

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const N = 32
    const size = canvas.width
    const ctx = canvas.getContext('2d')
    const cell = size / N
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const dx = (i - N / 2) / (N / 2)
        const dy = (j - N / 2) / (N / 2)
        const r = Math.sqrt(dx * dx + dy * dy)
        // Illustrative radial falloff shaped like a vortex ring, scaled by this step's real max z-score.
        const ring = Math.exp(-Math.pow((r - 0.28) * 3.2, 2))
        const core = Math.max(0, 1 - r * 1.1) * 0.35
        const v = Math.min(1, (ring * 0.85 + core) * (nearest.maxZ / 13.3))
        ctx.fillStyle = colorAt(v)
        ctx.fillRect(i * cell, j * cell, cell + 0.5, cell + 0.5)
      }
    }
    // pmin pin
    const px = size / 2, py = size / 2
    ctx.beginPath()
    ctx.arc(px, py, 5, 0, Math.PI * 2)
    ctx.fillStyle = '#3B2A20'
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = '#ffffff'
    ctx.stroke()
  }, [nearest, data.id])

  return (
    <div>
      <canvas ref={ref} width={320} height={320} className="w-full rounded-md border border-line" />
      <div className="mt-2 text-[11px] text-muted leading-snug">
        Illustrative anomaly shape at the tracked object's 0.25° box (peak z {nearest.maxZ.toFixed(1)},{' '}
        {nearest.maxWs.toFixed(1)} m/s, {nearest.minMsl.toFixed(1)} hPa · {fmtTime(nearest.time)}). The real
        prototype's 5 km panel is bilinear interpolation of the ERA5 field and, per its own documentation,{' '}
        <span className="italic">adds no new information</span> — this view does not claim finer resolution
        than that.
      </div>
    </div>
  )
}
