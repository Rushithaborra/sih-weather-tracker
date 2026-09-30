import React from 'react'
import { useCase } from '../context/CaseContext'

export default function TimelineSlider({ value, onChange, max, step = 6, tickStep }) {
  const ctx = useCase()
  const v = value ?? ctx.t
  const set = onChange ?? ctx.setT
  const m = max ?? ctx.maxT
  const ts = tickStep ?? (m > 96 ? 24 : 12)
  const ticks = []
  for (let x = 0; x <= m; x += ts) ticks.push(x)

  return (
    <div className="px-1 pt-3">
      <input
        type="range"
        min={0}
        max={m}
        step={step}
        value={v}
        onChange={(e) => set(Number(e.target.value))}
        className="w-full accent-teal"
      />
      <div className="flex justify-between text-[10.5px] text-muted mt-1 px-0.5">
        {ticks.map((x) => (
          <span key={x} className={x === v ? 'text-teal font-bold' : ''}>{x === 0 ? '0' : `+${x}`}</span>
        ))}
      </div>
    </div>
  )
}
