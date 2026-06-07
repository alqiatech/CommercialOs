import { useState, useMemo } from 'react'
import { useAppStore } from '@/store/appStore'
import { useCommercialStore } from '@/store/commercialStore'
import { demoSellers } from '@/data/sellers.mock'
import {
  computeSellerPerformance,
  assignBatch,
  type AssignmentStrategy,
  type Seller,
} from '@/core/data-spine/assignmentEngine'
import {
  Users, TrendingUp, Inbox, BarChart2, Settings,
  CheckCircle, AlertCircle, Zap, ChevronRight, User,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

// ─── Tarjeta de vendedor ───────────────────────────────────────────────────────

interface SellerCardProps {
  seller: Seller
  stats: {
    openOpps: number
    wonRecent: number
    conversionRate: number
    pipelineValue: number
  }
  isSelected: boolean
  onSelect: () => void
}

function SellerCard({ seller, stats, isSelected, onSelect }: SellerCardProps) {
  const maxOpps = seller.max_open_opps ?? 25
  const loadPct = Math.min(100, Math.round((stats.openOpps / maxOpps) * 100))
  const loadColor = loadPct > 85 ? 'bg-alqia-risk' : loadPct > 60 ? 'bg-alqia-warning' : 'bg-alqia-success'

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full text-left p-4 rounded-2xl border transition-all',
        isSelected
          ? 'border-alqia-copper bg-alqia-copper/10'
          : 'border-white/8 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]',
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-alqia-copper/20 flex items-center justify-center text-alqia-copper font-medium text-sm">
          {seller.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text-base)] truncate">{seller.name}</p>
          <p className="text-xs text-alqia-muted capitalize">{seller.role} · {seller.branch ?? 'Sin sucursal'}</p>
        </div>
        <div className={cn(
          'w-2 h-2 rounded-full',
          seller.is_active ? 'bg-alqia-success' : 'bg-alqia-muted',
        )} />
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: 'Abiertas', value: stats.openOpps },
          { label: 'Ganadas (30d)', value: stats.wonRecent },
          { label: 'Conversión', value: `${Math.round(stats.conversionRate * 100)}%` },
        ].map(m => (
          <div key={m.label} className="bg-white/[0.03] rounded-xl p-2 text-center">
            <p className="text-base font-data font-semibold text-[var(--text-base)]">{m.value}</p>
            <p className="text-[9px] text-alqia-muted uppercase tracking-wide mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Pipeline + barra de carga */}
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs text-alqia-muted">Pipeline abierto</p>
        <p className="text-xs font-data text-[var(--text-base)]">{formatCurrency(stats.pipelineValue)}</p>
      </div>
      <div className="h-1 rounded-full bg-white/8 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', loadColor)} style={{ width: `${loadPct}%` }} />
      </div>
      <p className="text-[9px] text-alqia-muted mt-1">
        {stats.openOpps} de {maxOpps} oportunidades ({loadPct}% de carga)
      </p>
    </button>
  )
}

// ─── Bandeja sin asignar ───────────────────────────────────────────────────────

