import React, { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, ImageOverlay } from 'react-leaflet'

// Real ensemble-mean 10 m wind speed over the whole analysis domain, every 24 h --
// general weather (monsoon flow, everyday wind pattern), not just cyclone-scale
// anomalies. Drawn as a semi-transparent overlay on a real basemap (coastlines,
// state borders) instead of a floating colour blob, so it's actually legible.
// [wind m/s, [r, g, b, alpha]] -- calm air is transparent so the basemap (coastlines,
// borders) stays readable; colour builds up with wind speed, orange from gale (17 m/s).
const STOPS = [
  [0, [255, 255, 255, 0]], [3, [158, 202, 225, 0.35]], [6, [66, 146, 198, 0.6]], [9, [65, 171, 93, 0.7]],
  [12, [254, 217, 118, 0.8]], [17, [253, 141, 60, 0.85]], [21, [227, 26, 28, 0.9]], [25, [128, 0, 38, 0.95]],
]
const WS_MAX = STOPS[STOPS.length - 1][0] // m/s -- ensemble-mean general wind, not peak single-member intensity
const TICKS = [0, 5, 10, 15, 17, 20, 25]

function lerp(a, b, f) { return a + (b - a) * f }
function colorAt(ws) {
  const x = Math.max(0, Math.min(WS_MAX, ws))
  for (let i = 0; i < STOPS.length - 1; i++) {
    const [p0, c0] = STOPS[i], [p1, c1] = STOPS[i + 1]
    if (x <= p1) {
      const f = (x - p0) / (p1 - p0)
      return c0.map((c, k) => lerp(c, c1[k], f))
    }
  }
  return STOPS[STOPS.length - 1][1]
}

function nearestLead(leadHours, target) {
  return leadHours.reduce((a, b) => (Math.abs(b - target) < Math.abs(a - target) ? b : a), leadHours[0])
}

export default function LiveWeatherField({ field, leadH }) {
  const canvasRef = useRef(null)
  const [imgUrl, setImgUrl] = useState(null)
  const lead = field ? nearestLead(field.leadHours, leadH) : null
  const grid = field?.grids?.[String(lead)]
  const nLat = field?.lat.length ?? 0
  const nLon = field?.lon.length ?? 0

  useEffect(() => {
    if (!grid) return
    const canvas = canvasRef.current
    canvas.width = nLon
    canvas.height = nLat
    const ctx = canvas.getContext('2d')
    const img = ctx.createImageData(nLon, nLat)
    for (let i = 0; i < nLat; i++) {
      for (let j = 0; j < nLon; j++) {
        const ws = grid[i * nLon + j]
        const [r, g, b, a] = colorAt(ws)
        const row = nLat - 1 - i // image row 0 = north, matching Leaflet's ImageOverlay convention
        const idx = (row * nLon + j) * 4
        img.data[idx] = r; img.data[idx + 1] = g; img.data[idx + 2] = b; img.data[idx + 3] = a * 255
      }
    }
    ctx.putImageData(img, 0, 0)
    setImgUrl(canvas.toDataURL())
  }, [grid, nLat, nLon])

  if (!field) return null
  const bounds = [[field.lat[0], field.lon[0]], [field.lat[field.lat.length - 1], field.lon[field.lon.length - 1]]]

  return (
    <div>
      <canvas ref={canvasRef} className="hidden" />
      <MapContainer bounds={bounds} style={{ height: 360, width: '100%', borderRadius: 8 }} scrollWheelZoom={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
        {imgUrl && <ImageOverlay url={imgUrl} bounds={bounds} opacity={0.9} />}
      </MapContainer>
      <div className="mt-2.5">
        <div className="flex justify-between text-[10.5px] text-muted mb-1">
          <span>Ensemble-mean 10 m wind speed (m/s)</span>
          <span className="font-semibold text-ink">T+{lead} h</span>
        </div>
        <div className="h-2.5 rounded-full border border-line"
          style={{ background: `linear-gradient(90deg, ${STOPS.map(([v, [r, g, b, a]]) => `rgba(${r},${g},${b},${Math.max(a, 0.12)}) ${(v / WS_MAX) * 100}%`).join(', ')})` }} />
        <div className="relative h-4 text-[10px] text-muted tabular-nums">
          {TICKS.map((v) => (
            <span key={v} className={`absolute -translate-x-1/2 ${v === 17 ? 'font-semibold text-ink' : ''}`} style={{ left: `${(v / WS_MAX) * 100}%` }}>
              {v === WS_MAX ? `${v}+` : v}
            </span>
          ))}
        </div>
        <div className="text-[10px] text-muted">17 m/s = gale (IMD Cyclonic Storm threshold)</div>
      </div>
      <p className="text-[10.5px] text-muted mt-1.5 leading-snug">
        Real ensemble-mean wind speed (all members) — the everyday pattern, not a single storm's peak.
      </p>
    </div>
  )
}
