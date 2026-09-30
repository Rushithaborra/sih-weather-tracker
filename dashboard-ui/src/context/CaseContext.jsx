import React, { createContext, useContext, useMemo, useState } from 'react'
import { CASES } from '../data/cases'

const CaseCtx = createContext(null)

export function CaseProvider({ children }) {
  const [mode, setMode] = useState('concept') // 'concept' (deck mock-up) | 'validated' (real pipeline)

  const [caseId, setCaseId] = useState('amphan')
  const c = CASES[caseId]
  const maxT = c.track[c.track.length - 1].t
  const [t, setT] = useState(c.peak.maxWsAt)

  const setCaseAndClampT = (id) => {
    const next = CASES[id]
    const nextMax = next.track[next.track.length - 1].t
    setCaseId(id)
    setT((prev) => Math.min(prev, nextMax))
  }

  const [conceptT, setConceptT] = useState(96)

  const value = useMemo(
    () => ({ mode, setMode, caseId, setCaseId: setCaseAndClampT, data: c, t, setT, maxT, conceptT, setConceptT }),
    [mode, caseId, c, t, maxT, conceptT],
  )
  return <CaseCtx.Provider value={value}>{children}</CaseCtx.Provider>
}

export function useCase() {
  const ctx = useContext(CaseCtx)
  if (!ctx) throw new Error('useCase must be used within CaseProvider')
  return ctx
}

export function nearestTrackPoint(track, t) {
  return track.reduce((best, p) => (Math.abs(p.t - t) < Math.abs(best.t - t) ? p : best), track[0])
}

export function interpolateTrack(track, t) {
  if (t <= track[0].t) return track[0]
  if (t >= track[track.length - 1].t) return track[track.length - 1]
  for (let i = 0; i < track.length - 1; i++) {
    const a = track[i], b = track[i + 1]
    if (t >= a.t && t <= b.t) {
      const f = (t - a.t) / (b.t - a.t)
      return {
        t, lat: a.lat + (b.lat - a.lat) * f, lon: a.lon + (b.lon - a.lon) * f,
        maxWs: a.maxWs + (b.maxWs - a.maxWs) * f, minMsl: a.minMsl + (b.minMsl - a.minMsl) * f,
      }
    }
  }
  return track[track.length - 1]
}
