// Concept mock-up data — matches the pitch deck's "FORECASTER DASHBOARD — CONCEPT MOCK-UP" slide
// exactly (Bay of Bengal super-cyclone replay, illustrative/synthetic, NEPS-G 00 UTC, 23 members).
// This is the deck's own vision screen, not the validated pipeline output (see data/cases.js for that).
import { mulberry32 } from '../lib/rng'

// [lon, lat], 12-hourly. index 0 = T-12h, index 1 = T+0.
export const MEAN_TRACK_LONLAT = [
  [86.5, 10.4], [86.3, 11.0], [86.2, 11.8], [86.3, 12.6], [86.3, 13.4], [86.5, 14.6],
  [86.8, 16.2], [87.2, 17.8], [87.7, 19.6], [88.3, 21.6], [89.2, 23.5], [89.6, 25.0],
]
export const CATEGORIES_BY_INDEX = ['D', 'CS', 'SCS', 'ESCS', 'SuCS', 'SuCS', 'ESCS', 'ESCS', 'ESCS', 'VSCS', 'CS', 'D']

export const CATEGORY_COLORS = {
  D: '#7FB3D5', CS: '#2E86C1', SCS: '#16A085', VSCS: '#F1C40F', ESCS: '#E67E22', SuCS: '#C0392B',
}
export const CATEGORY_LABELS = {
  D: 'Depression', CS: 'Cyclonic Storm', SCS: 'Severe Cyclonic Storm',
  VSCS: 'Very Severe Cyclonic Storm', ESCS: 'Extremely Severe Cyclonic Storm', SuCS: 'Super Cyclonic Storm',
}

// hour for each mean-track index, T+0 at index 1
export const MEAN_TRACK_T = MEAN_TRACK_LONLAT.map((_, i) => (i - 1) * 12)

export const N_MEMBERS = 23
export const RAIN_CORE = { lat: 21.51, lon: 88.09 }
export const LANDFALL_T = 96

export const KPIS = {
  activeAnomalies: { value: 3, sub: '1 severe, 1 moderate, 1 low' },
  peakEfi: { value: 0.94, sub: 'rainfall, T+96 h' },
  membersAgreeing: { value: '19 / 23', sub: 'landfall within 100 km' },
  leadTime: { value: '96 h', sub: 'West Bengal coast' },
}

export const ALERTS = [
  {
    tier: 'severe', title: 'Extreme rain core', location: '21.51°N, 88.09°E', radius: '5 km radius',
    metric: 'P(≥204.5 mm/24 h) = 0.72', lead: 'T+96 h', tag: 'CAP ready',
  },
  {
    tier: 'moderate', title: 'Very heavy rain band', location: 'North Odisha coast', radius: '15 km',
    metric: 'EFI 0.81', lead: 'T+84 h', tag: 'Watch',
  },
  {
    tier: 'low', title: 'Heavy rain watch', location: 'Kolkata – Howrah', radius: '30 km',
    metric: 'EFI 0.62', lead: 'T+102 h', tag: 'Watch',
  },
]

export const ALERT_API_SAMPLE = {
  event_id: 'BOB-2020-01',
  hazard: 'extreme_rain',
  core: [21.51, 88.09],
  radius_km: 5,
  level: 'SEVERE',
  p_exceed_204mm: 0.72,
  lead_h: 96,
  cap: '/v1/cap/BOB-2020-01.xml',
}

// mm/24h colour scale for the 5 km zoom field
export const RAIN_COLOR_STOPS = [
  [0, '#F4F7FB'], [10, '#CFE6F7'], [35, '#8CC6EE'], [65, '#3F92D8'], [115, '#27AE60'],
  [160, '#F4D03F'], [204.5, '#F39C12'], [250, '#E03A2F'], [320, '#8E1B6B'],
]
export const RAIN_PEAK_MM = 292

export const VALIDATION_PLAN = [
  { label: 'Tracking', desc: 'position error and hit rate vs IMD best track' },
  { label: 'Extremes', desc: 'CRPS, rank histogram, 99th percentile and power spectrum vs 4 km target' },
  { label: 'Alerts', desc: 'POD / FAR / CSI at 5 km against IMD gauges' },
  { label: 'Baselines', desc: 'bicubic and MSE U-Net — ours must beat both' },
  { label: 'Case replay', desc: 'Amphan 2020 — NEPS-G already gave 30–50% day-5 odds of very heavy rain; we test if it is flagged automatically' },
]

export const DATA_SOURCES = [
  { name: 'NEPS-G', detail: '12 km, 23 members, 10 days — NCMRWF' },
  { name: 'NCUM-G', detail: '12 km deterministic — NCMRWF' },
  { name: 'ERA5', detail: '0.25° hourly reanalysis, 1940–present — Copernicus' },
  { name: 'IMDAA', detail: '12 km Indian regional reanalysis, 1979–2020 — NCMRWF' },
  { name: 'IMD observations', detail: 'Gridded rain, AWS and RSMC best tracks' },
  { name: 'GPM IMERG', detail: 'Satellite precipitation — NASA' },
  { name: 'Copernicus DEM', detail: 'GLO-30 terrain, for downscaling' },
]

function lerpColor(stops, v) {
  if (v <= stops[0][0]) return stops[0][1]
  for (let i = 0; i < stops.length - 1; i++) {
    const [v0, c0] = stops[i], [v1, c1] = stops[i + 1]
    if (v <= v1) {
      const f = (v - v0) / (v1 - v0)
      const a = hexToRgb(c0), b = hexToRgb(c1)
      const r = Math.round(a[0] + (b[0] - a[0]) * f)
      const g = Math.round(a[1] + (b[1] - a[1]) * f)
      const bl = Math.round(a[2] + (b[2] - a[2]) * f)
      return `rgb(${r},${g},${bl})`
    }
  }
  return stops[stops.length - 1][1]
}
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
export { lerpColor }

// Interpolate the mean track (by hour) using index 1 as T+0; clamps at both ends.
export function meanTrackAt(t) {
  const idx = 1 + t / 12
  const i0 = Math.max(0, Math.min(MEAN_TRACK_LONLAT.length - 1, Math.floor(idx)))
  const i1 = Math.max(0, Math.min(MEAN_TRACK_LONLAT.length - 1, Math.ceil(idx)))
  const f = idx - i0
  const [lon0, lat0] = MEAN_TRACK_LONLAT[i0]
  const [lon1, lat1] = MEAN_TRACK_LONLAT[i1]
  return { lat: lat0 + (lat1 - lat0) * f, lon: lon0 + (lon1 - lon0) * f }
}

// 23-member perturbation: 0 spread at T+0, ~1 degree by T+96, seeded per member for stability.
export function memberTrackPositions(memberIndex, seedBase = 1000) {
  const rnd = mulberry32(seedBase + memberIndex * 977)
  const angle = rnd() * Math.PI * 2
  const speed = 0.55 + rnd() * 0.9
  return MEAN_TRACK_T.map((t, i) => {
    const [lon, lat] = MEAN_TRACK_LONLAT[i]
    const growth = Math.max(0, t) / 96 // 0 at T+0, 1 at T+96, grows beyond
    const spread = growth * speed
    return {
      t, lat: lat + Math.sin(angle + t * 0.02) * spread * 0.6,
      lon: lon + Math.cos(angle + t * 0.015) * spread,
    }
  })
}
