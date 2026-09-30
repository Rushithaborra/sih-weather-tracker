import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import { CaseProvider, useCase } from './context/CaseContext'
import { ThemeProvider } from './context/ThemeContext'
import Overview from './pages/Overview'
import ActiveAnomalies from './pages/ActiveAnomalies'
import TracksBoxes from './pages/TracksBoxes'
import ZoomPage from './pages/ZoomPage'
import AlertsApi from './pages/AlertsApi'
import Verification from './pages/Verification'
import DataSources from './pages/DataSources'
import LiveForecast from './pages/LiveForecast'

export default function App() {
  return (
    <ThemeProvider>
      <CaseProvider>
        <div className="flex min-h-screen bg-bg">
          <Sidebar />
          <main className="flex-1 min-w-0 p-5 flex flex-col">
            <Routes>
              <Route path="/" element={<Navigate to="/tracks" replace />} />
              <Route path="/live" element={<LiveForecast />} />
              <Route path="/overview" element={<Overview />} />
              <Route path="/active-anomalies" element={<ActiveAnomalies />} />
              <Route path="/tracks" element={<TracksBoxes />} />
              <Route path="/zoom" element={<ZoomPage />} />
              <Route path="/alerts-api" element={<AlertsApi />} />
              <Route path="/verification" element={<Verification />} />
              <Route path="/data-sources" element={<DataSources />} />
              <Route path="*" element={<Navigate to="/tracks" replace />} />
            </Routes>
            <Footer />
          </main>
        </div>
      </CaseProvider>
    </ThemeProvider>
  )
}

const FOOTER_TEXT = {
  live: 'Research prototype — live NOAA GEFS ensemble run through the pipeline daily. Forecast only, unvalidated. Not an operational warning system.',
  validated: 'Research prototype: tracking validated on 8 storms (1 in-sample, 7 held out) on ERA5 reanalysis; live output unvalidated.',
  gefs: 'Research prototype: tracking validated on 8 storms (1 in-sample, 7 held out) on ERA5 reanalysis; live output unvalidated.',
}

function Footer() {
  const { mode } = useCase()
  const { pathname } = useLocation()
  return (
    <footer className="mt-auto pt-6 text-center text-[10.5px] text-muted">
      <div className="border-t border-line pt-3">
      {pathname === '/live' ? FOOTER_TEXT.live : FOOTER_TEXT[mode]}
      </div>
    </footer>
  )
}
