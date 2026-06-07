import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { mockTasks } from '@/data'
import { GlassCard } from '@/components/ui/GlassCard'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { StatusBadge, ChannelBadge } from '@/components/ui/StatusBadge'
import { ActionButton } from '@/components/ui/ActionButton'
import { TimelineEvent } from '@/components/ui/TimelineEvent'
import { formatCurrency, formatRelativeDate } from '@/lib/utils'
import { logEvent } from '@/lib/utils'
import {
  ArrowLeft, MessageCircle, Phone, Mail, CheckSquare,
  GitCommitHorizontal, Trophy, XCircle, Sparkles, Clock,
} from 'lucide-react'

export function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { activeOpportunities, activeContacts, activeStages, activeInteractions, currentUser } = useAppStore()

  const opp = activeOpportunities.find(o => o.id === id)
  const contact = activeContacts.find(c => c.id === opp?.contact_id)
  const stage = activeStages.find(s => s.id === opp?.stage_id)
  const owner = currentUser
  const interactions = activeInteractions.filter(i => i.opportunity_id === id)
    .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
  const tasks = mockTasks.filter(t => t.opportunity_id === id)

  if (!opp || !contact) {
    return (
      <div className="p-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-alqia-secondary hover:text-white text-sm mb-4">
          <ArrowLeft size={16} /> Volver
        </button>
        <p className="text-alqia-muted">Oportunidad no encontrada.</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Volver */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-alqia-secondary hover:text-white text-sm mb-4 transition-colors">
        <ArrowLeft size={16} /> Oportunidades
      </button>

      {/* Header de oportunidad */}
      <GlassCard variant="elevated" className="mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-semibold text-white">{opp.title}</h1>
              <StatusBadge variant={stage?.name === 'Ganado' ? 'success' : stage?.name === 'Perdido' ? 'risk' : 'warning'} size="sm">
                {stage?.name}
              </StatusBadge>
            </div>
            <div className="flex items-center gap-4 text-sm text-alqia-secondary">
              <span>Responsable: <span className="text-white">{owner?.full_name.split(' ')[0]}</span></span>
              <span>Valor: <span className="text-alqia-copper font-data font-medium">{formatCurrency(opp.estimated_value ?? 0)}</span></span>
              <span>Probabilidad: <span className="text-white">{opp.probability}%</span></span>
            </div>
          </div>

          {/* Scores */}
          <div className="flex items-center gap-4">
            <ScoreRing value={opp.lead_intent_score} size="md" label="Intención" />
            <ScoreRing value={opp.data_trust_score} size="md" label="Datos" />
            <ScoreRing value={opp.urgency_score} size="md" label="Urgencia" />
          </div>

          {/* Acciones principales */}
          <div className="flex items-center gap-2">
            <ActionButton
              variant="success"
              size="sm"
              icon={<MessageCircle size={13} />}
              onClick={() => logEvent('message.whatsapp_composer_opened', { opportunity_id: opp.id })}
              className="bg-alqia-success/10 text-alqia-success border-alqia-success/20 hover:bg-alqia-success/20"
            >
              WhatsApp
            </ActionButton>
            <ActionButton
              variant="ghost"
              size="sm"
              icon={<Phone size={13} />}
              onClick={() => logEvent('call.action_opened', { opportunity_id: opp.id })}
            >
              Llamar
            </ActionButton>
            <ActionButton
              variant="ghost"
              size="sm"
              icon={<GitCommitHorizontal size={13} />}
              onClick={() => logEvent('opportunity.stage_changed', { opportunity_id: opp.id })}
            >
              Mover etapa
            </ActionButton>
          </div>
        </div>
      </GlassCard>

      {/* Layout de 3 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

        {/* Columna izq — Datos del contacto */}
        <div className="flex flex-col gap-3">
          <GlassCard>
            <h3 className="text-xs font-medium text-alqia-muted uppercase tracking-wide mb-3">Contacto</h3>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-full bg-alqia-copper/20 flex items-center justify-center text-alqia-copper font-medium">
                {contact.full_name.split(' ').map(n => n[0]).join('').slice(0,2)}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{contact.full_name}</p>
                <p className="text-xs text-alqia-secondary">{contact.city}, {contact.state}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {contact.phone && (
                <div className="flex items-center gap-2 text-xs">
                  <ChannelBadge channel="phone" size="sm" />
                  <span className="text-alqia-secondary font-data">{contact.normalized_phone}</span>
                </div>
              )}
              {contact.whatsapp_phone && (
                <div className="flex items-center gap-2 text-xs">
                  <ChannelBadge channel="whatsapp" size="sm" />
                  <span className="text-alqia-secondary font-data">{contact.whatsapp_phone}</span>
                </div>
              )}
              {contact.email && (
                <div className="flex items-center gap-2 text-xs">
                  <ChannelBadge channel="email" size="sm" />
                  <span className="text-alqia-secondary truncate">{contact.email}</span>
                </div>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center gap-2">
              <span className="text-[10px] text-alqia-muted">Consentimiento:</span>
              <StatusBadge variant={contact.consent_status === 'granted' ? 'success' : 'warning'} size="sm">
                {contact.consent_status}
              </StatusBadge>
            </div>
          </GlassCard>

          {/* Tareas */}
          <GlassCard>
            <h3 className="text-xs font-medium text-alqia-muted uppercase tracking-wide mb-3">Tareas</h3>
            {tasks.length === 0 ? (
              <p className="text-xs text-alqia-muted">Sin tareas pendientes.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {tasks.map(task => (
                  <div key={task.id} className="flex items-start gap-2 bg-white/[0.04] rounded-lg p-2">
                    <CheckSquare size={12} className={`mt-0.5 flex-shrink-0 ${task.status === 'overdue' ? 'text-alqia-risk' : 'text-alqia-copper'}`} />
                    <div>
                      <p className="text-xs text-white leading-tight">{task.title}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock size={10} className="text-alqia-muted" />
                        <span className="text-[10px] text-alqia-muted">{formatRelativeDate(task.due_at)}</span>
                        {task.ai_generated && <StatusBadge variant="info" size="sm">IA</StatusBadge>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <ActionButton variant="ghost" size="sm" icon={<CheckSquare size={12} />} className="mt-2 w-full justify-center">
              Nueva tarea
            </ActionButton>
          </GlassCard>
        </div>

        {/* Centro — Timeline */}
        <div className="lg:col-span-2">
          <GlassCard>
            <h3 className="text-xs font-medium text-alqia-muted uppercase tracking-wide mb-4">Memoria Comercial</h3>
            {interactions.length === 0 ? (
              <p className="text-xs text-alqia-muted">Sin interacciones registradas.</p>
            ) : (
              <div>
                {interactions.map((interaction, i) => (
                  <TimelineEvent
                    key={interaction.id}
                    interaction={interaction}
                    isLast={i === interactions.length - 1}
                  />
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Columna der — Resumen IA y acciones */}
        <div className="flex flex-col gap-3">
          {/* Resumen IA */}
          <GlassCard className="border-alqia-info/20">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={13} className="text-alqia-info" />
              <h3 className="text-xs font-medium text-alqia-info uppercase tracking-wide">Resumen IA</h3>
            </div>
            <p className="text-xs text-alqia-secondary leading-relaxed">
              {opp.ai_summary ?? 'Sin resumen disponible. Genera uno con el botón de abajo.'}
            </p>
            <ActionButton
              variant="ghost"
              size="sm"
              icon={<Sparkles size={12} />}
              className="mt-3 w-full justify-center border-alqia-info/20 text-alqia-info hover:bg-alqia-info/10"
              onClick={() => logEvent('ai.summary.generated', { opportunity_id: opp.id })}
            >
              Actualizar resumen
            </ActionButton>
          </GlassCard>

          {/* Siguiente acción */}
          {opp.next_action_at && (
            <GlassCard className="border-alqia-info/20">
              <h3 className="text-xs font-medium text-alqia-info uppercase tracking-wide mb-2">Siguiente acción</h3>
              <div className="flex items-center gap-1.5">
                <Clock size={12} className="text-alqia-info" />
                <span className="text-xs text-alqia-secondary">{formatRelativeDate(opp.next_action_at)}</span>
              </div>
            </GlassCard>
          )}

          {/* Cerrar oportunidad */}
          <GlassCard>
            <h3 className="text-xs font-medium text-alqia-muted uppercase tracking-wide mb-3">Cierre</h3>
            <div className="flex flex-col gap-2">
              <ActionButton
                variant="success"
                size="sm"
                icon={<Trophy size={12} />}
                className="w-full justify-center"
                onClick={() => logEvent('opportunity.won', { opportunity_id: opp.id })}
              >
                Marcar ganada
              </ActionButton>
              <ActionButton
                variant="danger"
                size="sm"
                icon={<XCircle size={12} />}
                className="w-full justify-center"
                onClick={() => logEvent('opportunity.lost', { opportunity_id: opp.id })}
              >
                Marcar perdida
              </ActionButton>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
