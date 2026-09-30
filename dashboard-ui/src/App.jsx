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
          <main className="flex-1 p-5 pb-14">
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
          </main>
        </div>
        <Footer />
      </CaseProvider>
    </ThemeProvider>
  )
}

const FOOTER_TEXT = {
  live: 'Research prototype — live NOAA GEFS ensemble run through the pipeline daily. Forecast only, unvalidated. Not an operational warning system.',
  validated: 'Concept prototype — real ERA5/IBTrACS pipeline output, replayed for two historical cyclones. Not an operational warning system.',
  gefs: 'Concept prototype — real NOAA GEFS ensemble forecast, tracked and validated against IBTrACS. Not an operational warning system.',
}

function Footer() {
  const { mode } = useCase()
  const { pathname } = useLocation()
  return (
    <footer className="fixed bottom-0 left-[196px] right-0 bg-bg/95 backdrop-blur text-center text-[10.5px] text-muted py-2 border-t border-line">
      {pathname === '/live' ? FOOTER_TEXT.live : FOOTER_TEXT[mode]}
    </footer>
  )
}
