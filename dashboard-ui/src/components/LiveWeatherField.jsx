import React, { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, ImageOverlay } from 'react-leaflet'

// Real ensemble-mean 10 m wind speed over the whole analysis domain, every 24 h --
// general weather (monsoon flow, everyday wind pattern), not just cyclone-scale
// anomalies. Drawn as a semi-transparent overlay on a real basemap (coastlines,
// state borders) instead of a floating colour blob, so it's actually legible.
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
        const [r, g, b] = colorAt(ws / WS_MAX)
        const row = nLat - 1 - i // image row 0 = north, matching Leaflet's ImageOverlay convention
        const idx = (row * nLon + j) * 4
        img.data[idx] = r; img.data[idx + 1] = g; img.data[idx + 2] = b; img.data[idx + 3] = 210
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
        {imgUrl && <ImageOverlay url={imgUrl} bounds={bounds} opacity={0.72} />}
      </MapContainer>
      <div className="flex items-center gap-2 mt-2 text-[10px] text-muted">
        <span>0</span>
        <span className="flex-1 h-2 rounded-full" style={{ background: `linear-gradient(90deg, ${STOPS.map(([, [r, g, b]]) => `rgb(${r},${g},${b})`).join(',')})` }} />
        <span>25+ m/s</span>
        <span className="shrink-0 font-semibold text-ink">T+{lead}h</span>
      </div>
      <p className="text-[10.5px] text-muted mt-1.5 leading-snug">
        Real ensemble-mean wind speed (all members) — the everyday pattern, not a single storm's peak.
      </p>
    </div>
  )
}
