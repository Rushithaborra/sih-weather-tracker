import React, { useMemo } from 'react'
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip } from 'react-leaflet'
import { useCase } from '../context/CaseContext'
import { GEFS_META, GEFS_MEMBERS, GEFS_BEST_TRACK } from '../data/gefsEnsemble'
import { categoryFor } from '../lib/category'

const BOUNDS = [[8, 78], [26, 98]]

function nearestPoint(points, leadH, maxGapH = 12) {
  let best = null, bestDiff = Infinity
  for (const p of points) {
    const diff = Math.abs(p.leadH - leadH)
    if (diff < bestDiff) { bestDiff = diff; best = p }
  }
  return bestDiff <= maxGapH ? best : null
}

export default function GefsMap() {
  const { gefsLeadH } = useCase()
  const btLine = useMemo(() => GEFS_BEST_TRACK.map((p) => [p.lat, p.lon]), [])
  const nowByMember = useMemo(
    () => GEFS_MEMBERS.map((m) => ({ id: m.id, p: nearestPoint(m.points, gefsLeadH) })).filter((x) => x.p),
    [gefsLeadH],
  )

  return (
    <MapContainer
      center={GEFS_META.center}
      zoom={6}
      minZoom={5}
      maxBounds={BOUNDS}
      maxBoundsViscosity={0.8}
      style={{ height: 460, width: '100%', borderRadius: 8 }}
      scrollWheelZoom={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />

      {GEFS_MEMBERS.map((m) => (
        <Polyline
          key={m.id}
          positions={m.points.map((p) => [p.pminLat, p.pminLon])}
          pathOptions={{ color: m.id === 'c00' ? '#9C6B3E' : '#8a94a3', weight: m.id === 'c00' ? 2 : 1, opacity: m.id === 'c00' ? 0.85 : 0.45 }}
        />
      ))}

      <Polyline positions={btLine} pathOptions={{ color: '#3B2A20', weight: 2, dashArray: '6 5' }} />
      {GEFS_BEST_TRACK.map((p) => (
        <CircleMarker key={p.time} center={[p.lat, p.lon]} radius={2} pathOptions={{ color: '#3B2A20', fillColor: '#3B2A20', fillOpacity: 1 }} />
      ))}

      {nowByMember.map(({ id, p }) => {
        const cat = categoryFor(p.maxWs)
        return (
          <CircleMarker
            key={id}
            center={[p.pminLat, p.pminLon]}
            radius={id === 'c00' ? 7 : 5}
            pathOptions={{ color: '#3B2A20', weight: 1, fillColor: cat.color, fillOpacity: 0.9 }}
          >
            <Tooltip direction="top" opacity={1}>
              <div className="text-[11px]">
                <div className="font-semibold">{id === 'c00' ? 'Control' : id}</div>
                <div>T+{p.leadH}h · {p.maxWs.toFixed(1)} m/s</div>
              </div>
            </Tooltip>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
