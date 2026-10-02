// GET /api/alerts?case=amphan[&lat=20.0&lon=87.75][&format=geojson]
// Alert tiers from a case study's sample time (pipeline/alerts.py output: z-score AND IMD wind gate,
// inside tracked-object boxes + 1 deg). With lat/lon: the tier of the 0.25 deg cell containing the
// point and the nearest cell at each tier. Without: counts per tier and the strongest cells.
import { CASES, DISCLAIMER, TIER_RANK, getJson, km, num, origin, send } from './_lib.js'

export default async function handler(req, res) {
  const id = String(req.query.case || '').toLowerCase()
  if (!CASES.includes(id)) {
    return send(res, 400, { error: `case must be one of ${CASES.join(', ')}`, example: '/api/alerts?case=amphan&lat=20.0&lon=87.75' })
  }
  let gj
  try {
    gj = await getJson(`${origin(req)}/${id}_alerts_sample.geojson`)
  } catch (e) {
    return send(res, 502, { error: e.message })
  }
  if (req.query.format === 'geojson') return send(res, 200, gj, { type: 'application/geo+json', maxAge: 86400 })

  const cells = gj.features.map((f) => f.properties)
  const counts = { low: 0, moderate: 0, severe: 0 }
  cells.forEach((c) => { counts[c.tier] += 1 })
  const body = {
    case: id, time: cells[0]?.time ?? null, variable: 'ws', cellDeg: 0.25, counts,
    tiers: { low: 'z >= 1.5 and wind >= 8.7 m/s (IMD Depression)', moderate: 'z >= 2 and wind >= 17 m/s (Cyclonic Storm)', severe: 'z >= 3 and wind >= 25 m/s (Severe Cyclonic Storm)' },
    disclaimer: DISCLAIMER,
  }
  const lat = num(req.query.lat), lon = num(req.query.lon)
  if (lat !== null && lon !== null) {
    const inCell = cells.find((c) => Math.abs(c.lat - lat) <= 0.125 && Math.abs(c.lon - lon) <= 0.125)
    body.point = { lat, lon, tier: inCell?.tier ?? 'none', cell: inCell ?? null }
    body.nearest = {}
    for (const tier of ['severe', 'moderate', 'low']) {
      const best = cells.filter((c) => c.tier === tier).reduce((a, c) => {
        const d = km(lat, lon, c.lat, c.lon)
        return !a || d < a.distanceKm ? { distanceKm: Math.round(d), lat: c.lat, lon: c.lon, z: c.z, windMs: c.wind_ms } : a
      }, null)
      body.nearest[tier] = best
    }
  } else {
    body.strongest = [...cells].sort((a, b) => TIER_RANK[b.tier] - TIER_RANK[a.tier] || b.z - a.z).slice(0, 10)
  }
  return send(res, 200, body, { maxAge: 86400 })
}
