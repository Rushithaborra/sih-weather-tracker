import React, { useMemo } from 'react'
import { MapContainer, TileLayer, Polyline, Rectangle, CircleMarker, Tooltip } from 'react-leaflet'
import { useCase, interpolateTrack } from '../context/CaseContext'
import { categoryFor } from '../lib/category'
import { fmtTime } from '../lib/format'

const BOUNDS = [[8, 78], [26, 98]]

export default function TrackMap() {
  const { data, t } = useCase()
  const track = data.track

  const pminLine = useMemo(() => track.map((p) => [p.pminLat, p.pminLon]), [track])
  const btLine = useMemo(() => track.map((p) => p.bt), [track])
  const boxTs = useMemo(() => [24, 48, 72, 96].filter((bt) => bt <= track[track.length - 1].t), [track])
  const now = useMemo(() => interpolateTrack(track, t), [track, t])
  const nearest = useMemo(() => track.reduce((b, p) => (Math.abs(p.t - t) < Math.abs(b.t - t) ? p : b), track[0]), [track, t])
  const nowCat = categoryFor(now.maxWs)

  return (
    <MapContainer
      center={data.center}
      zoom={6}
      minZoom={5}
      maxBounds={BOUNDS}
      maxBoundsViscosity={0.8}
      style={{ height: 460, width: '100%', borderRadius: 8 }}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />

      {boxTs.map((bt) => {
        const p = track.reduce((best, pt) => (Math.abs(pt.t - bt) < Math.abs(best.t - bt) ? pt : best), track[0])
        const [latMin, latMax, lonMin, lonMax] = p.box
        return (
          <Rectangle
            key={bt}
            bounds={[[latMin, lonMin], [latMax, lonMax]]}
            pathOptions={{ color: '#C2185B', weight: 1.5, dashArray: '5 4', fillOpacity: 0.03 }}
          >
            <Tooltip direction="top" opacity={1} permanent={false}>{`T+${bt}h`}</Tooltip>
          </Rectangle>
        )
      })}

      <Polyline positions={btLine} pathOptions={{ color: '#16293D', weight: 1.5, dashArray: '6 5' }} />
      {track.map((p) => (
        <CircleMarker key={`bt-${p.t}`} center={p.bt} radius={2.5} pathOptions={{ color: '#16293D', fillColor: '#16293D', fillOpacity: 1 }} />
      ))}

      <Polyline positions={pminLine} pathOptions={{ color: '#16293D', weight: 3 }} />
      {track.map((p) => {
        const cat = categoryFor(p.maxWs)
        return (
          <CircleMarker
            key={p.t}
            center={[p.pminLat, p.pminLon]}
            radius={6}
            pathOptions={{ color: '#16293D', weight: 1, fillColor: cat.color, fillOpacity: 0.95 }}
          >
            <Tooltip direction="top" opacity={1}>
              <div className="text-[11px]">
                <div className="font-semibold">{cat.label} ({cat.code})</div>
                <div>{fmtTime(p.time)}</div>
                <div>{p.maxWs.toFixed(1)} m/s · {p.minMsl.toFixed(1)} hPa</div>
                <div className="text-muted">Track error {p.pminErrKm.toFixed(0)} km vs IBTrACS</div>
              </div>
            </Tooltip>
          </CircleMarker>
        )
      })}

      <CircleMarker
        center={[now.lat ?? nearest.pminLat, now.lon ?? nearest.pminLon]}
        radius={9}
        pathOptions={{ color: '#1D72B8', weight: 3, fillColor: '#1D72B8', fillOpacity: 0.25 }}
      >
        <Tooltip direction="right" permanent opacity={0.95}>
          <div className="text-[11px] font-semibold">T+{t}h · {nowCat.code}</div>
        </Tooltip>
      </CircleMarker>
    </MapContainer>
  )
}
