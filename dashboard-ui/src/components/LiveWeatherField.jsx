import React, { useEffect, useRef } from 'react'

// Real ensemble-mean 10 m wind speed over the whole analysis domain, every 24 h --
// general weather (monsoon flow, everyday wind pattern), not just cyclone-scale
// anomalies. Shown even when no member is tracking a system. Same vivid palette
// as the case-study 5 km zoom panel, for visual consistency across the app.
const STOPS = [
  [0, [8, 17, 31]], [0.18, [18, 58, 107]], [0.34, [14, 122, 107]], [0.5, [47, 168, 79]],
  [0.64, [212, 201, 47]], [0.78, [242, 169, 58]], [0.9, [226, 73, 47]], [1, [255, 244, 235]],
]
const WS_MAX = 25 // m/s -- ensemble-mean general wind, not peak single-member intensity

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

function nearestLead(leadHours, target) {
  return leadHours.reduce((a, b) => (Math.abs(b - target) < Math.abs(a - target) ? b : a), leadHours[0])
}

export default function LiveWeatherField({ field, leadH }) {
  const ref = useRef(null)
  const lead = field ? nearestLead(field.leadHours, leadH) : null
  const grid = field?.grids?.[String(lead)]
  const nLat = field?.lat.length ?? 0
  const nLon = field?.lon.length ?? 0

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !grid) return
    const w = nLon, h = nLat
    const size = canvas.width
    const ctx = canvas.getContext('2d')

    const off = document.createElement('canvas')
    off.width = w
    off.height = h
    const octx = off.getContext('2d')
    const img = octx.createImageData(w, h)
    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        const ws = grid[i * w + j]
        const [r, g, b] = colorAt(ws / WS_MAX)
        const row = h - 1 - i // flip so north is up
        const idx = (row * w + j) * 4
        img.data[idx] = r; img.data[idx + 1] = g; img.data[idx + 2] = b; img.data[idx + 3] = 255
      }
    }
    octx.putImageData(img, 0, 0)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.clearRect(0, 0, size, size)
    ctx.drawImage(off, 0, 0, w, h, 0, 0, size, size)
  }, [grid, nLat, nLon])

  if (!field) return null

  return (
    <div>
      <canvas ref={ref} width={360} height={360} className="w-full rounded-md border border-line" style={{ background: '#08111F' }} />
      <div className="flex items-center justify-between mt-2 text-[10.5px] text-muted">
        <span>{field.lat[0]}°N–{field.lat[field.lat.length - 1]}°N, {field.lon[0]}°E–{field.lon[field.lon.length - 1]}°E</span>
        <span>T+{lead} h</span>
      </div>
      <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted">
        <span>0</span>
        <span className="flex-1 h-2 rounded-full" style={{ background: `linear-gradient(90deg, ${STOPS.map(([, [r, g, b]]) => `rgb(${r},${g},${b})`).join(',')})` }} />
        <span>{WS_MAX}+ m/s</span>
      </div>
      <div className="text-[10.5px] text-muted mt-1.5 leading-snug">
        Real ensemble-mean 10 m wind speed, all {field.grids ? Object.keys(field.grids).length : ''} {' '}
        snapshots every 24 h, whole analysis domain — the everyday wind pattern (monsoon flow, land/sea
        breeze structure), not just cyclone-scale anomalies. Averaging {field.variable === 'ws' ? 'across members' : ''}{' '}
        smooths out any single storm's peak, so this is deliberately the calm view, not the alert view.
      </div>
    </div>
  )
}
