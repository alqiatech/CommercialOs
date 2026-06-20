import { useEffect } from 'react'
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
import SellerDetailPage from '@/modules/sellers/SellerDetailPage'
import { fetchCurrentUser, getStoredAuthSession, clearStoredAuthSession, isSessionExpired, refreshAuthSession } from '@/lib/apiClient'
import { useAppStore } from '@/store/appStore'
import { adaptAccessibleCompanies, adaptApiUserToAppUser } from '@/lib/authAdapters'

function ProtectedAppShell() {
  const { authStatus, setAuthStatus, setCurrentUser, setCompanies, resetAuth } = useAppStore()

  useEffect(() => {
    const session = getStoredAuthSession()
    if (!session?.access_token) {
      resetAuth()
      return
    }

    let cancelled = false
    setAuthStatus('loading')

    const hydrateSession = async () => {
      try {
        const currentSession = getStoredAuthSession()
        if (!currentSession?.access_token) throw new Error('Sesion ausente')

        if (isSessionExpired(currentSession)) {
          if (!currentSession.refresh_token) throw new Error('Sesion expirada')
          const refreshed = await refreshAuthSession(currentSession.refresh_token)
          if (cancelled) return
          localStorage.setItem('alqia-auth-session', JSON.stringify(refreshed.session))
          setCurrentUser(adaptApiUserToAppUser(refreshed.user))
          setCompanies(adaptAccessibleCompanies(refreshed.user))
          setAuthStatus('authenticated')
          return
        }

        const { user } = await fetchCurrentUser(currentSession.access_token)
        if (cancelled) return
        setCurrentUser(adaptApiUserToAppUser(user))
        setCompanies(adaptAccessibleCompanies(user))
        setAuthStatus('authenticated')
      } catch {
        const staleSession = getStoredAuthSession()
        if (staleSession?.refresh_token) {
          try {
            const refreshed = await refreshAuthSession(staleSession.refresh_token)
            if (cancelled) return
            localStorage.setItem('alqia-auth-session', JSON.stringify(refreshed.session))
            setCurrentUser(adaptApiUserToAppUser(refreshed.user))
            setCompanies(adaptAccessibleCompanies(refreshed.user))
            setAuthStatus('authenticated')
            return
          } catch {
            // continúa a limpieza final
          }
        }

        if (cancelled) return
        clearStoredAuthSession()
        resetAuth()
      }
    }

    void hydrateSession()

    return () => {
      cancelled = true
    }
  }, [resetAuth, setAuthStatus, setCompanies, setCurrentUser])

  useEffect(() => {
    if (authStatus !== 'authenticated') return

    const session = getStoredAuthSession()
    if (!session?.expires_at || !session.refresh_token) return

    const refreshAt = Math.max((session.expires_at * 1000) - Date.now() - 60000, 5000)
    const timeoutId = window.setTimeout(async () => {
      try {
        const refreshed = await refreshAuthSession(session.refresh_token)
        localStorage.setItem('alqia-auth-session', JSON.stringify(refreshed.session))
        setCurrentUser(adaptApiUserToAppUser(refreshed.user))
        setCompanies(adaptAccessibleCompanies(refreshed.user))
      } catch {
        clearStoredAuthSession()
        resetAuth()
      }
    }, refreshAt)

    return () => window.clearTimeout(timeoutId)
  }, [authStatus, resetAuth, setCompanies, setCurrentUser])

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-app)', color: 'var(--text-base)' }}>
        <p className="text-sm">Cargando sesion...</p>
      </div>
    )
  }

  if (authStatus !== 'authenticated') {
    return <Navigate to="/login" replace />
  }

  return <AppShell />
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing pública */}
        <Route path="/" element={<LandingPage />} />

        {/* Autenticación */}
        <Route path="/login" element={<LoginPage />} />

        {/* App principal */}
        <Route path="/app" element={<ProtectedAppShell />}>
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
          <Route path="vendedores/:id" element={<SellerDetailPage />} />
          <Route path="configuracion" element={<SettingsPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
