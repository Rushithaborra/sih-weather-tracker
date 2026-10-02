import React, { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, ImageOverlay, Polyline, Rectangle, CircleMarker, Tooltip } from 'react-leaflet'
import { Loader2, AlertTriangle, Wind, CloudRain, Thermometer, CalendarClock } from 'lucide-react'
import TimelineSlider from './TimelineSlider'
import { useLiveIfs, LAYERS, RAIN_CATS, rampColor, hoursSince } from '../lib/liveIfs'
import { fmtAgo, fmtInit } from '../lib/liveGefs'

const STATUS = {
  ok: { text: 'SYSTEM DETECTED', cls: 'bg-red-600' },
  no_system: { text: 'NO SYSTEM', cls: 'bg-emerald-500' },
  stale: { text: 'STALE', cls: 'bg-amber-500' },
  error: { text: 'ERROR', cls: 'bg-red-700' },
}

export default function IfsLive() {
  const { status, data, error } = useLiveIfs()
  if (status === 'loading') {
    return <Card><div className="flex items-center justify-center gap-2 text-muted text-[13px] py-8"><Loader2 size={16} className="animate-spin" /> Loading the latest IFS run…</div></Card>
  }
  if (status === 'unavailable') {
    return <Card><ErrorBox text={`IFS forecast unavailable (${error}). The run is published twice a day; check back after 08:30 or 20:30 UTC.`} /></Card>
  }
  if (data.status === 'error') {
    return (
      <div className="space-y-4">
        <Header data={data} />
        <Card><ErrorBox text={`The latest IFS run failed (${data.error}) at ${data.fetchedAt}. Nothing from that run is shown.`} /></Card>
        <Footer />
      </div>
    )
  }
  return <IfsView data={data} />
}

function Header({ data }) {
  const s = STATUS[data.status] ?? STATUS.error
  const stale = data.init && hoursSince(data.init) > 24 + 12
  return (
    <div className="bg-card rounded-card px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-[19px] font-bold text-ink leading-tight flex items-center gap-2.5">
          Live IFS forecast
          <span className={`text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full text-white ${s.cls}`}>{s.text}</span>
        </h1>
        <p className="text-[12.5px] text-muted mt-0.5">
          {data.model} — deterministic, one run, 0–240 h, Arabian Sea and Bay of Bengal (0–35°N, 60–100°E)
        </p>
        {stale && <p className="text-[11.5px] font-semibold text-amber-600 mt-1">Stale data: this run is more than 24 h old.</p>}
      </div>
      {data.init && (
        <div className="flex items-center gap-2 flex-wrap">
          <Chip>Run {fmtInit(data.init)}</Chip>
          <Chip>T+0 → 240 h</Chip>
          <Chip>updated {fmtAgo(data.fetchedAt)}</Chip>
        </div>
      )}
    </div>
  )
}

