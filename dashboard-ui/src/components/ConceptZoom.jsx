import React, { useEffect, useRef } from 'react'
import { RAIN_COLOR_STOPS, RAIN_PEAK_MM, lerpColor } from '../data/concept'

const N = 40 // 40x40 5 km cells = 200 km across
const KM_PER_CELL = 5

export default function ConceptZoom() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const size = canvas.width
    const cell = size / N
    const ctx = canvas.getContext('2d')
    const cx = N / 2, cy = N / 2
    let peakVal = -1, peakI = 0, peakJ = 0
    const field = []
    for (let i = 0; i < N; i++) {
      field.push([])
      for (let j = 0; j < N; j++) {
        const dx = i - cx, dy = j - cy
        const r = Math.sqrt(dx * dx + dy * dy)
        const theta = Math.atan2(dy, dx)
        // eyewall ring ~ 12 cells (60 km) radius
        const eyewall = Math.exp(-Math.pow((r - 12) / 3.2, 2)) * 1.0
        // two log-spiral rain bands
        const spiral1 = Math.exp(-Math.pow(((r - (6 + (theta + Math.PI) * 4)) % 16) - 8, 2) / 18) * 0.55
        const spiral2 = Math.exp(-Math.pow(((r - (14 + (theta + Math.PI) * 4 + 8)) % 16) - 8, 2) / 18) * 0.4
        const noise = (pseudoRandom(i * 13.1 + j * 7.7) - 0.5) * 0.06
        const falloff = Math.max(0, 1 - r / (N * 0.62))
        let v = Math.max(0, (eyewall + spiral1 + spiral2) * falloff + noise)
        v = Math.min(1, v)
        const mm = v * RAIN_PEAK_MM
        field[i][j] = mm
        if (mm > peakVal) { peakVal = mm; peakI = i; peakJ = j }
      }
    }
    // force the peak cell to the documented peak value (kept, not averaged away)
    field[peakI][peakJ] = RAIN_PEAK_MM

    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        ctx.fillStyle = lerpColor(RAIN_COLOR_STOPS, field[i][j])
        ctx.fillRect(i * cell, j * cell, cell + 0.5, cell + 0.5)
      }
    }

    const px = peakI * cell + cell / 2, py = peakJ * cell + cell / 2
    const pxPerKm = cell / KM_PER_CELL
    ;[[5, '#C0392B'], [15, '#E67E22'], [30, '#F1C40F']].forEach(([km, color]) => {
      ctx.beginPath()
      ctx.arc(px, py, km * pxPerKm, 0, Math.PI * 2)
      ctx.strokeStyle = color
      ctx.lineWidth = 1.6
      ctx.stroke()
    })
    ctx.beginPath()
    ctx.arc(px, py, 4.5, 0, Math.PI * 2)
    ctx.fillStyle = '#16293D'
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = '#ffffff'
    ctx.stroke()
  }, [])

  return <canvas ref={ref} width={320} height={320} className="w-full rounded-md border border-line" />
}

function pseudoRandom(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}
