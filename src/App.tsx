import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import SchedulePage from './pages/SchedulePage'
import PavilionsPage from './pages/PavilionsPage'
import TeamsPage from './pages/TeamsPage'
import CoachesPage from './pages/CoachesPage'
import ExportPage from './pages/ExportPage'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/schedule" replace />} />
        <Route path="/home" element={<Navigate to="/schedule" replace />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/schedule/:day" element={<SchedulePage />} />
        <Route path="/pavillions" element={<PavilionsPage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/trainers" element={<CoachesPage />} />
        <Route path="/config" element={<ExportPage />} />
        <Route path="*" element={<Navigate to="/schedule" replace />} />
      </Routes>
    </Layout>
  )
}