function IfsView({ data }) {
  const [layer, setLayer] = useState('windZ')
  const [leadH, setLeadH] = useState(() => data.systems[0]?.firstLeadH ?? 0)
  const strongest = data.systems.reduce((a, b) => (!a || b.maxWsMs > a.maxWsMs ? b : a), null)
  const heavyDay = data.rainDays.reduce((a, b) => (!a || b.cells.heavy + b.cells['very heavy'] + b.cells['extremely heavy'] > a.cells.heavy + a.cells['very heavy'] + a.cells['extremely heavy'] ? b : a), null)
  const t2mPeak = data.t2m.reduce((a, b) => (!a || b.unusualWarmCells + b.unusualColdCells > a.unusualWarmCells + a.unusualColdCells ? b : a), null)
  const heavyCells = (d) => d.cells.heavy + d.cells['very heavy'] + d.cells['extremely heavy']

  const cards = [
    { label: 'Organized systems', icon: Wind,
      value: data.systems.length ? `${data.systems.length}` : 'No organized system detected in this forecast run',
      text: !data.systems.length,
      sub: data.systems.length ? `strongest ${strongest.imdCategory}, ${strongest.maxWsMs} m/s, ${strongest.minMslHpa} hPa` : 'a normal result: most runs have none' },
    { label: 'Heaviest rain day (IMD 03–03 UTC)', icon: CloudRain,
      value: heavyDay ? `${heavyDay.maxMm} mm` : '—',
      sub: heavyDay ? `${heavyCells(heavyDay)} cells ≥ 64.5 mm · day ending ${heavyDay.imdDayEnding.slice(0, 10)}` : 'no IMD day in range' },
    { label: 'Unusual temperature (|z| ≥ 2)', icon: Thermometer,
      value: t2mPeak ? `${t2mPeak.unusualWarmCells + t2mPeak.unusualColdCells} cells` : '—',
      sub: t2mPeak ? `${t2mPeak.unusualWarmCells} warm / ${t2mPeak.unusualColdCells} cold · peak at T+${t2mPeak.leadH} h` : '' },
    { label: 'Forecast run', icon: CalendarClock, value: fmtInit(data.init), sub: `processed ${fmtAgo(data.fetchedAt)} in ${Math.round(data.runSeconds / 60)} min` },
  ]

  return (
    <div className="space-y-4">
      <Header data={data} />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-card rounded-card px-5 py-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-brand/10 text-brand"><c.icon size={13} strokeWidth={2.2} /></span>
              <div className="text-[12px] text-muted">{c.label}</div>
            </div>
            <div className={`font-bold text-brand ${c.text ? 'text-[15px] leading-snug' : 'text-[26px] leading-none'}`}>{c.value}</div>
            <div className="text-[11px] text-muted mt-2 leading-snug">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-4 items-start">
        <div className="bg-card rounded-card px-5 py-4">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
            <h3 className="font-bold text-ink text-[14.5px]">IFS fields and systems · T+{leadH} h</h3>
            <div className="flex items-center gap-0.5 bg-bg rounded-full p-0.5 flex-wrap">
              {Object.entries(LAYERS).map(([k, L]) => (
                <button key={k} onClick={() => setLayer(k)}
                  className={`text-[11px] font-semibold px-3 py-1 rounded-full transition-colors ${layer === k ? 'bg-brand text-white' : 'text-muted hover:text-ink'}`}>
                  {L.label}
                </button>
              ))}
            </div>
          </div>
          <IfsMap data={data} layer={layer} leadH={leadH} />
          <TimelineSlider value={leadH} onChange={setLeadH} max={240} step={6} tickStep={24} />
          <Legend layer={layer} />
        </div>

        <div className="space-y-4">
          <div className="bg-card rounded-card px-5 py-4">
            <h3 className="font-bold text-ink text-[14.5px] mb-2">Systems</h3>
            {data.systems.length === 0 ? (
              <p className="text-[12px] text-muted">No organized system detected in this forecast run — a normal result.</p>
            ) : (
              <table className="w-full text-[11.5px]">
                <thead>
                  <tr className="text-left text-muted border-b border-line">
                    {['#', 'Lead (h)', 'Min MSLP', 'Max wind', 'IMD cat.'].map((h) => <th key={h} className="py-1.5 pr-2 font-medium">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {data.systems.map((s) => (
                    <tr key={s.id} className="border-b border-line">
                      <td className="py-1.5 pr-2 text-ink">{s.id}</td>
                      <td className="py-1.5 pr-2 text-ink">{s.firstLeadH}–{s.lastLeadH}</td>
                      <td className="py-1.5 pr-2 text-ink">{s.minMslHpa} hPa</td>
                      <td className="py-1.5 pr-2 text-ink">{s.maxWsMs} m/s</td>
                      <td className="py-1.5 pr-2 text-ink">{s.imdCategory}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p className="text-[10.5px] text-muted mt-2">Skill decreases with lead time; beyond ~3 days treat systems as possibilities, not tracks.</p>
          </div>

          <div className="bg-card rounded-card px-5 py-4">
            <h3 className="font-bold text-ink text-[14.5px] mb-2">Rain by IMD day (24 h ending 03 UTC)</h3>
            <table className="w-full text-[11.5px]">
              <thead>
                <tr className="text-left text-muted border-b border-line">
                  {['Day ending', 'Max (mm)', '≥ 64.5', '≥ 115.6', '≥ 204.5'].map((h) => <th key={h} className="py-1.5 pr-2 font-medium">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.rainDays.map((d) => (
                  <tr key={d.imdDayEnding} className="border-b border-line">
                    <td className="py-1.5 pr-2 text-ink">{d.imdDayEnding.slice(0, 10)}</td>
                    <td className="py-1.5 pr-2 text-ink">{d.maxMm}</td>
                    <td className="py-1.5 pr-2 text-ink">{heavyCells(d)}</td>
                    <td className="py-1.5 pr-2 text-ink">{d.cells['very heavy'] + d.cells['extremely heavy']}</td>
                    <td className="py-1.5 pr-2 text-ink">{d.cells['extremely heavy']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10.5px] text-muted mt-2">Cell counts on the 0.25° grid. IMD days only to 144 h, where the 3-hourly steps reach 03 UTC.</p>
          </div>

          <div className="bg-card rounded-card px-5 py-4">
            <h3 className="font-bold text-ink text-[14.5px] mb-1">Official IMD warnings</h3>
            <p className="text-[12px] text-muted">Comparison layer (pending API access). No IMD data is shown until the endpoints are confirmed.</p>
          </div>
        </div>
      </div>
      <Footer data={data} />
    </div>
  )
}

function IfsMap({ data, layer, leadH }) {
  const canvasRef = useRef(null)
  const [url, setUrl] = useState(null)
  const f = data.fields
  const nLat = f.lat.length, nLon = f.lon.length
  const bounds = [[f.lat[0], f.lon[0]], [f.lat[nLat - 1], f.lon[nLon - 1]]]

  const grid = useMemo(() => {
    if (layer === 'rain') {
      const day = data.rainDays.find((d) => d.leadHEnd >= leadH) ?? data.rainDays[data.rainDays.length - 1]
      return day ? { values: day.categoryGrid, rain: true } : null
    }
    const L = LAYERS[layer]
    const nearest = f.leadHours.reduce((a, b) => (Math.abs(b - leadH) < Math.abs(a - leadH) ? b : a), f.leadHours[0])
    const vals = f[L.key][String(nearest)]
    return vals ? { values: L.negate ? vals.map((v) => -v) : vals, rain: false } : null
  }, [data, f, layer, leadH])

  useEffect(() => {
    if (!grid) return
    const c = canvasRef.current
    c.width = nLon; c.height = nLat
    const ctx = c.getContext('2d')
    const img = ctx.createImageData(nLon, nLat)
    for (let i = 0; i < nLat; i++) {
      for (let j = 0; j < nLon; j++) {
        const v = grid.values[i * nLon + j]
        const [r, g, b, a] = grid.rain ? RAIN_CATS[v].color : rampColor(LAYERS[layer].stops, v)
        const k = ((nLat - 1 - i) * nLon + j) * 4
        img.data[k] = r; img.data[k + 1] = g; img.data[k + 2] = b; img.data[k + 3] = a * 255
      }
    }
    ctx.putImageData(img, 0, 0)
    setUrl(c.toDataURL())
  }, [grid, nLat, nLon, layer])

  const now = data.systems.map((s) => ({ s, p: s.points.reduce((a, b) => (Math.abs(b.leadH - leadH) < Math.abs(a.leadH - leadH) ? b : a), s.points[0]) }))
    .filter(({ p }) => Math.abs(p.leadH - leadH) <= 3)

  return (
    <div className="relative">
      <canvas ref={canvasRef} className="hidden" />
      <MapContainer bounds={bounds} style={{ height: 460, width: '100%', borderRadius: 8 }} scrollWheelZoom={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors · ECMWF open data (CC-BY-4.0)" />
        {url && <ImageOverlay url={url} bounds={bounds} opacity={0.85} />}
        {data.systems.map((s) => (
          <Polyline key={s.id} positions={s.points.map((p) => [p.lat, p.lon])} pathOptions={{ color: '#16293D', weight: 2.5 }} />
        ))}
        {now.map(({ s, p }) => (
          <React.Fragment key={s.id}>
            <Rectangle bounds={[[p.box[0], p.box[2]], [p.box[1], p.box[3]]]} pathOptions={{ color: '#C2185B', weight: 1.5, dashArray: '5 4', fill: false }} />
            <CircleMarker center={[p.lat, p.lon]} radius={7} pathOptions={{ color: '#16293D', weight: 1, fillColor: '#E67E22', fillOpacity: 0.95 }}>
              <Tooltip direction="top" opacity={1}>
                <div className="text-[11px]"><div className="font-semibold">System {s.id} · {s.imdCategory}</div><div>T+{p.leadH} h · {p.maxWs} m/s · {p.minMsl} hPa</div></div>
              </Tooltip>
            </CircleMarker>
          </React.Fragment>
        ))}
      </MapContainer>
      {data.systems.length === 0 && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] rounded-full px-4 py-1.5 text-[12px] font-semibold text-ink shadow border border-line whitespace-nowrap" style={{ background: 'var(--card)' }}>
          No organized system detected in this forecast run
        </div>
      )}
    </div>
  )
}

function Legend({ layer }) {
  if (layer === 'rain') {
    return (
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[10.5px] text-muted">
        {RAIN_CATS.slice(1).map((c) => (
          <span key={c.label} className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: `rgba(${c.color.slice(0, 3).join(',')},${c.color[3]})` }} />{c.label}</span>
        ))}
        <span>· shown: IMD day ending at or after the slider time</span>
      </div>
    )
  }
  const L = LAYERS[layer]
  const lo = L.stops[0][0], hi = L.stops[L.stops.length - 1][0]
  return (
    <div className="mt-2">
      <div className="flex justify-between text-[10.5px] text-muted mb-1"><span>{L.label}{L.negate ? ' — stronger colour = lower pressure than normal' : ''}</span><span>{L.unit}</span></div>
      <div className="h-2.5 rounded-full border border-line" style={{ background: `linear-gradient(90deg, ${L.stops.map(([v, c]) => `rgba(${c[0]},${c[1]},${c[2]},${Math.max(c[3], 0.1)}) ${((v - lo) / (hi - lo)) * 100}%`).join(', ')})` }} />
      <div className="relative h-4 text-[10px] text-muted tabular-nums">
        {L.ticks.map((t) => <span key={t} className="absolute -translate-x-1/2" style={{ left: `${((t - lo) / (hi - lo)) * 100}%` }}>{t}</span>)}
      </div>
      <div className="text-[10px] text-muted">Anomalies against ERA5 2015–2019 for the same month and UTC hour; fields every 24 h at 0.5°.</div>
    </div>
  )
}

function Footer({ data }) {
  return (
    <div className="bg-card rounded-card px-5 py-3 text-[11px] text-muted leading-relaxed">
      <span className="font-semibold text-ink">Research prototype.</span> Live output is unvalidated forecast guidance, not an official warning.
      Official warnings: IMD (mausam.imd.gov.in). {data?.caveats?.slice(1, 3).join(' ')} Credits: ECMWF open data (CC-BY-4.0), ERA5 / WeatherBench2.
    </div>
  )
}

function Card({ children }) {
  return <div className="bg-card rounded-card px-6 py-6">{children}</div>
}

function ErrorBox({ text }) {
  return <div className="flex items-center gap-2 text-[12.5px] text-red-600 bg-red-500/10 rounded-lg px-3 py-3"><AlertTriangle size={14} /> {text}</div>
}

function Chip({ children }) {
  return <span className="text-[11.5px] font-medium bg-bg text-ink rounded-full px-3.5 py-1.5">{children}</span>
}
