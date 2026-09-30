import React, { useMemo, useState } from 'react'
import { MapContainer, TileLayer, Polyline, CircleMarker, Rectangle, Tooltip } from 'react-leaflet'
import { Users, AlertTriangle, Wind, CalendarClock, RefreshCw, Loader2 } from 'lucide-react'
import TimelineSlider from '../components/TimelineSlider'
import LiveWeatherField from '../components/LiveWeatherField'
import { useLiveGefs, fmtAgo, fmtInit, hoursAgo, positionsAt } from '../lib/liveGefs'
import { categoryFor } from '../lib/category'

const ACTIONS_URL = 'https://github.com/Rushithaborra/sih-weather-tracker/actions/workflows/gefs-live.yml'

export default function LiveForecast() {
  const { status, data } = useLiveGefs()

  if (status !== 'ready') {
    return (
      <div className="space-y-4">
        <Header />
        <div className="bg-card rounded-card px-6 py-10 text-center">
          {status === 'loading' ? (
            <div className="flex items-center justify-center gap-2 text-muted text-[13px]">
              <Loader2 size={16} className="animate-spin" /> Loading the latest GEFS run…
            </div>
          ) : (
            <>
              <div className="text-ink font-bold text-[15px] mb-1.5">Waiting for the first live run</div>
              <p className="text-[12.5px] text-muted max-w-xl mx-auto leading-relaxed">
                The daily GitHub Action hasn't published a forecast yet. Once the climatology is built and the
                first run finishes, the latest NOAA GEFS ensemble will appear here automatically.
              </p>
              <a href={ACTIONS_URL} target="_blank" rel="noreferrer" className="inline-block mt-3 text-[12px] font-semibold text-brand hover:underline">
                View the workflow on GitHub →
              </a>
            </>
          )}
        </div>
      </div>
    )
  }
  return <LiveView data={data} />
}

function Header({ data }) {
  const stale = data && hoursAgo(data.generatedAt) > 36
  return (
    <div className="bg-card rounded-card px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-[19px] font-bold text-ink leading-tight flex items-center gap-2.5">
          Live GEFS forecast
          <span className={`text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full text-white ${stale ? 'bg-amber-500' : 'bg-emerald-500'}`}>
            {stale ? 'STALE' : 'LIVE'}
          </span>
        </h1>
        <p className="text-[12.5px] text-muted mt-0.5">
          Latest NOAA GEFS v12 ensemble over the Bay of Bengal &amp; east India, run through the same detector and
          tracker every day
        </p>
      </div>
      {data && (
        <div className="flex items-center gap-2 flex-wrap">
          <Chip>Init {fmtInit(data.init)}</Chip>
          <Chip>{data.nMembers} members</Chip>
          <Chip>T+0 → {data.fxxEnd} h</Chip>
          <Chip>
            <span className="flex items-center gap-1.5">
              <RefreshCw size={11} /> updated {fmtAgo(data.generatedAt)}
            </span>
          </Chip>
        </div>
      )}
    </div>
  )
}

