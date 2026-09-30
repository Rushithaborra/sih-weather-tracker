import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  Wind, LayoutGrid, Activity, Waypoints, ZoomIn, Bell, ShieldCheck, Database, Sun, Moon,
} from 'lucide-react'
import { useCase } from '../context/CaseContext'
import { useTheme } from '../context/ThemeContext'

const NAV = [
  { to: '/overview', label: 'Overview', icon: LayoutGrid },
  { to: '/active-anomalies', label: 'Active anomalies', icon: Activity },
  { to: '/tracks', label: 'Tracks & 4D boxes', icon: Waypoints },
  { to: '/zoom', label: '5 km zoom', icon: ZoomIn },
  { to: '/alerts-api', label: 'Alerts API', icon: Bell },
  { to: '/verification', label: 'Verification', icon: ShieldCheck },
  { to: '/data-sources', label: 'Data sources', icon: Database },
]

export default function Sidebar() {
  const { mode } = useCase()
  const { theme, toggle } = useTheme()
  return (
    <aside className="w-[196px] shrink-0 bg-ink900 text-white flex flex-col h-screen sticky top-0">
      <div className="flex items-center gap-2.5 px-4 pt-5 pb-4">
        <div className="w-9 h-9 rounded-md bg-brand flex items-center justify-center shrink-0">
          <Wind size={19} strokeWidth={2.5} />
        </div>
        <div className="leading-tight flex-1">
          <div className="font-bold text-[13.5px]">Anomaly</div>
          <div className="font-bold text-[13.5px] -mt-0.5">Tracker</div>
        </div>
        <button
          onClick={toggle}
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          className="w-7 h-7 rounded-md flex items-center justify-center text-stone-300 hover:bg-white/10 hover:text-white transition-colors shrink-0"
        >
          {theme === 'light' ? <Moon size={14} strokeWidth={2} /> : <Sun size={14} strokeWidth={2} />}
        </button>
      </div>
      <div className="px-4 pb-4 -mt-1 text-[10.5px] text-stone-400">Medium-range AI pilot</div>

      <nav className="flex-1 px-2.5 space-y-0.5">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 pl-2.5 pr-3 py-2 rounded-md text-[12.5px] border-l-[3px] transition-colors ${
                isActive
                  ? 'bg-ink800 text-white font-medium border-brand'
                  : 'text-stone-300 border-transparent hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={15} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="m-2.5 mb-4 rounded-md bg-white/5 px-3 py-3 text-[11px] leading-relaxed">
        <div className="text-stone-400 mb-1">System status</div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-emerald-400 font-semibold">Operational</span>
        </div>
        <div className="text-stone-300">
          {mode === 'concept' ? 'NEPS-G 00 UTC (concept)' : mode === 'gefs' ? 'GEFSv12, 0.25° (real)' : 'ERA5 reanalysis, 0.25°'}
        </div>
        <div className="text-stone-400">
          {mode === 'concept' ? 'Replay mode (synthetic)' : mode === 'gefs' ? 'Forecast replay (real)' : 'Replay mode (validated cases)'}
        </div>
      </div>
    </aside>
  )
}
