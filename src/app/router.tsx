import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { LoginPage } from '@/modules/auth/LoginPage'
import { LandingPage } from '@/pages/LandingPage'
import { RevenueRadarPage } from '@/modules/revenue-radar/RevenueRadarPage'
import { OpportunitiesPage } from '@/modules/opportunities/OpportunitiesPage'
import { OpportunityDetailPage } from '@/modules/opportunities/OpportunityDetailPage'
import { ImportsPage } from '@/modules/imports/ImportsPage'
import { ImportWizard } from '@/modules/imports/ImportWizard'
import { DataTrustPage } from '@/modules/data-trust/DataTrustPage'
import { CadencesPage } from '@/modules/cadences/CadencesPage'
import { CommunicationsPage } from '@/modules/communications/CommunicationsPage'
import { TasksPage } from '@/modules/tasks/TasksPage'
import { PlaybooksPage } from '@/modules/playbooks/PlaybooksPage'
import { ReportsPage } from '@/modules/reports/ReportsPage'
import { SettingsPage } from '@/modules/settings/SettingsPage'
import SellersPage from '@/modules/sellers/SellersPage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing pública */}
        <Route path="/landing" element={<LandingPage />} />

        {/* Autenticación */}
        <Route path="/login" element={<LoginPage />} />

        {/* App principal */}
        <Route element={<AppShell />}>
          <Route index element={<RevenueRadarPage />} />
          <Route path="oportunidades" element={<OpportunitiesPage />} />
          <Route path="oportunidades/:id" element={<OpportunityDetailPage />} />
          <Route path="importaciones" element={<ImportsPage />} />
          <Route path="importaciones/nuevo" element={<ImportWizard />} />
          <Route path="data-trust" element={<DataTrustPage />} />
          <Route path="cadencias" element={<CadencesPage />} />
          <Route path="comunicaciones" element={<CommunicationsPage />} />
          <Route path="tareas" element={<TasksPage />} />
          <Route path="playbooks" element={<PlaybooksPage />} />
          <Route path="reportes" element={<ReportsPage />} />
          <Route path="vendedores" element={<SellersPage />} />
          <Route path="configuracion" element={<SettingsPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
