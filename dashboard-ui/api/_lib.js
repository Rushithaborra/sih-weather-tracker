// Shared helpers for the alerts API (Vercel serverless functions; files starting with _ are not routes).

export const CASES = ['amphan', 'yaas', 'phailin', 'hudhud', 'titli', 'fani', 'bulbul', 'nivar']
export const LIVE = {
  ifs: 'https://raw.githubusercontent.com/Rushithaborra/sih-weather-tracker/live-data/ifs_latest.json',
  gefs: 'https://raw.githubusercontent.com/Rushithaborra/sih-weather-tracker/main/dashboard-ui/public/live/gefs_latest.json',
}
export const DISCLAIMER = 'Research prototype output (SIH 2026, PS 26078). Not an official warning. Official warnings: IMD (mausam.imd.gov.in).'
export const TIER_RANK = { none: 0, low: 1, moderate: 2, severe: 3 }

export function origin(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host
  return `https://${host}`
}

export async function getJson(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(20000) })
  if (!r.ok) throw new Error(`upstream ${r.status} for ${url}`)
  return r.json()
}

export function send(res, status, body, { type = 'application/json', maxAge = 300 } = {}) {
  res.setHeader('Content-Type', `${type}; charset=utf-8`)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', `public, s-maxage=${maxAge}, stale-while-revalidate=600`)
  res.status(status).send(type === 'application/json' ? JSON.stringify(body, null, 2) : body)
}

export function num(v) {
  const x = Number.parseFloat(v)
  return Number.isFinite(x) ? x : null
}

// Haversine distance in km
export function km(lat1, lon1, lat2, lon2) {
  const r = Math.PI / 180
  const a = Math.sin(((lat2 - lat1) * r) / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lon2 - lon1) * r) / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(a))
}

export function xml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
