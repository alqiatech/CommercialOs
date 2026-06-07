import { GlassCard } from '@/components/ui/GlassCard'
import { PageHeader } from '@/components/layout/PageHeader'
import { ActionButton } from '@/components/ui/ActionButton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { mockTasks, mockUsers } from '@/data'
import { formatRelativeDate } from '@/lib/utils'
import { logEvent } from '@/lib/utils'
import { CheckSquare, Clock, Sparkles, AlertTriangle, Check } from 'lucide-react'
import { useState } from 'react'

type TaskFilter = 'all' | 'overdue' | 'today' | 'ai'

export function TasksPage() {
  const [filter, setFilter] = useState<TaskFilter>('all')

  const filtered = mockTasks.filter(t => {
    if (filter === 'overdue') return t.status === 'overdue'
    if (filter === 'today') {
      const due = new Date(t.due_at)
      const today = new Date()
      return due.toDateString() === today.toDateString()
    }
    if (filter === 'ai') return t.ai_generated
    return true
  })

  const filters: { id: TaskFilter; label: string; count: number }[] = [
    { id: 'all', label: 'Todas', count: mockTasks.length },
    { id: 'overdue', label: 'Vencidas', count: mockTasks.filter(t => t.status === 'overdue').length },
    { id: 'today', label: 'Hoy', count: 2 },
    { id: 'ai', label: 'Creadas por IA', count: mockTasks.filter(t => t.ai_generated).length },
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

      <div className="flex flex-col gap-2">
        {filtered.map(task => {
          const assignee = mockUsers.find(u => u.id === task.assigned_to)
          const isOverdue = task.status === 'overdue'
          return (
            <GlassCard key={task.id} variant="interactive" padding="sm" className="flex items-start gap-3">
              <button
                onClick={() => logEvent('task.completed', { task_id: task.id })}
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
                      {formatRelativeDate(task.due_at)}
                    </span>
                  </div>
                  {assignee && (
                    <span className="text-[11px] text-alqia-muted">
                      → {assignee.full_name.split(' ')[0]}
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
    </div>
  )
}