function LiveView({ data }) {
  const [leadH, setLeadH] = useState(() => data.summary.strongest?.leadH ?? 0)
  const s = data.summary
  const peakDomain = data.leads.reduce((a, b) => (b.domainMaxWsMax > a.domainMaxWsMax ? b : a), data.leads[0])
  const strongestCat = s.strongest && categoryFor(s.strongest.maxWs)

  const cards = [
    {
      label: 'Members tracking a system', icon: Users,
      value: s.membersWithSystem === 0 ? `No system detected in any of ${data.nMembers} members` : `${s.membersWithSystem} / ${data.nMembers}`,
      text: s.membersWithSystem === 0,
      sub: s.firstDetectionLeadH == null ? `none through T+${data.fxxEnd} h` : `first appears at T+${s.firstDetectionLeadH} h`,
    },
    {
      label: 'Severe-wind members (peak)', icon: AlertTriangle,
      value: s.peakSevere ? `${Math.round(s.peakSevere.fraction * 100)}%` : '0%',
      sub: s.peakSevere ? `reach the 25 m/s IMD Severe gate · T+${s.peakSevere.leadH} h` : 'no member reaches the 25 m/s gate',
    },
    {
      label: 'Strongest tracked wind', icon: Wind,
      value: s.strongest ? `${s.strongest.maxWs.toFixed(1)} m/s` : `${peakDomain.domainMaxWsMax.toFixed(1)} m/s`,
      sub: s.strongest
        ? `${strongestCat.code} · ${s.strongest.member === 'c00' ? 'control' : s.strongest.member} · T+${s.strongest.leadH} h · ${s.strongest.minMsl.toFixed(0)} hPa`
        : `domain max, no tracked system · T+${peakDomain.leadH} h`,
    },
    {
      label: 'Forecast run', icon: CalendarClock,
      value: fmtInit(data.init),
      sub: `processed ${fmtAgo(data.generatedAt)} in ${Math.round(data.runSeconds / 60)} min`,
    },
  ]

  return (
    <div className="space-y-4">
      <Header data={data} />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-card rounded-card px-5 py-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-brand/10 text-brand">
                <c.icon size={13} strokeWidth={2.2} />
              </span>
              <div className="text-[12px] text-muted">{c.label}</div>
            </div>
            <div className={`font-bold text-brand ${c.text ? 'text-[15px] leading-snug' : 'text-[26px] leading-none'}`}>{c.value}</div>
            <div className="text-[11px] text-muted mt-2 leading-snug">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-4 items-start">
        <div className="bg-card rounded-card px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-ink text-[14.5px]">{data.nMembers} forecast members</h3>
            <div className="flex items-center gap-3.5 text-[10.5px] text-muted flex-wrap">
              <span className="flex items-center gap-1.5"><span className="w-4 h-[2px] bg-[#1D72B8] inline-block" /> control</span>
              <span className="flex items-center gap-1.5"><span className="w-4 h-[2px] bg-[#8a94a3] inline-block" style={{ opacity: 0.5 }} /> {data.nMembers - 1} members</span>
              <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 border border-dashed inline-block border-muted" /> analysis region</span>
            </div>
          </div>
          <LiveMap data={data} leadH={leadH} />
          <TimelineSlider value={leadH} onChange={setLeadH} max={data.fxxEnd} step={data.fxxStep} tickStep={24} />
        </div>

        <div className="bg-card rounded-card px-5 py-4 space-y-4">
          <div className="flex items-baseline justify-between">
            <h3 className="font-bold text-ink text-[14.5px]">Ensemble signal over lead time</h3>
            <span className="text-[10.5px] text-muted">real, computed per member</span>
          </div>

          <div>
            <div className="text-[11.5px] font-semibold text-ink mb-1">Members with a tracked system</div>
            <Sparkline points={data.leads} valueKey="membersWithSystem" max={data.nMembers} color="#1D72B8" format={(v) => `${v}`} />
          </div>

          <div>
            <div className="text-[11.5px] font-semibold text-ink mb-1">Fraction of members forecasting Severe winds</div>
            <Sparkline points={data.leads} valueKey="severeFraction" max={1} color="#C0392B" format={(v) => `${Math.round(v * 100)}%`} />
          </div>

          <div>
            <div className="text-[11.5px] font-semibold text-ink mb-1">Strongest wind in the region (max member)</div>
            <Sparkline points={data.leads} valueKey="domainMaxWsMax" max={Math.max(30, ...data.leads.map((l) => l.domainMaxWsMax))} color="#E67E22" format={(v) => `${v.toFixed(0)} m/s`} />
          </div>

          <div className="pt-1 border-t border-line">
            <div className="text-[11.5px] font-semibold text-ink mb-1.5">This run</div>
            <div className="flex justify-between text-[11.5px]">
              <span className="text-ink">Init: <span className="font-semibold text-brand">{fmtInit(data.init)}</span></span>
              <span className="text-ink">Updated: <span className="font-semibold text-brand">{fmtAgo(data.generatedAt)}</span></span>
            </div>
            <div className="text-[10.5px] text-muted mt-1.5 leading-snug">
              {data.model}, run through the same detector and tracker as the case studies. Forecast only — no
              best track exists yet, so nothing here is validated. Currently viewing T+{leadH}h on the map.{' '}
              <a href={ACTIONS_URL} target="_blank" rel="noreferrer" className="text-brand font-semibold hover:underline">Run history →</a>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-card px-5 py-4">
        <div className="flex items-baseline justify-between flex-wrap gap-1 mb-2">
          <h3 className="font-bold text-ink text-[14.5px]">General weather</h3>
          <span className="text-[11px] text-muted">real wind field, shown every day — not just when there's a cyclone</span>
        </div>
        {data.field ? <LiveWeatherField field={data.field} leadH={leadH} /> : (
          <p className="text-[11.5px] text-muted italic py-8 text-center">
            This run predates the general-weather field export — re-run to see it.
          </p>
        )}
      </div>
    </div>
  )
}

