import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, ChevronDown, Building2, Plus, Sun, Moon } from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'
import { clearStoredAuthSession, getStoredAuthSession, logout } from '@/lib/apiClient'

function getRoleLabel(roleType: string) {
  if (roleType === 'owner' || roleType === 'admin' || roleType === 'super_admin_alqia') return 'Administrador'
  if (roleType === 'sales_director' || roleType === 'sales_manager') return 'Gerencia comercial'
  if (roleType === 'sales_rep') return 'Asesor comercial'
  return 'Acceso operativo'
}

export function Topbar() {
  const navigate = useNavigate()
  const { companies, activeCompanyId, activeCompany, currentUser, setActiveCompany, theme, toggleTheme, resetAuth } = useAppStore()
  const [showCompanyMenu, setShowCompanyMenu] = useState(false)
  const [showQuickAction, setShowQuickAction] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const isDark = theme === 'dark'

  const handleLogout = async () => {
    try {
      setLoggingOut(true)
      const session = getStoredAuthSession()
      await logout(session?.access_token)
    } catch {
      // Si la sesión remota ya no existe, igual limpiamos cliente.
    } finally {
      clearStoredAuthSession()
      resetAuth()
      setShowUserMenu(false)
      setLoggingOut(false)
      navigate('/login', { replace: true })
    }
  }

  return (
    <header className="h-14 flex items-center gap-3 px-4 border-b flex-shrink-0 backdrop-blur-sm"
      style={{
        background: 'var(--surface-topbar)',
        borderColor: 'var(--border-subtle)',
      }}>
      {/* Búsqueda global */}
      <div className="flex items-center gap-2 flex-1 max-w-sm bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-1.5 text-sm text-alqia-muted hover:border-white/14 transition-colors cursor-pointer">
        <Search size={14} />
        <span className="text-xs">Buscar oportunidades, contactos...</span>
        <kbd className="ml-auto text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-alqia-muted">⌘K</kbd>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Selector de empresa */}
        <div className="relative">
          <button
            onClick={() => setShowCompanyMenu(!showCompanyMenu)}
            className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-1.5 text-sm text-alqia-secondary hover:text-white hover:border-white/14 transition-all"
          >
            <Building2 size={14} />
            <span className="text-xs max-w-[120px] truncate">{activeCompany.name}</span>
            <ChevronDown size={12} />
          </button>

          {showCompanyMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-alqia-dark border border-white/10 rounded-xl shadow-glass z-50 py-1 animate-fade-in">
              {companies.map(co => (
                <button
                  key={co.id}
                  onClick={() => { setActiveCompany(co.id); setShowCompanyMenu(false) }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors',
                    'hover:bg-white/[0.06] text-alqia-secondary hover:text-white',
                    co.id === activeCompanyId && 'text-white bg-white/[0.04]',
                  )}
                >
                  <div className="w-5 h-5 rounded bg-alqia-copper/20 flex items-center justify-center text-[10px] text-alqia-copper font-medium">
                    {co.name[0]}
                  </div>
                  <span className="truncate">{co.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Acción rápida */}
        <div className="relative">
          <button
            onClick={() => setShowQuickAction(!showQuickAction)}
            className="flex items-center gap-1.5 bg-alqia-copper text-white rounded-xl px-3 py-1.5 text-xs font-medium hover:bg-alqia-copper-hover transition-all"
          >
            <Plus size={13} /> Nueva acción
          </button>

          {showQuickAction && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-alqia-dark border border-white/10 rounded-xl shadow-glass z-50 py-1 animate-fade-in">
              {['Importar leads', 'Crear oportunidad', 'Crear tarea', 'Crear cadencia', 'Enviar WhatsApp'].map(opt => (
                <button
                  key={opt}
                  onClick={() => setShowQuickAction(false)}
                  className="w-full text-left px-3 py-2 text-xs text-alqia-secondary hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Toggle tema */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
          style={{
            color: 'var(--text-muted)',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Notificaciones */}
        <button className="relative w-8 h-8 flex items-center justify-center text-alqia-muted hover:text-white rounded-xl hover:bg-white/[0.06] transition-all">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-alqia-copper rounded-full" />
        </button>

        {/* Usuario */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-8 h-8 rounded-full bg-alqia-copper/20 flex items-center justify-center text-alqia-copper text-xs font-medium cursor-pointer"
          >
            {getInitials(currentUser.full_name)}
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-alqia-dark border border-white/10 rounded-xl shadow-glass z-50 py-2 animate-fade-in">
              <div className="px-3 pb-2 border-b border-white/8">
                <p className="text-xs text-white font-medium truncate">{currentUser.full_name}</p>
                <p className="text-[11px] text-alqia-secondary truncate">{currentUser.email}</p>
                <p className="text-[10px] text-alqia-muted mt-1">{getRoleLabel(currentUser.role_type)}</p>
              </div>
              <div className="px-3 py-2">
                <p className="text-[10px] text-alqia-muted uppercase tracking-wide mb-1">Unidad activa</p>
                <p className="text-xs text-alqia-secondary truncate">{activeCompany.name}</p>
              </div>
              <div className="px-2 pt-1 border-t border-white/8">
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full text-left px-2 py-2 text-xs text-alqia-secondary hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors disabled:opacity-60"
                >
                  {loggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
