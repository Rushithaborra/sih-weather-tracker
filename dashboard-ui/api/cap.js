// GET /api/cap?case=amphan     CAP 1.2 alert for a case study's alert snapshot (severe and moderate tiers)
// GET /api/cap?live=ifs        CAP 1.2 alert for the systems in the latest IFS run (none -> alert with no info)
// Always status "Exercise": research prototype output, never an operational warning.
import { CASES, DISCLAIMER, LIVE, getJson, origin, send, xml } from './_lib.js'

const SENDER = 'sih26078-prototype@cyclone-anomaly-tracker.vercel.app'
const SEVERITY = { severe: 'Severe', moderate: 'Moderate' }
const CAT_SEVERITY = { SuCS: 'Extreme', ESCS: 'Extreme', VSCS: 'Severe', SCS: 'Severe', CS: 'Moderate', DD: 'Minor', D: 'Minor' }

function header(id, sent, note) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>${xml(id)}</identifier>
  <sender>${SENDER}</sender>
  <sent>${sent}</sent>
  <status>Exercise</status>
  <msgType>Alert</msgType>
  <scope>Public</scope>
  <note>${xml(note)}</note>`
}

function info({ event, severity, urgency, certainty, headline, description, onset, area, polygon, circle }) {
  return `
  <info>
    <language>en-IN</language>
    <category>Met</category>
    <event>${xml(event)}</event>
    <urgency>${urgency}</urgency>
    <severity>${severity}</severity>
    <certainty>${certainty}</certainty>${onset ? `\n    <onset>${onset}</onset>` : ''}
    <senderName>Anomaly Tracker research prototype (SIH 2026, PS 26078)</senderName>
    <headline>${xml(headline)}</headline>
    <description>${xml(description)}</description>
    <web>https://cyclone-anomaly-tracker.vercel.app</web>
    <area>
      <areaDesc>${xml(area)}</areaDesc>${polygon ? `\n      <polygon>${polygon}</polygon>` : ''}${circle ? `\n      <circle>${circle}</circle>` : ''}
    </area>
  </info>`
}

const iso = (t) => new Date(t).toISOString().replace(/\.\d{3}Z$/, '+00:00')

function boxPolygon(cells) {
  const la0 = Math.min(...cells.map((c) => c.lat)) - 0.125, la1 = Math.max(...cells.map((c) => c.lat)) + 0.125
  const lo0 = Math.min(...cells.map((c) => c.lon)) - 0.125, lo1 = Math.max(...cells.map((c) => c.lon)) + 0.125
  return `${la0},${lo0} ${la0},${lo1} ${la1},${lo1} ${la1},${lo0} ${la0},${lo0}`
}

export default async function handler(req, res) {
  const now = iso(Date.now())
  if (req.query.live === 'ifs') {
    let d
    try { d = await getJson(LIVE.ifs) } catch (e) { return send(res, 502, { error: e.message }) }
    if (d.status === 'error') return send(res, 503, { error: `latest IFS run failed: ${d.error}` })
    let body = header(`sih26078-ifs-${d.init}`, now, `${DISCLAIMER} ECMWF IFS HRES run ${d.init}; status ${d.status}.`)
    for (const s of d.systems) {
      const p = s.points[0]
      body += info({
        event: 'Cyclonic disturbance (forecast)', severity: CAT_SEVERITY[s.imdCategory] ?? 'Minor', urgency: s.firstLeadH <= 72 ? 'Expected' : 'Future',
        certainty: s.firstLeadH <= 72 ? 'Likely' : 'Possible', onset: iso(p.time.replace('Z', ':00Z')),
        headline: `Forecast system ${s.id}: up to ${s.maxWsMs} m/s (${s.imdCategory}), min ${s.minMslHpa} hPa`,
        description: `Detected by the frozen anomaly detector in the ECMWF IFS run ${d.init}, from T+${s.firstLeadH} h to T+${s.lastLeadH} h. Unvalidated forecast guidance.`,
        area: `Around ${p.lat} N, ${p.lon} E at T+${s.firstLeadH} h`, circle: `${p.lat},${p.lon} 300`,
      })
    }
    return send(res, 200, `${body}\n</alert>\n`, { type: 'application/xml', maxAge: 600 })
  }

  const id = String(req.query.case || '').toLowerCase()
  if (!CASES.includes(id)) return send(res, 400, { error: `use case=<${CASES.join('|')}> or live=ifs`, example: '/api/cap?case=amphan' })
  let gj
  try { gj = await getJson(`${origin(req)}/${id}_alerts_sample.geojson`) } catch (e) { return send(res, 502, { error: e.message }) }
  const cells = gj.features.map((f) => f.properties)
  const t = cells[0]?.time ? iso(`${cells[0].time}Z`) : now
  let body = header(`sih26078-${id}-${t}`, now, `${DISCLAIMER} Replay of a historical case (${id}) on ERA5 reanalysis.`)
  for (const tier of ['severe', 'moderate']) {
    const c = cells.filter((x) => x.tier === tier)
    if (!c.length) continue
    const top = c.reduce((a, b) => (b.wind_ms > a.wind_ms ? b : a))
    body += info({
      event: 'Extreme wind', severity: SEVERITY[tier], urgency: 'Past', certainty: 'Observed', onset: t,
      headline: `${tier.toUpperCase()} wind: ${c.length} cells, up to ${top.wind_ms} m/s`,
      description: `${c.length} ERA5 0.25 deg cells meet the ${tier} tier (z-score AND IMD wind gate) inside the tracked storm box at ${cells[0].time} UTC.`,
      area: `${tier} wind cells, ${id}`, polygon: boxPolygon(c),
    })
  }
  return send(res, 200, `${body}\n</alert>\n`, { type: 'application/xml', maxAge: 86400 })
}
