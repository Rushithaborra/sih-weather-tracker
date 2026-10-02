import React, { useEffect, useState } from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'
import { CITIES, fetchCurrent, fetchEnsembleDays, fetchRunTime, rainCategory } from '../lib/openMeteo'

const fmtDay = (d) => d.toLocaleString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' })
const fmtRun = (d) => `${d.toLocaleString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' })} ${String(d.getUTCHours()).padStart(2, '0')}Z`
const pct = (x) => `${Math.round(x * 100)}%`

export default function CityWeatherPanel() {
  const [current, setCurrent] = useState({ status: 'loading' })
  const [run, setRun] = useState(null)
  const [city, setCity] = useState(CITIES[0])
  const [ens, setEns] = useState({ status: 'loading' })

  useEffect(() => {
    fetchCurrent().then((rows) => setCurrent({ status: 'ok', rows })).catch((e) => setCurrent({ status: 'error', error: e.message }))
    fetchRunTime().then(setRun).catch(() => setRun(null))
  }, [])

  useEffect(() => {
    let alive = true
    setEns({ status: 'loading' })
    fetchEnsembleDays(city)
      .then((r) => alive && setEns({ status: r.days.length ? 'ok' : 'error', ...r, error: r.days.length ? null : 'no complete days returned' }))
      .catch((e) => alive && setEns({ status: 'error', error: e.message }))
    return () => { alive = false }
  }, [city])

  return (
    <div className="bg-card rounded-card px-5 py-4">
      <div className="flex items-baseline justify-between flex-wrap gap-1 mb-1">
        <h3 className="font-bold text-ink text-[14.5px]">City weather</h3>
        <span className="text-[11px] text-muted">
          ECMWF IFS ensemble 0.25°{ens.members ? ` (${ens.members} members)` : ''}{run ? `, run ${fmtRun(run)}` : ''} · via Open-Meteo
        </span>
      </div>
      <p className="text-[11.5px] font-semibold text-amber-600 mb-3">
        Live, unvalidated point forecast; not the tracking pipeline. Official warnings: IMD (mausam.imd.gov.in).
      </p>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-5">
        <div>
          <div className="text-[11.5px] font-semibold text-ink mb-1.5">Now (Open-Meteo forecast API)</div>
          {current.status === 'loading' && <Loading />}
          {current.status === 'error' && <ErrorBox text={`Current conditions unavailable (${current.error}).`} />}
          {current.status === 'ok' && (
            <table className="w-full text-[11.5px]">
              <thead>
                <tr className="text-left text-muted border-b border-line">
                  {['City', 'Temp (°C)', 'Wind (m/s)', 'Rain (mm)', 'MSLP (hPa)'].map((h) => <th key={h} className="py-1.5 pr-3 font-medium">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {current.rows.map((r) => (
                  <tr key={r.name} onClick={() => setCity(r)}
                    className={`border-b border-line cursor-pointer ${r.name === city.name ? 'bg-bg font-semibold' : 'hover:bg-bg'}`}>
                    <td className="py-1.5 pr-3 text-ink font-medium">{r.name}</td>
                    <td className="py-1.5 pr-3 text-ink tabular-nums">{r.current?.temperature_2m ?? '—'}</td>
                    <td className="py-1.5 pr-3 text-ink tabular-nums">{r.current?.wind_speed_10m ?? '—'}</td>
                    <td className="py-1.5 pr-3 text-ink tabular-nums">{r.current?.precipitation ?? '—'}</td>
                    <td className="py-1.5 pr-3 text-ink tabular-nums">{r.current?.pressure_msl ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="text-[10.5px] text-muted mt-1.5">Click a city for its 10-day ensemble outlook.</p>
        </div>

        <div>
          <div className="text-[11.5px] font-semibold text-ink mb-1.5">{city.name}: next days (IMD rainfall day, 03–03 UTC)</div>
          {ens.status === 'loading' && <Loading />}
          {ens.status === 'error' && <ErrorBox text={`Ensemble forecast unavailable (${ens.error}).`} />}
          {ens.status === 'ok' && (
            <table className="w-full text-[11.5px]">
              <thead>
                <tr className="text-left text-muted border-b border-line">
                  {['Day from', 'Members ≥ 17 m/s', '≥ 25 m/s', 'Median 24 h rain', 'IMD category'].map((h) => <th key={h} className="py-1.5 pr-3 font-medium">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {ens.days.map((d) => {
                  const cat = rainCategory(d.medianRain)
                  return (
                    <tr key={d.start.toISOString()} className="border-b border-line">
                      <td className="py-1.5 pr-3 text-ink">{fmtDay(d.start)} 03Z</td>
                      <td className="py-1.5 pr-3 text-ink tabular-nums">{pct(d.ge17)}</td>
                      <td className="py-1.5 pr-3 text-ink tabular-nums">{pct(d.ge25)}</td>
                      <td className="py-1.5 pr-3 text-ink tabular-nums">{d.medianRain.toFixed(1)} mm</td>
                      <td className="py-1.5 pr-3">
                        <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: cat.color }}>{cat.label}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <p className="text-[10.5px] text-muted mt-3">
        Weather data by <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="text-brand hover:underline">Open-Meteo.com</a> (CC BY 4.0),
        ECMWF IFS ensemble. Wind thresholds: 17 m/s gale (IMD Cyclonic Storm), 25 m/s IMD Severe Cyclonic Storm.
      </p>
    </div>
  )
}

function Loading() {
  return <div className="flex items-center gap-2 text-muted text-[12px] py-6 justify-center"><Loader2 size={14} className="animate-spin" /> Loading…</div>
}

function ErrorBox({ text }) {
  return (
    <div className="flex items-center gap-2 text-[12px] text-red-600 bg-red-500/10 rounded-lg px-3 py-3">
      <AlertTriangle size={14} /> {text}
    </div>
  )
}
