import React from 'react'
import { useCase } from '../context/CaseContext'

export default function TimelineSlider() {
  const { t, setT, maxT } = useCase()
  const ticks = []
  for (let v = 0; v <= maxT; v += 12) ticks.push(v)

  return (
    <div className="px-1 pt-3">
      <input
        type="range"
        min={0}
        max={maxT}
        step={6}
        value={t}
        onChange={(e) => setT(Number(e.target.value))}
        className="w-full accent-teal"
      />
      <div className="flex justify-between text-[10.5px] text-muted mt-1 px-0.5">
        {ticks.map((v) => (
          <span key={v} className={v === t ? 'text-teal font-bold' : ''}>{v === 0 ? '0' : `+${v}`}</span>
        ))}
      </div>
    </div>
  )
}
