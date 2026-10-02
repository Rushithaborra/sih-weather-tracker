import { useEffect, useState } from 'react'

// Written twice a day by .github/workflows/ifs-live.yml (scripts/live_update_ifs.py) to the orphan
// branch `live-data` -- read straight from GitHub, nothing bundled (a stale copy would mislead).
const URL = 'https://raw.githubusercontent.com/Rushithaborra/sih-weather-tracker/live-data/ifs_latest.json'

export function useLiveIfs() {
  const [state, setState] = useState({ status: 'loading', data: null })
  useEffect(() => {
    let alive = true
    fetch(`${URL}?t=${Math.floor(Date.now() / 6e5)}`, { cache: 'no-store', signal: AbortSignal.timeout(90000) })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status === 404 ? 'no IFS run published yet' : `HTTP ${r.status}`))))
      .then((data) => alive && setState({ status: 'ready', data }))
      .catch((e) => alive && setState({ status: 'unavailable', error: e.message }))
    return () => { alive = false }
  }, [])
  return state
}

// [value, [r, g, b, alpha]] ramps for the map layers; values below the first stop are transparent.
export const LAYERS = {
  windZ: {
    label: 'Wind anomaly (z)', unit: 'z', key: 'windZ',
    stops: [[1, [255, 255, 255, 0]], [2, [254, 217, 118, 0.55]], [3, [253, 141, 60, 0.75]], [4, [227, 26, 28, 0.85]], [6, [128, 0, 38, 0.9]]],
    ticks: [2, 3, 4, 6],
  },
  mslZ: {
    label: 'Pressure anomaly (z, low)', unit: '−z', key: 'mslZ', negate: true,
    stops: [[1, [255, 255, 255, 0]], [2, [158, 202, 225, 0.55]], [3, [66, 146, 198, 0.75]], [4, [8, 81, 156, 0.85]], [6, [63, 0, 125, 0.9]]],
    ticks: [2, 3, 4, 6],
  },
  t2mAnomK: {
    label: 'Temperature anomaly (K)', unit: 'K', key: 't2mAnomK', diverging: true,
    stops: [[-6, [33, 102, 172, 0.85]], [-3, [103, 169, 207, 0.65]], [-1, [209, 229, 240, 0.35]], [-0.5, [255, 255, 255, 0]],
      [0.5, [255, 255, 255, 0]], [1, [253, 219, 199, 0.35]], [3, [239, 138, 98, 0.65]], [6, [178, 24, 43, 0.85]]],
    ticks: [-6, -3, 0, 3, 6],
  },
  rain: { label: '24 h rain (IMD category)', key: 'rain' },
}

export const RAIN_CATS = [
  { label: 'none', color: [0, 0, 0, 0] }, { label: 'very light', color: [174, 214, 241, 0.45] },
  { label: 'light', color: [93, 173, 226, 0.6] }, { label: 'moderate', color: [46, 134, 193, 0.75] },
  { label: 'heavy', color: [230, 126, 34, 0.85] }, { label: 'very heavy', color: [192, 57, 43, 0.9] },
  { label: 'extremely heavy', color: [123, 31, 162, 0.95] },
]

export function rampColor(stops, v) {
  if (v == null || Number.isNaN(v) || v < stops[0][0]) return stops[0][1][3] === 0 ? [0, 0, 0, 0] : stops[0][1]
  for (let i = 0; i < stops.length - 1; i++) {
    const [v0, c0] = stops[i], [v1, c1] = stops[i + 1]
    if (v <= v1) {
      const f = (v - v0) / (v1 - v0)
      return c0.map((x, k) => x + (c1[k] - x) * f)
    }
  }
  return stops[stops.length - 1][1]
}

export function hoursSince(iso) {
  return (Date.now() - new Date(iso).getTime()) / 36e5
}