function UnassignedTray() {
  const { importedOpportunities } = useCommercialStore()
  const unassigned = importedOpportunities.filter(o => !o.owner_user_id && o.status === 'open')

  if (unassigned.length === 0) {
    return (
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 text-center">
        <CheckCircle size={24} className="text-alqia-success mx-auto mb-2" />
        <p className="text-sm text-[var(--text-base)] font-medium mb-1">Todas asignadas</p>
        <p className="text-xs text-alqia-muted">No hay oportunidades sin asignar</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-alqia-warning/20 bg-alqia-warning/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle size={14} className="text-alqia-warning flex-shrink-0" />
        <p className="text-sm font-medium text-[var(--text-base)]">
          {unassigned.length} oportunidades sin asignar
        </p>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {unassigned.slice(0, 10).map(opp => (
          <div key={opp.id} className="flex items-center gap-2 py-1.5 border-t border-white/5 first:border-0">
            <div className="w-1.5 h-1.5 rounded-full bg-alqia-warning flex-shrink-0" />
            <p className="text-xs text-[var(--text-base)] truncate flex-1">{opp.title}</p>
            <p className="text-[10px] text-alqia-muted flex-shrink-0">
              {opp.estimated_value ? formatCurrency(opp.estimated_value) : '—'}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function SellersPage() {
  const { activeOpportunities } = useAppStore()
  const { importedOpportunities, acceptImportResult: _, updateOpportunity } = useCommercialStore()

  // Combinar oportunidades reales + demo
  const allOpps = [...activeOpportunities, ...importedOpportunities]

  const [selectedSeller, setSelectedSeller] = useState<string | null>(null)
  const [assignStrategy, setAssignStrategy] = useState<AssignmentStrategy>('round_robin')

  const performances = useMemo(() =>
    computeSellerPerformance(demoSellers, allOpps),
    [allOpps]
  )

  const sellers = demoSellers

  const sellerStats = useMemo(() => {
    return Object.fromEntries(sellers.map(s => {
      const perf = performances[s.id]
      return [s.id, {
        openOpps: perf?.openOpportunities ?? 0,
        wonRecent: perf?.wonLast30Days ?? 0,
        conversionRate: perf?.conversionRate ?? 0,
        pipelineValue: perf?.totalPipelineValue ?? 0,
      }]
    }))
  }, [sellers, performances])

  const unassignedOpps = importedOpportunities.filter(o => !o.owner_user_id && o.status === 'open')

  const handleAutoAssign = () => {
    if (unassignedOpps.length === 0) return
    const results = assignBatch(unassignedOpps, {
      strategy: assignStrategy,
      sellers: sellers.filter(s => s.is_active),
      performances,
    })
    results.forEach(r => {
      if (r.assignedTo) {
        updateOpportunity(r.oppId, { owner_user_id: r.assignedTo })
      }
    })
  }

  const selectedSellerData = selectedSeller ? sellers.find(s => s.id === selectedSeller) : null
  const selectedSellerOpps = selectedSellerData
    ? allOpps.filter(o => o.owner_user_id === selectedSellerData.user_id && o.status === 'open')
    : []

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-[10px] text-alqia-muted uppercase tracking-widest mb-2">
          <Users size={10} />
          <span>Equipo de ventas</span>
        </div>
        <h1 className="text-2xl font-medium text-[var(--text-base)]">Vendedores</h1>
        <p className="text-sm text-alqia-muted mt-1">
          Gestión del equipo, asignación de oportunidades y rendimiento por asesor
        </p>
      </div>

      {/* KPIs del equipo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Asesores activos', value: sellers.filter(s => s.is_active).length, icon: <User size={12} />, color: 'text-alqia-info' },
          { label: 'Total oportunidades', value: allOpps.filter(o => o.status === 'open').length, icon: <BarChart2 size={12} />, color: 'text-alqia-copper' },
          { label: 'Sin asignar', value: unassignedOpps.length, icon: <Inbox size={12} />, color: unassignedOpps.length > 0 ? 'text-alqia-warning' : 'text-alqia-success' },
          {
            label: 'Pipeline total',
            value: formatCurrency(allOpps.filter(o => o.status === 'open').reduce((s, o) => s + (o.estimated_value ?? 0), 0)),
            icon: <TrendingUp size={12} />,
            color: 'text-alqia-success',
          },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <div className={cn('flex items-center gap-1.5 mb-2', kpi.color)}>
              {kpi.icon}
              <p className="text-[10px] uppercase tracking-wide text-alqia-muted">{kpi.label}</p>
            </div>
            <p className={cn('text-2xl font-data font-semibold', kpi.color)}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: vendedores */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-[var(--text-base)]">Equipo</h2>
            <p className="text-xs text-alqia-muted">{sellers.length} miembros</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sellers.map(seller => (
              <SellerCard
                key={seller.id}
                seller={seller}
                stats={sellerStats[seller.id] ?? { openOpps: 0, wonRecent: 0, conversionRate: 0, pipelineValue: 0 }}
                isSelected={selectedSeller === seller.id}
                onSelect={() => setSelectedSeller(selectedSeller === seller.id ? null : seller.id)}
              />
            ))}
          </div>

          {/* Panel de vendedor seleccionado */}
          {selectedSellerData && (
            <div className="rounded-2xl border border-alqia-copper/20 bg-alqia-copper/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-[var(--text-base)]">
                  Oportunidades de {selectedSellerData.name}
                </p>
                <span className="text-xs text-alqia-muted">{selectedSellerOpps.length} abiertas</span>
              </div>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {selectedSellerOpps.length === 0 ? (
                  <p className="text-xs text-alqia-muted text-center py-4">Sin oportunidades asignadas</p>
                ) : selectedSellerOpps.map(opp => (
                  <div key={opp.id} className="flex items-center gap-2 py-1.5 border-t border-white/5 first:border-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-alqia-copper flex-shrink-0" />
                    <p className="text-xs text-[var(--text-base)] truncate flex-1">{opp.title}</p>
                    <p className="text-[10px] text-alqia-muted flex-shrink-0">
                      P{opp.probability ?? 0}%
                    </p>
                    <ChevronRight size={10} className="text-alqia-muted flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Columna derecha: asignación automática + bandeja */}
        <div className="space-y-4">
          {/* Auto-asignación */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={13} className="text-alqia-copper" />
              <p className="text-sm font-medium text-[var(--text-base)]">Asignación automática</p>
            </div>
            <p className="text-xs text-alqia-muted mb-3">
              Asigna las {unassignedOpps.length} oportunidades sin asignar usando la estrategia seleccionada.
            </p>

            {/* Selector de estrategia */}
            <div className="mb-3">
              <p className="text-[10px] text-alqia-muted uppercase tracking-wide mb-1.5">Estrategia</p>
              <div className="space-y-1.5">
                {([
                  ['round_robin', 'Round Robin', 'Rotación equitativa'],
                  ['by_workload', 'Por carga', 'Al que tiene menos abiertas'],
                  ['by_performance', 'Por rendimiento', 'Al de mejor tasa de conversión'],
                ] as const).map(([value, label, desc]) => (
                  <button
                    key={value}
                    onClick={() => setAssignStrategy(value)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-xl text-xs border transition-all',
                      assignStrategy === value
                        ? 'border-alqia-copper/40 bg-alqia-copper/10 text-[var(--text-base)]'
                        : 'border-white/8 text-alqia-muted hover:border-white/15',
                    )}
                  >
                    <span className="font-medium">{label}</span>
                    <span className="text-[10px] block text-alqia-muted">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleAutoAssign}
              disabled={unassignedOpps.length === 0}
              className={cn(
                'w-full py-2.5 rounded-xl text-xs font-medium transition-all',
                unassignedOpps.length > 0
                  ? 'bg-alqia-copper hover:bg-alqia-copper/90 text-white'
                  : 'bg-white/8 text-alqia-muted cursor-not-allowed',
              )}
            >
              {unassignedOpps.length > 0
                ? `Asignar ${unassignedOpps.length} oportunidades`
                : 'Sin oportunidades pendientes'}
            </button>
          </div>

          {/* Bandeja sin asignar */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Inbox size={12} className="text-alqia-warning" />
              <p className="text-xs font-medium text-[var(--text-base)]">Bandeja sin asignar</p>
            </div>
            <UnassignedTray />
          </div>

          {/* Configuración de equipo */}
          <button className="w-full flex items-center gap-2 px-4 py-3 rounded-2xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.04] text-xs text-alqia-muted transition-colors">
            <Settings size={12} />
            <span>Configurar equipo y territorios</span>
            <ChevronRight size={10} className="ml-auto" />
          </button>
        </div>
      </div>
    </div>
  )
}
