import { GlassCard } from '@/components/ui/GlassCard'
import { PageHeader } from '@/components/layout/PageHeader'
import { ActionButton } from '@/components/ui/ActionButton'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { mockTasks, mockUsers } from '@/data'
import { fetchSellers, fetchTasks, updateTask } from '@/lib/apiClient'
import { useAppStore } from '@/store/appStore'
import { formatRelativeDate } from '@/lib/utils'
import { logEvent } from '@/lib/utils'
import { CheckSquare, Clock, Sparkles, AlertTriangle, Check } from 'lucide-react'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

type TaskFilter = 'all' | 'overdue' | 'today' | 'ai'

export function TasksPage() {
  const queryClient = useQueryClient()
  const { activeCompany, currentUser } = useAppStore()
  const [filter, setFilter] = useState<TaskFilter>('all')
  const realCompanyId = activeCompany.db_company_id
  const assignedFilter = currentUser.role_type === 'sales_rep' ? currentUser.id : undefined

  const tasksQuery = useQuery({
    queryKey: ['tasks', realCompanyId, assignedFilter],
    queryFn: () => fetchTasks({ company_id: realCompanyId as string, assigned_to: assignedFilter, limit: 200 }),
    enabled: Boolean(realCompanyId),
  })

  const sellersQuery = useQuery({
    queryKey: ['sellers', realCompanyId, 'tasks'],
    queryFn: () => fetchSellers(realCompanyId as string),
    enabled: Boolean(realCompanyId),
  })

  const completeTaskMutation = useMutation({
    mutationFn: (taskId: string) => updateTask(taskId, { status: 'completed' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks', realCompanyId] })
    },
  })

  const sourceTasks = tasksQuery.data?.data?.length ? tasksQuery.data.data.map(task => ({
    ...task,
    ai_generated: task.ai_generated ?? false,
  })) : mockTasks

  const filtered = sourceTasks.filter(task => {
    const dueDate = task.due_at ? new Date(task.due_at) : null
    const isOverdue = dueDate ? dueDate.getTime() < Date.now() && ['pending', 'in_progress', 'overdue'].includes(task.status) : false
    if (filter === 'overdue') return isOverdue
    if (filter === 'today') {
      if (!dueDate) return false
      const today = new Date()
      return dueDate.toDateString() === today.toDateString()
    }
    if (filter === 'ai') return Boolean(task.ai_generated)
    return true
  })

  const sellerMap = new Map(
    (sellersQuery.data?.data ?? []).map(seller => [seller.id, seller.full_name]),
  )

  const filters: { id: TaskFilter; label: string; count: number }[] = [
    { id: 'all', label: 'Todas', count: sourceTasks.length },
    { id: 'overdue', label: 'Vencidas', count: sourceTasks.filter(task => task.due_at && new Date(task.due_at).getTime() < Date.now() && ['pending', 'in_progress', 'overdue'].includes(task.status)).length },
    { id: 'today', label: 'Hoy', count: sourceTasks.filter(task => task.due_at && new Date(task.due_at).toDateString() === new Date().toDateString()).length },
    { id: 'ai', label: 'Creadas por IA', count: sourceTasks.filter(task => task.ai_generated).length },
  ]

  return (
    <div className="p-6 max-w-[900px] mx-auto">
      <PageHeader title="Tareas" description="Seguimiento comercial pendiente" />

      <div className="flex items-center gap-2 mb-4">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all ${
              filter === f.id
                ? 'bg-alqia-copper/20 text-alqia-copper border border-alqia-copper/30'
                : 'bg-white/[0.04] text-alqia-muted border border-white/8 hover:text-white'
            }`}
          >
            {f.label}
            {f.count > 0 && <span className="text-[10px] opacity-70">{f.count}</span>}
          </button>
        ))}
      </div>

      {tasksQuery.isLoading && realCompanyId ? (
        <LoadingState rows={4} />
      ) : tasksQuery.isError && realCompanyId ? (
        <ErrorState message="No se pudieron cargar las tareas reales." onRetry={() => tasksQuery.refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState title="Sin tareas pendientes" description="Cuando existan seguimientos o tareas creadas por IA aparecerán aquí." />
      ) : (
        <div className="flex flex-col gap-2">
        {filtered.map(task => {
          const assigneeName = sellerMap.get(task.assigned_to ?? '') ?? mockUsers.find(u => u.id === task.assigned_to)?.full_name
          const isOverdue = task.status === 'overdue'
            || Boolean(task.due_at && new Date(task.due_at).getTime() < Date.now() && ['pending', 'in_progress'].includes(task.status))
          return (
            <GlassCard key={task.id} variant="interactive" padding="sm" className="flex items-start gap-3">
              <button
                onClick={() => {
                  if (realCompanyId) {
                    completeTaskMutation.mutate(task.id)
                    return
                  }
                  logEvent('task.completed', { task_id: task.id })
                }}
                className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                  task.status === 'completed'
                    ? 'bg-alqia-success/20 border-alqia-success/30'
                    : 'border-white/20 hover:border-alqia-success/40 hover:bg-alqia-success/10'
                }`}
              >
                {task.status === 'completed' && <Check size={11} className="text-alqia-success" />}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm leading-tight ${task.status === 'completed' ? 'line-through text-alqia-muted' : 'text-white'}`}>
                    {task.title}
                  </p>
                  {task.ai_generated && (
                    <StatusBadge variant="info" size="sm"><Sparkles size={9} /> IA</StatusBadge>
                  )}
                  {isOverdue && (
                    <StatusBadge variant="risk" size="sm"><AlertTriangle size={9} /> Vencida</StatusBadge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1">
                    <Clock size={10} className={isOverdue ? 'text-alqia-risk' : 'text-alqia-muted'} />
                    <span className={`text-[11px] ${isOverdue ? 'text-alqia-risk' : 'text-alqia-muted'}`}>
                      {task.due_at ? formatRelativeDate(task.due_at) : 'Sin fecha'}
                    </span>
                  </div>
                  {assigneeName && (
                    <span className="text-[11px] text-alqia-muted">
                      → {assigneeName.split(' ')[0]}
                    </span>
                  )}
                </div>
              </div>

              <ActionButton variant="ghost" size="sm" className="flex-shrink-0">
                <CheckSquare size={13} />
              </ActionButton>
            </GlassCard>
          )
        })}
        </div>
      )}
    </div>
  )
}
