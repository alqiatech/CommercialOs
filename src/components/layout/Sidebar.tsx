import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAppStore, demoCompanies } from '@/store/appStore'
import {
  Radar, Target, Upload, ShieldCheck, GitBranch,
  MessageSquare, CheckSquare, BookOpen, BarChart2,
  Settings, ChevronDown, Check, Users,
} from 'lucide-react'

// Grupos de navegación para separación visual
const navGroups = [
  {
    label: 'Core',
    items: [
      { to: '/',              icon: Radar,        label: 'Revenue Radar', id: 'radar' },
      { to: '/oportunidades', icon: Target,       label: 'Oportunidades', id: 'opp' },
      { to: '/importaciones', icon: Upload,       label: 'Importaciones', id: 'imp' },
      { to: '/data-trust',    icon: ShieldCheck,  label: 'Data Trust',    id: 'dt' },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { to: '/cadencias',      icon: GitBranch,     label: 'Cadencias',      id: 'cad' },
      { to: '/vendedores',     icon: Users,          label: 'Vendedores',     id: 'sellers' },
      { to: '/comunicaciones', icon: MessageSquare, label: 'Comunicaciones', id: 'com' },
      { to: '/tareas',         icon: CheckSquare,   label: 'Tareas',         id: 'tasks' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { to: '/playbooks',    icon: BookOpen,  label: 'Playbooks',    id: 'pb' },
      { to: '/reportes',     icon: BarChart2, label: 'Reportes',     id: 'rep' },
      { to: '/configuracion', icon: Settings, label: 'Configuración', id: 'cfg' },
    ],
  },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation()
  const { activeCompanyId, activeCompany, setActiveCompany, theme } = useAppStore()
  const [companyPickerOpen, setCompanyPickerOpen] = useState(false)
  const isDark = theme === 'dark'
  const logoSrc = isDark ? '/Logoalqiacomosblanco.png' : '/Logoalqiacomososcuro.png'

  return (
    <aside
      className={cn(
        'flex flex-col h-full flex-shrink-0 transition-all duration-300 ease-in-out border-r',
        collapsed ? 'w-[52px]' : 'w-[200px]',
      )}
      style={{
        background: 'var(--surface-sidebar)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex items-center h-12 border-b flex-shrink-0',
          collapsed ? 'justify-center px-0' : 'px-4 gap-2.5',
        )}
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <button
          onClick={onToggle}
          className="flex-shrink-0 hover:opacity-80 transition-opacity"
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          <img
            src="/Faviconalqia.png"
            alt="Alqia"
            className="w-6 h-6 rounded-md object-cover"
          />
        </button>
        {!collapsed && (
          <img
            src={logoSrc}
            alt="Alqia Commercial OS"
            className="h-8 w-auto object-contain"
          />
        )}
      </div>

      {/* Selector de empresa activa */}
      {!collapsed && (
        <div className="px-2 py-2 border-b relative" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            onClick={() => setCompanyPickerOpen(prev => !prev)}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors group"
            style={{ color: 'var(--text-base)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-card)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div className="w-5 h-5 rounded-md bg-alqia-copper/15 border border-alqia-copper/20 flex items-center justify-center flex-shrink-0 text-[10px] font-semibold text-alqia-copper">
              {activeCompany.short_name[0]}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[10px] leading-none truncate font-medium" style={{ color: 'var(--text-base)' }}>{activeCompany.short_name}</p>
              <p className="text-[9px] leading-none mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{activeCompany.industry_label}</p>
            </div>
            <ChevronDown size={10} className={cn('transition-transform flex-shrink-0', companyPickerOpen && 'rotate-180')} style={{ color: 'var(--text-muted)' }} />
          </button>

          {/* Dropdown de empresas */}
          {companyPickerOpen && (
            <div className="absolute left-2 right-2 top-full mt-1 z-50 rounded-xl shadow-xl overflow-hidden border" style={{ background: 'var(--surface-elevated)', borderColor: 'var(--border-normal)' }}>
              <div className="max-h-64 overflow-y-auto py-1">
                {demoCompanies.map(company => (
                  <button
                    key={company.id}
                    onClick={() => {
                      setActiveCompany(company.id)
                      setCompanyPickerOpen(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors"
                    style={{
                      background: company.id === activeCompanyId ? 'rgba(249,128,88,0.08)' : 'transparent',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = company.id === activeCompanyId ? 'rgba(249,128,88,0.12)' : 'var(--surface-card)')}
                    onMouseLeave={e => (e.currentTarget.style.background = company.id === activeCompanyId ? 'rgba(249,128,88,0.08)' : 'transparent')}
                  >
                    <div className="w-5 h-5 rounded-md bg-alqia-copper/15 border border-alqia-copper/20 flex items-center justify-center flex-shrink-0 text-[9px] font-semibold text-alqia-copper">
                      {company.short_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] leading-none truncate" style={{ color: 'var(--text-base)' }}>{company.short_name}</p>
                      <p className="text-[9px] leading-none mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{company.industry_label}</p>
                    </div>
                    {company.id === activeCompanyId && <Check size={10} className="text-alqia-copper flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navegación por grupos */}
      <nav className="flex-1 py-3 overflow-y-auto flex flex-col gap-4">
        {navGroups.map(group => (
          <div key={group.label}>
            {!collapsed && (
              <p className="text-[9px] uppercase tracking-[0.15em] px-4 mb-1.5 font-medium" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                {group.label}
              </p>
            )}
            <div className="flex flex-col gap-px px-1.5">
              {group.items.map(item => {
                const Icon = item.icon
                const isActive = item.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.to)

                return (
                  <NavLink
                    key={item.id}
                    to={item.to}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'group flex items-center rounded-lg transition-all duration-150 h-8',
                      collapsed ? 'justify-center px-0' : 'px-2.5 gap-2.5',
                    )}
                    style={{
                      background: isActive ? 'rgba(249,128,88,0.10)' : 'transparent',
                      color: isActive ? 'var(--text-base)' : 'var(--text-muted)',
                    }}
                  >
                    <Icon
                      size={14}
                      className="flex-shrink-0 transition-colors"
                      style={{ color: isActive ? '#F98058' : 'currentColor' }}
                    />
                    {!collapsed && (
                      <span className="text-xs truncate">{item.label}</span>
                    )}
                    {isActive && !collapsed && (
                      <span className="ml-auto w-1 h-1 rounded-full bg-alqia-copper flex-shrink-0" />
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer de marca */}
      <div
        className={cn('mt-auto py-3 flex-shrink-0 border-t', collapsed ? 'px-0 flex justify-center' : 'px-4')}
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        {collapsed ? (
          <img src="/Faviconalqia.png" alt="Alqia" className="w-5 h-5 rounded object-cover opacity-40" title="Alqia Tech" />
        ) : (
          <div>
            <p className="text-[9px] font-semibold tracking-[0.12em] uppercase leading-none text-alqia-copper/60">Alqia Tech</p>
            <p className="text-[8px] leading-none mt-1" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>Commercial OS · Marca registrada</p>
          </div>
        )}
      </div>
    </aside>
  )
}

