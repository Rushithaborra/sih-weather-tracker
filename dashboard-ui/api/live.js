// GET /api/live[?source=ifs|gefs]
// Summary of the latest live runs: ECMWF IFS (twice daily, orphan branch live-data) and the NOAA
// GEFS ensemble (daily). Status, systems, wind-alert and rain summaries. Unvalidated forecasts.
import { DISCLAIMER, LIVE, getJson, send } from './_lib.js'

function ifsSummary(d) {
  if (d.status === 'error') return { model: d.model, status: 'error', error: d.error, fetchedAt: d.fetchedAt }
  const peak = (k) => Math.max(0, ...d.windAlerts.map((w) => w[k]))
  return {
    model: d.model, status: d.status, init: d.init, fetchedAt: d.fetchedAt,
    systems: d.systems.map((s) => ({
      id: s.id, firstLeadH: s.firstLeadH, lastLeadH: s.lastLeadH, minMslHpa: s.minMslHpa, maxWsMs: s.maxWsMs,
      imdCategory: s.imdCategory, track: s.points.map((p) => ({ time: p.time, lat: p.lat, lon: p.lon, maxWs: p.maxWs, minMsl: p.minMsl })),
    })),
    windAlertCellsPeak: { low: peak('low'), moderate: peak('moderate'), severe: peak('severe') },
    rainByImdDay: d.rainDays.map((r) => ({ imdDayEnding: r.imdDayEnding, maxMm: r.maxMm, cells: r.cells })),
    caveats: d.caveats,
  }
}

function gefsSummary(d) {
  return {
    model: d.model, init: d.init, generatedAt: d.generatedAt, members: d.nMembers,
    membersWithSystem: d.summary.membersWithSystem, peakSevere: d.summary.peakSevere, strongest: d.summary.strongest,
    firstDetectionLeadH: d.summary.firstDetectionLeadH,
  }
}

export default async function handler(req, res) {
  const want = String(req.query.source || 'all').toLowerCase()
  if (!['all', 'ifs', 'gefs'].includes(want)) return send(res, 400, { error: 'source must be ifs, gefs or all' })
  const out = { disclaimer: DISCLAIMER }
  const jobs = []
  if (want !== 'gefs') jobs.push(getJson(LIVE.ifs).then((d) => { out.ifs = ifsSummary(d) }).catch((e) => { out.ifs = { status: 'unavailable', error: e.message } }))
  if (want !== 'ifs') jobs.push(getJson(LIVE.gefs).then((d) => { out.gefs = gefsSummary(d) }).catch((e) => { out.gefs = { status: 'unavailable', error: e.message } }))
  await Promise.all(jobs)
  return send(res, 200, out, { maxAge: 600 })
}
