import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useCase } from './CaseContext'

// Hands-free walkthrough for the judging table: cycles the real pages on a timer,
// auto-scrubbing the storm timeline on the pages that have one. Nothing here is a
// separate "demo" data path -- it's the same live context (useCase) every page reads,
// just driven by a clock instead of a mouse.
const SEQUENCE = [
  { path: '/overview', label: 'Overview', dwellMs: 9000 },
  { path: '/tracks', label: 'Storm tracks', dwellMs: 16000, driveTrack: true },
  { path: '/zoom', label: '5 km zoom', dwellMs: 10000, driveTrack: true },
  { path: '/live', label: 'Live forecast', dwellMs: 11000 },
  { path: '/downscaler', label: 'Downscaler (AI)', dwellMs: 8000 },
  { path: '/alerts-api', label: 'Alerts API', dwellMs: 7000 },
  { path: '/verification', label: 'Verification', dwellMs: 10000 },
]
const TICK_MS = 200

const DemoCtx = createContext(null)

export function DemoModeProvider({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { setT, maxT } = useCase()
  const [active, setActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const elapsedRef = useRef(0)
  const expectedPathRef = useRef(null)

  const goToStep = useCallback((i) => {
    const idx = ((i % SEQUENCE.length) + SEQUENCE.length) % SEQUENCE.length
    const step = SEQUENCE[idx]
    elapsedRef.current = 0
    setProgress(0)
    setStepIndex(idx)
    expectedPathRef.current = step.path
    navigate(step.path)
  }, [navigate])

  const start = useCallback(() => {
    setActive(true)
    goToStep(0)
  }, [goToStep])

  const stop = useCallback(() => {
    setActive(false)
    expectedPathRef.current = null
  }, [])

  const skip = useCallback(() => {
    if (active) goToStep(stepIndex + 1)
  }, [active, stepIndex, goToStep])

  // A click on the sidebar (or anywhere else) while the demo is running means someone
  // wants control back -- don't fight them.
  useEffect(() => {
    if (!active || expectedPathRef.current === null) return
    if (location.pathname !== expectedPathRef.current) stop()
  }, [location.pathname, active, stop])

  useEffect(() => {
    if (!active) return
    const onKey = (e) => { if (e.key === 'Escape') stop() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, stop])

  useEffect(() => {
    if (!active) return
    const step = SEQUENCE[stepIndex]
    const id = setInterval(() => {
      elapsedRef.current += TICK_MS
      const frac = Math.min(1, elapsedRef.current / step.dwellMs)
      setProgress(frac)
      if (step.driveTrack && maxT > 0) setT(Math.round((frac * maxT) / 6) * 6)
      if (frac >= 1) goToStep(stepIndex + 1)
    }, TICK_MS)
    return () => clearInterval(id)
  }, [active, stepIndex, maxT, setT, goToStep])

  const value = {
    active, start, stop, skip, progress,
    label: SEQUENCE[stepIndex]?.label, stepIndex, total: SEQUENCE.length,
  }
  return <DemoCtx.Provider value={value}>{children}</DemoCtx.Provider>
}

export function useDemoMode() {
  const ctx = useContext(DemoCtx)
  if (!ctx) throw new Error('useDemoMode must be used within DemoModeProvider')
  return ctx
}
