import React, { useMemo } from 'react'
import { MapContainer, TileLayer, Polyline, Rectangle, CircleMarker, Circle, Tooltip } from 'react-leaflet'
import { useCase } from '../context/CaseContext'
import {
  MEAN_TRACK_LONLAT, MEAN_TRACK_T, CATEGORIES_BY_INDEX, CATEGORY_COLORS, CATEGORY_LABELS,
  N_MEMBERS, RAIN_CORE, memberTrackPositions, meanTrackAt,
} from '../data/concept'

const BOUNDS = [[8, 78], [26, 98]]
const BOX_TS = [24, 48, 72, 96]
const BOX_MARGIN = 0.45

function boxAt(t, members) {
  const lats = [], lons = []
  members.forEach((track) => {
    const p = track.find((pt) => pt.t === t)
    if (p) { lats.push(p.lat); lons.push(p.lon) }
  })
  if (!lats.length) return null
  return [Math.min(...lats) - BOX_MARGIN, Math.max(...lats) + BOX_MARGIN, Math.min(...lons) - BOX_MARGIN, Math.max(...lons) + BOX_MARGIN]
}

export default function ConceptMap() {
  const { conceptT } = useCase()
  const members = useMemo(() => Array.from({ length: N_MEMBERS }, (_, i) => memberTrackPositions(i)), [])
  const meanLine = useMemo(() => MEAN_TRACK_LONLAT.map(([lon, lat]) => [lat, lon]), [])
  const now = useMemo(() => meanTrackAt(conceptT), [conceptT])
  const nearestBoxT = useMemo(
    () => BOX_TS.reduce((best, bt) => (Math.abs(bt - conceptT) < Math.abs(best - conceptT) ? bt : best), BOX_TS[0]),
    [conceptT],
  )

  return (
    <MapContainer
      center={[17.5, 88]}
      zoom={6}
      minZoom={5}
      maxBounds={BOUNDS}
      maxBoundsViscosity={0.8}
      style={{ height: 460, width: '100%', borderRadius: 8 }}
      scrollWheelZoom={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />

      {members.map((track, i) => (
        <Polyline
          key={i}
          positions={track.filter((p) => p.t <= 96).map((p) => [p.lat, p.lon])}
          pathOptions={{ color: '#8a94a3', weight: 1, opacity: 0.35 }}
        />
      ))}

      {BOX_TS.map((bt) => {
        const b = boxAt(bt, members)
        if (!b) return null
        const [latMin, latMax, lonMin, lonMax] = b
        const active = bt === nearestBoxT
        return (
          <Rectangle
            key={bt}
            bounds={[[latMin, lonMin], [latMax, lonMax]]}
            pathOptions={{ color: '#C2185B', weight: active ? 2.2 : 1.4, dashArray: '5 4', fillOpacity: active ? 0.06 : 0.02 }}
          >
            <Tooltip direction="top" opacity={1}>{`T+${bt}h`}</Tooltip>
          </Rectangle>
        )
      })}

      <Polyline positions={meanLine} pathOptions={{ color: '#12213A', weight: 3 }} />
      {MEAN_TRACK_LONLAT.map(([lon, lat], i) => {
        const cat = CATEGORIES_BY_INDEX[i]
        return (
          <CircleMarker
            key={i}
            center={[lat, lon]}
            radius={6}
            pathOptions={{ color: '#12213A', weight: 1, fillColor: CATEGORY_COLORS[cat], fillOpacity: 0.95 }}
          >
            <Tooltip direction="top" opacity={1}>
              <div className="text-[11px]">
                <div className="font-semibold">{CATEGORY_LABELS[cat]} ({cat})</div>
                <div>T{MEAN_TRACK_T[i] >= 0 ? '+' : ''}{MEAN_TRACK_T[i]}h</div>
              </div>
            </Tooltip>
          </CircleMarker>
        )
      })}

      <Circle center={[RAIN_CORE.lat, RAIN_CORE.lon]} radius={5000} pathOptions={{ color: '#C0392B', weight: 2, fillOpacity: 0.1 }} />
      <Circle center={[RAIN_CORE.lat, RAIN_CORE.lon]} radius={15000} pathOptions={{ color: '#E67E22', weight: 1.5, dashArray: '4 4', fillOpacity: 0 }} />
      <CircleMarker center={[RAIN_CORE.lat, RAIN_CORE.lon]} radius={4} pathOptions={{ color: '#C0392B', fillColor: '#C0392B', fillOpacity: 1 }}>
        <Tooltip direction="right" permanent opacity={0.95}>
          <div className="text-[10.5px]">rain core {RAIN_CORE.lat}°N {RAIN_CORE.lon}°E<br />landfall T+96h</div>
        </Tooltip>
      </CircleMarker>

      <CircleMarker center={[now.lat, now.lon]} radius={9} pathOptions={{ color: '#0E7C86', weight: 3, fillColor: '#0E7C86', fillOpacity: 0.25 }}>
        <Tooltip direction="left" permanent opacity={0.95}>
          <div className="text-[11px] font-semibold">T+{conceptT}h</div>
        </Tooltip>
      </CircleMarker>
    </MapContainer>
  )
}
