import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { useCommercialStore } from '@/store/commercialStore'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States'
import { ActionButton } from '@/components/ui/ActionButton'
import { demoSellers } from '@/data/sellers.mock'
import { fetchOpportunities, fetchSellers, updateOpportunityOwner } from '@/lib/apiClient'
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Opportunity } from '@/types'

function normalizeOpportunityForSeller(companyId: string, opportunity: {
  id: string
  title: string
  contact?: { id: string; full_name: string } | null
  stage?: { id: string } | null
  owner_user_id?: string | null
  product_interest?: string | null
  estimated_value?: number | null
  probability: number
  lead_intent_score: number
  data_trust_score: number
  urgency_score: number
  status: string
  last_contact_at?: string | null
  updated_at?: string
  won_at?: string | null
}): Opportunity {
  return {
    id: opportunity.id,
    tenant_id: 'tenant_runtime',
    company_id: companyId,
    pipeline_id: 'pipeline_runtime',
    stage_id: opportunity.stage?.id ?? 'stage_runtime',
    contact_id: opportunity.contact?.id ?? `contact_${opportunity.id}`,
    owner_user_id: opportunity.owner_user_id ?? '',
    title: opportunity.title,
    product_interest: opportunity.product_interest ?? undefined,
    estimated_value: opportunity.estimated_value ?? undefined,
    currency: 'MXN',
    probability: opportunity.probability,
    lead_intent_score: opportunity.lead_intent_score,
    data_trust_score: opportunity.data_trust_score,
    urgency_score: opportunity.urgency_score,
    status: opportunity.status as Opportunity['status'],
    last_contact_at: opportunity.last_contact_at ?? undefined,
    won_at: opportunity.won_at ?? undefined,
    updated_at: opportunity.updated_at ?? new Date().toISOString(),
    created_at: opportunity.updated_at ?? new Date().toISOString(),
  }
}

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
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { activeCompany, activeOpportunities } = useAppStore()
  const { importedOpportunities, acceptImportResult: _, updateOpportunity } = useCommercialStore()
  const realCompanyId = activeCompany.db_company_id

  const sellersQuery = useQuery({
    queryKey: ['sellers', realCompanyId],
    queryFn: () => fetchSellers(realCompanyId as string),
    enabled: Boolean(realCompanyId),
  })

  const opportunitiesQuery = useQuery({
    queryKey: ['opportunities', realCompanyId, 'sellers'],
    queryFn: () => fetchOpportunities(realCompanyId as string),
    enabled: Boolean(realCompanyId),
  })

  const assignMutation = useMutation({
    mutationFn: async (assignments: Array<{ oppId: string; assignedTo: string | null }>) => {
      await Promise.all(
        assignments
          .filter(result => result.assignedTo)
          .map(result => updateOpportunityOwner(result.oppId, { owner_user_id: result.assignedTo })),
      )
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['opportunities', realCompanyId] })
      void queryClient.invalidateQueries({ queryKey: ['opportunities', realCompanyId, 'sellers'] })
      void queryClient.invalidateQueries({ queryKey: ['sellers', realCompanyId] })
    },
  })

  // Combinar oportunidades reales + demo
  const allOpps: Opportunity[] = opportunitiesQuery.data?.data?.length
    ? opportunitiesQuery.data.data.map(opportunity => normalizeOpportunityForSeller(realCompanyId as string, opportunity))
    : [...activeOpportunities, ...importedOpportunities]

  const [selectedSeller, setSelectedSeller] = useState<string | null>(null)
  const [assignStrategy, setAssignStrategy] = useState<AssignmentStrategy>('round_robin')

  const sellers = useMemo<Seller[]>(() => {
    if (!sellersQuery.data?.data?.length) return demoSellers
    return sellersQuery.data.data.map(seller => ({
      id: seller.id,
      tenant_id: seller.tenant_id,
      company_id: seller.company_id,
      user_id: seller.id,
      name: seller.full_name,
      email: seller.email,
      phone: seller.phone ?? undefined,
      role: seller.role_type === 'sales_rep' ? 'asesor' : seller.role_type === 'sales_manager' ? 'gerente' : 'director',
      branch: seller.branch_id ?? undefined,
      territories: [],
      is_active: seller.status === 'active',
      max_open_opps: seller.role_type === 'sales_rep' ? 25 : 10,
      created_at: seller.created_at,
      updated_at: seller.updated_at,
    }))
  }, [sellersQuery.data?.data])

  const performances = useMemo(() =>
    computeSellerPerformance(sellers, allOpps),
    [allOpps, sellers]
  )

  const sellerStats = useMemo(() => {
    return Object.fromEntries(sellers.map(s => {
      const realMetrics = sellersQuery.data?.data?.find(realSeller => realSeller.id === s.id)?.metrics
      const perf = performances[s.id]
      return [s.id, {
        openOpps: realMetrics?.open_opportunities ?? perf?.openOpportunities ?? 0,
        wonRecent: realMetrics?.won_last_30_days ?? perf?.wonLast30Days ?? 0,
        conversionRate: realMetrics?.conversion_rate ?? perf?.conversionRate ?? 0,
        pipelineValue: realMetrics?.pipeline_value ?? perf?.totalPipelineValue ?? 0,
      }]
    }))
  }, [performances, sellers, sellersQuery.data?.data])

  const unassignedOpps = allOpps.filter(o => !o.owner_user_id && o.status === 'open')

  const handleAutoAssign = () => {
    if (unassignedOpps.length === 0) return
    const results = assignBatch(unassignedOpps, {
      strategy: assignStrategy,
      sellers: sellers.filter(s => s.is_active),
      performances,
    })
    if (realCompanyId) {
      assignMutation.mutate(results.map(result => ({ oppId: result.oppId, assignedTo: result.assignedTo })))
      return
    }
    results.forEach(r => {
      if (r.assignedTo) updateOpportunity(r.oppId, { owner_user_id: r.assignedTo })
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
      {sellersQuery.isLoading && realCompanyId ? (
        <LoadingState rows={3} />
      ) : sellersQuery.isError && realCompanyId ? (
        <ErrorState message="No se pudo cargar el equipo comercial real." onRetry={() => sellersQuery.refetch()} />
      ) : sellers.length === 0 ? (
        <EmptyState title="Sin vendedores activos" description="Cuando existan usuarios comerciales asignados a esta unidad aparecerán aquí." />
      ) : (
      <>
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
              <ActionButton variant="ghost" size="sm" className="mt-3 w-full justify-center" onClick={() => navigate(`/app/vendedores/${selectedSellerData.id}`)}>
                Ver detalle del vendedor
              </ActionButton>
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
              disabled={assignMutation.isPending || unassignedOpps.length === 0}
              className={cn(
                'w-full py-2.5 rounded-xl text-xs font-medium transition-all',
                unassignedOpps.length > 0
                  ? 'bg-alqia-copper hover:bg-alqia-copper/90 text-white'
                  : 'bg-white/8 text-alqia-muted cursor-not-allowed',
              )}
            >
              {assignMutation.isPending
                ? 'Asignando...'
                : unassignedOpps.length > 0
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
      </>
      )}
    </div>
  )
}
