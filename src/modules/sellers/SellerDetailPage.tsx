import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, BarChart2, CheckSquare, Mail, Phone, Target, TrendingUp, User } from 'lucide-react'
import { fetchOpportunities, fetchSellers, fetchTasks } from '@/lib/apiClient'
import { useAppStore } from '@/store/appStore'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States'
import { GlassCard } from '@/components/ui/GlassCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ActionButton } from '@/components/ui/ActionButton'
import { formatCurrency, formatRelativeDate } from '@/lib/utils'

export default function SellerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { activeCompany } = useAppStore()
  const realCompanyId = activeCompany.db_company_id

  const sellersQuery = useQuery({
    queryKey: ['sellers', realCompanyId, 'detail'],
    queryFn: () => fetchSellers(realCompanyId as string),
    enabled: Boolean(realCompanyId),
  })

  const seller = sellersQuery.data?.data?.find(item => item.id === id)
  const ownerId = seller?.id

  const opportunitiesQuery = useQuery({
    queryKey: ['opportunities', realCompanyId, 'seller-detail', ownerId],
    queryFn: () => fetchOpportunities(realCompanyId as string, ownerId ? { owner_user_id: ownerId } : undefined),
    enabled: Boolean(realCompanyId && ownerId),
  })

  const tasksQuery = useQuery({
    queryKey: ['tasks', realCompanyId, 'seller-detail', ownerId],
    queryFn: () => fetchTasks({ company_id: realCompanyId as string, assigned_to: ownerId, limit: 100 }),
    enabled: Boolean(realCompanyId && ownerId),
  })

  const stats = useMemo(() => {
    const opps = opportunitiesQuery.data?.data ?? []
    const tasks = tasksQuery.data?.data ?? []
    const openOpps = opps.filter(opp => opp.status === 'open')
    const wonOpps = opps.filter(opp => opp.status === 'won')
    const overdueTasks = tasks.filter(task =>
      task.due_at && new Date(task.due_at).getTime() < Date.now() && ['pending', 'in_progress', 'overdue'].includes(task.status),
    )

    return {
      openOpps: openOpps.length,
      wonOpps: wonOpps.length,
      pipelineValue: openOpps.reduce((sum, opp) => sum + (opp.estimated_value ?? 0), 0),
      overdueTasks: overdueTasks.length,
      totalTasks: tasks.length,
    }
  }, [opportunitiesQuery.data?.data, tasksQuery.data?.data])

  if (!realCompanyId) {
    return (
      <div className="p-6 max-w-[1200px] mx-auto">
        <EmptyState title="Detalle real no disponible" description="Esta vista se activa cuando la unidad está conectada a datos persistidos." />
      </div>
    )
  }

  if (sellersQuery.isLoading) {
    return <div className="p-6 max-w-[1200px] mx-auto"><LoadingState rows={3} /></div>
  }

  if (sellersQuery.isError) {
    return <div className="p-6 max-w-[1200px] mx-auto"><ErrorState message="No se pudo cargar el vendedor." onRetry={() => sellersQuery.refetch()} /></div>
  }

  if (!seller) {
    return (
      <div className="p-6 max-w-[1200px] mx-auto">
        <button onClick={() => navigate('/app/vendedores')} className="flex items-center gap-2 text-alqia-secondary hover:text-white text-sm mb-4">
          <ArrowLeft size={16} /> Vendedores
        </button>
        <EmptyState title="Vendedor no encontrado" description="No encontramos ese miembro del equipo en la unidad actual." />
      </div>
    )
  }

  const opportunities = opportunitiesQuery.data?.data ?? []
  const tasks = tasksQuery.data?.data ?? []

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <button onClick={() => navigate('/app/vendedores')} className="flex items-center gap-2 text-alqia-secondary hover:text-white text-sm mb-4">
        <ArrowLeft size={16} /> Vendedores
      </button>

      <GlassCard variant="elevated" className="mb-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-full bg-alqia-copper/20 flex items-center justify-center text-alqia-copper font-medium">
              {seller.full_name.split(' ').map(part => part[0]).join('').slice(0, 2)}
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">{seller.full_name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <StatusBadge variant="info" size="sm">{seller.role_type}</StatusBadge>
                <StatusBadge variant={seller.status === 'active' ? 'success' : 'neutral'} size="sm">{seller.status}</StatusBadge>
              </div>
            </div>
          </div>
          <div className="flex flex-col text-sm text-alqia-secondary gap-1">
            <div className="flex items-center gap-2"><Mail size={12} /> {seller.email}</div>
            {seller.phone && <div className="flex items-center gap-2"><Phone size={12} /> {seller.phone}</div>}
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        {[
          { label: 'Abiertas', value: stats.openOpps, icon: <Target size={12} />, tone: 'text-alqia-copper' },
          { label: 'Ganadas', value: stats.wonOpps, icon: <TrendingUp size={12} />, tone: 'text-alqia-success' },
          { label: 'Pipeline', value: formatCurrency(stats.pipelineValue), icon: <BarChart2 size={12} />, tone: 'text-alqia-info' },
          { label: 'Tareas vencidas', value: stats.overdueTasks, icon: <CheckSquare size={12} />, tone: 'text-alqia-risk' },
          { label: 'Tareas total', value: stats.totalTasks, icon: <User size={12} />, tone: 'text-white' },
        ].map(item => (
          <GlassCard key={item.label} className="p-4">
            <div className={`flex items-center gap-1.5 mb-2 ${item.tone}`}>{item.icon}<span className="text-[10px] uppercase tracking-wide text-alqia-muted">{item.label}</span></div>
            <p className={`text-xl font-data font-semibold ${item.tone}`}>{item.value}</p>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-white">Oportunidades asignadas</h2>
            <span className="text-xs text-alqia-muted">{opportunities.length}</span>
          </div>
          {opportunitiesQuery.isLoading ? (
            <LoadingState rows={2} />
          ) : opportunities.length === 0 ? (
            <p className="text-xs text-alqia-muted">Sin oportunidades asignadas todavía.</p>
          ) : (
            <div className="space-y-2">
              {opportunities.slice(0, 8).map(opportunity => (
                <button
                  key={opportunity.id}
                  onClick={() => navigate(`/app/oportunidades/${opportunity.id}`)}
                  className="w-full text-left rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-white truncate">{opportunity.title}</p>
                    <StatusBadge size="sm" variant={opportunity.status === 'won' ? 'success' : opportunity.status === 'lost' ? 'risk' : 'neutral'}>
                      {opportunity.status}
                    </StatusBadge>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs text-alqia-secondary">
                    <span>{opportunity.contact?.full_name ?? 'Sin contacto'}</span>
                    <span>{formatCurrency(opportunity.estimated_value ?? 0)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-white">Tareas del vendedor</h2>
            <span className="text-xs text-alqia-muted">{tasks.length}</span>
          </div>
          {tasksQuery.isLoading ? (
            <LoadingState rows={2} />
          ) : tasks.length === 0 ? (
            <p className="text-xs text-alqia-muted">Sin tareas registradas.</p>
          ) : (
            <div className="space-y-2">
              {tasks.slice(0, 8).map(task => (
                <div key={task.id} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-white truncate">{task.title}</p>
                    <StatusBadge size="sm" variant={task.status === 'completed' ? 'success' : task.status === 'cancelled' ? 'neutral' : 'warning'}>
                      {task.status}
                    </StatusBadge>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs text-alqia-secondary">
                    <span>{task.type}</span>
                    <span>{task.due_at ? formatRelativeDate(task.due_at) : 'Sin fecha'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <ActionButton variant="ghost" size="sm" className="mt-3 w-full justify-center" onClick={() => navigate('/app/tareas')}>
            Ver todas las tareas
          </ActionButton>
        </GlassCard>
      </div>
    </div>
  )
}