function LiveMap({ data, leadH }) {
  const lines = useMemo(
    () => data.members.flatMap((m) => m.tracks.map((tr, i) => ({ key: `${m.id}-${i}`, control: m.id === 'c00', pts: tr.points.map((p) => [p.pminLat, p.pminLon]) }))),
    [data],
  )
  const now = useMemo(() => positionsAt(data.members, leadH), [data, leadH])
  const { lat, lon } = data.region

  return (
    <div className="relative">
      <MapContainer
        center={[(lat[0] + lat[1]) / 2, (lon[0] + lon[1]) / 2]}
        zoom={5}
        minZoom={4}
        style={{ height: 460, width: '100%', borderRadius: 8 }}
        scrollWheelZoom={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
        <Rectangle bounds={[[lat[0], lon[0]], [lat[1], lon[1]]]} pathOptions={{ color: '#5E7C93', weight: 1, dashArray: '4 4', fill: false }} />
        {lines.map((l) => (
          <Polyline key={l.key} positions={l.pts}
            pathOptions={{ color: l.control ? '#1D72B8' : '#8a94a3', weight: l.control ? 2.5 : 1.2, opacity: l.control ? 0.9 : 0.5 }} />
        ))}
        {now.map(({ id, track, p }) => {
          const cat = categoryFor(p.maxWs)
          return (
            <CircleMarker key={`${id}-${track}`} center={[p.pminLat, p.pminLon]} radius={id === 'c00' ? 7 : 5}
              pathOptions={{ color: '#16293D', weight: 1, fillColor: cat.color, fillOpacity: 0.9 }}>
              <Tooltip direction="top" opacity={1}>
                <div className="text-[11px]">
                  <div className="font-semibold">{id === 'c00' ? 'Control' : `Member ${id}`} · {cat.code}</div>
                  <div>T+{p.leadH} h · {p.maxWs.toFixed(1)} m/s · {p.minMsl.toFixed(1)} hPa</div>
                  <div>{p.pminLat.toFixed(2)}°N, {p.pminLon.toFixed(2)}°E</div>
                </div>
              </Tooltip>
            </CircleMarker>
          )
        })}
      </MapContainer>
      {data.summary.membersWithSystem === 0 && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] rounded-full px-4 py-1.5 text-[12px] font-semibold text-ink shadow border border-line whitespace-nowrap" style={{ background: 'var(--card)' }}>
          No cyclone-scale anomaly in any member through T+{data.fxxEnd} h
        </div>
      )}
    </div>
  )
}

function Sparkline({ points, valueKey, max, color, format }) {
  const w = 280, h = 56, pad = 4
  const xs = points.map((p) => p.leadH)
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const xAt = (x) => pad + ((x - minX) / (maxX - minX || 1)) * (w - 2 * pad)
  const yAt = (v) => h - pad - (v / max) * (h - 2 * pad)
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(p.leadH).toFixed(1)} ${yAt(p[valueKey]).toFixed(1)}`).join(' ')
  const peak = points.reduce((a, b) => (b[valueKey] > a[valueKey] ? b : a), points[0])
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-14">
      <path d={path} fill="none" stroke={color} strokeWidth="2" />
      <circle cx={xAt(peak.leadH)} cy={yAt(peak[valueKey])} r="3" fill={color} />
      <text x={Math.min(Math.max(xAt(peak.leadH), 16), w - 16)} y={Math.max(yAt(peak[valueKey]) - 6, 9)} fontSize="9" fill={color} textAnchor="middle" fontWeight="700">
        {format(peak[valueKey])}
      </text>
    </svg>
  )
}

function Chip({ children }) {
  return <span className="text-[11.5px] font-medium bg-bg text-ink rounded-full px-3.5 py-1.5">{children}</span>
}
