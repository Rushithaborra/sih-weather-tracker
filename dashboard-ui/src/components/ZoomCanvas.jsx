import React, { useEffect, useRef } from 'react'
import { useCase, interpolateTrack } from '../context/CaseContext'
import { fmtTime } from '../lib/format'
import { ZOOM_FIELDS, ZOOM_GRID_N } from '../data/zoomFields'

// A vivid "hot" meteorological palette (dark calm -> blue -> teal -> green -> yellow ->
// orange -> red -> white-hot core), closer to how satellite/wind-speed products are
// conventionally rendered, applied to the same real, unchanged wind-speed numbers.
const STOPS = [
  [0, [8, 17, 31]], [0.18, [18, 58, 107]], [0.34, [14, 122, 107]], [0.5, [47, 168, 79]],
  [0.64, [212, 201, 47]], [0.78, [242, 169, 58]], [0.9, [226, 73, 47]], [1, [255, 244, 235]],
]
const WS_MAX = 35 // m/s, fixed domain so colour is comparable across cases/steps

function lerp(a, b, f) { return a + (b - a) * f }
function colorAt(v) {
  const x = Math.max(0, Math.min(1, v))
  for (let i = 0; i < STOPS.length - 1; i++) {
    const [p0, c0] = STOPS[i], [p1, c1] = STOPS[i + 1]
    if (x >= p0 && x <= p1) {
      const f = (x - p0) / (p1 - p0)
      return [Math.round(lerp(c0[0], c1[0], f)), Math.round(lerp(c0[1], c1[1], f)), Math.round(lerp(c0[2], c1[2], f))]
    }
  }
  return STOPS[STOPS.length - 1][1]
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

    // Render the real N x N grid at native resolution first, then let the browser's
    // bicubic image smoothing upscale it -- a smooth-shaded look, not a fabricated one:
    // it's the same numbers, just anti-aliased instead of drawn as hard flat cells.
    const off = document.createElement('canvas')
    off.width = N
    off.height = N
    const octx = off.getContext('2d')
    const img = octx.createImageData(N, N)
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const ws = field.grid[i * N + j]
        const [r, g, b] = colorAt(ws / WS_MAX)
        // grid is row-major over lat (i, ascending) x lon (j, ascending); image rows grow
        // downward, so flip the row to keep north at the top.
        const row = N - 1 - i
        const idx = (row * N + j) * 4
        img.data[idx] = r; img.data[idx + 1] = g; img.data[idx + 2] = b; img.data[idx + 3] = 255
      }
    }
    octx.putImageData(img, 0, 0)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.clearRect(0, 0, size, size)
    ctx.drawImage(off, 0, 0, N, N, 0, 0, size, size)

    // Soft vignette so the field reads as a cropped storm view rather than a flat square.
    const vg = ctx.createRadialGradient(size / 2, size / 2, size * 0.32, size / 2, size / 2, size * 0.7)
    vg.addColorStop(0, 'rgba(8,17,31,0)')
    vg.addColorStop(1, 'rgba(8,17,31,0.55)')
    ctx.fillStyle = vg
    ctx.fillRect(0, 0, size, size)

    // pmin pin, mapped from real lat/lon into this box's canvas pixels
    const [latMin, latMax, lonMin, lonMax] = field.box
    const px = ((nearest.pminLon - lonMin) / (lonMax - lonMin)) * size
    const py = (1 - (nearest.pminLat - latMin) / (latMax - latMin)) * size
    ctx.beginPath()
    ctx.arc(px, py, 4.5, 0, Math.PI * 2)
    ctx.fillStyle = '#0A0F17'
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
      <canvas ref={ref} width={320} height={320} className="w-full rounded-md border border-line" style={{ background: '#08111F' }} />
      <div className="mt-2 text-[11px] text-muted leading-snug">
        ERA5 wind field inside the tracked object's 0.25° box, bilinearly interpolated — interpolation only, it adds no information
        ({ZOOM_GRID_N}×{ZOOM_GRID_N} display grid, smooth-shaded) — the same method
        (<code>pipeline/downscale.bilinear_box</code>) the working Streamlit prototype's 5 km panel uses.
        Peak {nearest.maxWs.toFixed(1)} m/s, {nearest.minMsl.toFixed(1)} hPa · {fmtTime(nearest.time)}. The
        colour and shading are stylised for readability; the numbers are unchanged and it{' '}
        <span className="italic">adds no new information</span> beyond the 0.25° analysis — a satellite image
        would show real convective structure this field cannot, because it isn't that kind of data.
      </div>
    </div>
  )
}
