import React from 'react'
import { MonitorPlay, Square, SkipForward } from 'lucide-react'
import { useDemoMode } from '../context/DemoModeContext'

// A floating control, visible on every page, for presenting hands-free at the
// judging table: starts a timed walkthrough of the real pages and, on the ones
// with a storm timeline, auto-scrubs it too.
export default function DemoModeControl() {
  const { active, start, stop, skip, progress, label, stepIndex, total } = useDemoMode()

  if (!active) {
    return (
      <button
        onClick={start}
        title="Play a hands-free walkthrough of the dashboard"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-ink900 text-white pl-3 pr-4 py-2.5 rounded-full shadow-lg hover:bg-ink800 transition-colors text-[12.5px] font-semibold"
      >
        <MonitorPlay size={15} strokeWidth={2.2} />
        Demo mode
      </button>
    )
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 bg-card rounded-card shadow-lg border border-line px-4 py-3 w-[240px]">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-[11px] text-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
          Demo mode · {stepIndex + 1}/{total}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={skip} title="Skip to next page" className="w-6 h-6 rounded-md flex items-center justify-center text-muted hover:bg-ink900/5 hover:text-ink transition-colors">
            <SkipForward size={13} strokeWidth={2.2} />
          </button>
          <button onClick={stop} title="Stop (Esc)" className="w-6 h-6 rounded-md flex items-center justify-center text-muted hover:bg-red-600/10 hover:text-red-600 transition-colors">
            <Square size={12} strokeWidth={2.2} />
          </button>
        </div>
      </div>
      <div className="text-[13px] font-bold text-ink mb-2">{label}</div>
      <div className="h-1.5 rounded-full bg-ink900/10 overflow-hidden">
        <div className="h-full bg-brand transition-[width] duration-200 ease-linear" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  )
}
