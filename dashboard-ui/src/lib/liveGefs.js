import { useEffect, useState } from 'react'

// Written daily by .github/workflows/gefs-live.yml (scripts/run_gefs_live.py).
// Read from GitHub first so a new run shows up without waiting for a redeploy;
// fall back to the copy bundled with this deploy.
const REPO_RAW = 'https://raw.githubusercontent.com/Rushithaborra/sih-weather-tracker/main/dashboard-ui/public/live/'
const LOCAL = `${import.meta.env.BASE_URL}live/`

async function getJson(name) {
  for (const base of [REPO_RAW, LOCAL]) {
    try {
      const res = await fetch(`${base}${name}?t=${Math.floor(Date.now() / 6e5)}`, {
        cache: 'no-store', signal: AbortSignal.timeout(6000),
      })
      if (res.ok) return await res.json()
    } catch {
      // unreachable or timed out -- try the next source
    }
  }
  return null
}

export function useLiveGefs() {
  const [state, setState] = useState({ status: 'loading', data: null, history: [] })
  useEffect(() => {
    let alive = true
    Promise.all([getJson('gefs_latest.json'), getJson('gefs_history.json')]).then(([data, history]) => {
      if (!alive) return
      setState({ status: data ? 'ready' : 'empty', data, history: history ?? [] })
    })
    return () => { alive = false }
  }, [])
  return state
}

export function hoursAgo(iso) {
  return (Date.now() - new Date(iso).getTime()) / 36e5
}

export function fmtAgo(iso) {
  const h = hoursAgo(iso)
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} min ago`
  if (h < 48) return `${Math.round(h)} h ago`
  return `${Math.round(h / 24)} days ago`
}

export function fmtInit(iso) {
  const d = new Date(iso)
  return `${d.toLocaleString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' })} ${String(d.getUTCHours()).padStart(2, '0')}Z`
}

// Member positions at a lead time: every tracked system with a point within ±3 h.
export function positionsAt(members, leadH) {
  const out = []
  for (const m of members) {
    m.tracks.forEach((tr, i) => {
      const p = tr.points.find((q) => Math.abs(q.leadH - leadH) <= 3)
      if (p) out.push({ id: m.id, track: i, p })
    })
  }
  return out
}
