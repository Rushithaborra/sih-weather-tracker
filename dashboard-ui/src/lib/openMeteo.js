// Client-side point forecasts from Open-Meteo (no key): current conditions from the
// forecast API, and the ECMWF IFS ensemble (0.25 deg, 51 members) from the ensemble API.
// Independent of the tracking pipeline -- shown on the Live page as unvalidated guidance.

export const CITIES = [
  { name: 'Chennai', lat: 13.08, lon: 80.27 },
  { name: 'Nellore', lat: 14.44, lon: 79.99 },
  { name: 'Visakhapatnam', lat: 17.69, lon: 83.22 },
  { name: 'Kakinada', lat: 16.99, lon: 82.25 },
  { name: 'Puri', lat: 19.81, lon: 85.83 },
  { name: 'Paradip', lat: 20.32, lon: 86.61 },
  { name: 'Balasore', lat: 21.49, lon: 86.93 },
  { name: 'Digha', lat: 21.63, lon: 87.55 },
  { name: 'Kolkata', lat: 22.57, lon: 88.36 },
  { name: 'Port Blair', lat: 11.62, lon: 92.73 },
  { name: 'Mumbai', lat: 19.08, lon: 72.88 },
  { name: 'Kochi', lat: 9.93, lon: 76.27 },
]

// IMD 24 h rainfall categories (mm)
const RAIN_CATS = [
  [204.5, 'Extremely heavy', '#7B1FA2'], [115.6, 'Very heavy', '#C0392B'], [64.5, 'Heavy', '#E67E22'],
  [15.6, 'Moderate', '#2E86C1'], [2.5, 'Light', '#5DADE2'], [0.1, 'Very light', '#AED6F1'], [0, 'No rain', '#B0BEC5'],
]
export function rainCategory(mm) {
  const c = RAIN_CATS.find(([min]) => mm >= min) ?? RAIN_CATS[RAIN_CATS.length - 1]
  return { label: c[1], color: c[2] }
}

const TIMEOUT_MS = 30000

async function getJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchCurrent() {
  const q = new URLSearchParams({
    latitude: CITIES.map((c) => c.lat).join(','), longitude: CITIES.map((c) => c.lon).join(','),
    current: 'temperature_2m,wind_speed_10m,precipitation,pressure_msl', wind_speed_unit: 'ms', timezone: 'GMT',
  })
  const d = await getJson(`https://api.open-meteo.com/v1/forecast?${q}`)
  return (Array.isArray(d) ? d : [d]).map((x, i) => ({ ...CITIES[i], current: x.current }))
}

export async function fetchRunTime() {
  const m = await getJson('https://ensemble-api.open-meteo.com/data/ecmwf_ifs025_ensemble/static/meta.json')
  return new Date(m.last_run_initialisation_time * 1000)
}

// Per IMD rainfall day (03-03 UTC), using only complete 24 h windows:
// share of members whose max wind reaches 17 / 25 m/s, and the median member 24 h rainfall.
export async function fetchEnsembleDays(city) {
  const q = new URLSearchParams({
    latitude: city.lat, longitude: city.lon, hourly: 'wind_speed_10m,precipitation', models: 'ecmwf_ifs025',
    forecast_days: 10, wind_speed_unit: 'ms', timezone: 'GMT',
  })
  const h = (await getJson(`https://ensemble-api.open-meteo.com/v1/ensemble?${q}`)).hourly
  const members = Object.keys(h).filter((k) => k.startsWith('wind_speed_10m'))
  const times = h.time.map((t) => new Date(`${t}:00Z`).getTime())
  const days = []
  const first = new Date(times[0])
  let start = Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), first.getUTCDate(), 3)
  if (start < times[0]) start += 864e5
  for (; ; start += 864e5) {
    const idx = times.map((t, i) => (t > start && t <= start + 864e5 ? i : -1)).filter((i) => i >= 0)
    if (idx.length < 24) break
    const maxWs = [], rain = []
    for (const k of members) {
      const p = k.replace('wind_speed_10m', 'precipitation')
      const ws = idx.map((i) => h[k][i]), pr = idx.map((i) => h[p]?.[i])
      if (ws.some((v) => v == null) || pr.some((v) => v == null)) continue
      maxWs.push(Math.max(...ws))
      rain.push(pr.reduce((a, b) => a + b, 0))
    }
    if (!maxWs.length) break
    rain.sort((a, b) => a - b)
    const median = rain.length % 2 ? rain[(rain.length - 1) / 2] : (rain[rain.length / 2 - 1] + rain[rain.length / 2]) / 2
    days.push({
      start: new Date(start), members: maxWs.length,
      ge17: maxWs.filter((v) => v >= 17).length / maxWs.length,
      ge25: maxWs.filter((v) => v >= 25).length / maxWs.length,
      medianRain: median,
    })
  }
  return { members: members.length, days }
}
