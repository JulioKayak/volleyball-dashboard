import { useState } from 'react'
import Layout from './components/Layout'
import type { Page } from './types'
import SchedulePage from './pages/SchedulePage'
import PavilionsPage from './pages/PavilionsPage'
import TeamsPage from './pages/TeamsPage'
import CoachesPage from './pages/CoachesPage'
import ExportPage from './pages/ExportPage'

export default function App() {
  const [page, setPage] = useState<Page>('schedule')

  return (
    <Layout page={page} onNav={setPage}>
      {page === 'schedule' && <SchedulePage />}
      {page === 'pavilions' && <PavilionsPage />}
      {page === 'teams' && <TeamsPage />}
      {page === 'coaches' && <CoachesPage />}
      {page === 'export' && <ExportPage />}
    </Layout>
  )
}
