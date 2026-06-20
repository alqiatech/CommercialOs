import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { mockTasks } from '@/data'
import { GlassCard } from '@/components/ui/GlassCard'
import { ErrorState, LoadingState } from '@/components/ui/States'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { StatusBadge, ChannelBadge } from '@/components/ui/StatusBadge'
import { ActionButton } from '@/components/ui/ActionButton'
import { TimelineEvent } from '@/components/ui/TimelineEvent'
import { createTask, fetchOpportunityDetail, updateOpportunityStage, updateOpportunityStatus } from '@/lib/apiClient'
import { fetchSellers, updateOpportunityOwner } from '@/lib/apiClient'
import { formatCurrency, formatRelativeDate } from '@/lib/utils'
import { logEvent } from '@/lib/utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Interaction } from '@/types'
import {
  ArrowLeft, MessageCircle, Phone, Mail, CheckSquare,
  GitCommitHorizontal, Trophy, XCircle, Sparkles, Clock,
} from 'lucide-react'

export function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { activeCompany, activeOpportunities, activeContacts, activeStages, activeInteractions, currentUser, moveOpportunityStage, updateOpportunityStatus: updateLocalOpportunityStatus } = useAppStore()
  const realCompanyId = activeCompany.db_company_id

  const opportunityDetailQuery = useQuery({
    queryKey: ['opportunity-detail', id, realCompanyId],
    queryFn: () => fetchOpportunityDetail(id as string),
    enabled: Boolean(id && realCompanyId),
  })

  const sellersQuery = useQuery({
    queryKey: ['sellers', realCompanyId, 'opportunity-detail'],
    queryFn: () => fetchSellers(realCompanyId as string),
    enabled: Boolean(realCompanyId),
  })

  const fallbackOpp = activeOpportunities.find(o => o.id === id)
  const fallbackContact = activeContacts.find(c => c.id === fallbackOpp?.contact_id)
  const fallbackStage = activeStages.find(s => s.id === fallbackOpp?.stage_id)
  const owner = currentUser
  const fallbackInteractions = activeInteractions.filter(i => i.opportunity_id === id)
    .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
  const fallbackTasks = mockTasks.filter(t => t.opportunity_id === id)

  const realOpp = opportunityDetailQuery.data
  const opp = realOpp ?? fallbackOpp
  const contact = realOpp?.contact ?? fallbackContact
  const stage = realOpp?.stage ?? fallbackStage
  const ownerUserId = realOpp?.owner_user_id ?? fallbackOpp?.owner_user_id ?? currentUser.id
  const sellerOptions = sellersQuery.data?.data ?? []
  const ownerDisplayName = sellerOptions.find(seller => seller.id === ownerUserId)?.full_name ?? currentUser.full_name
  const interactions: Interaction[] = realOpp?.interactions?.map(interaction => ({
    id: interaction.id,
    tenant_id: currentUser.tenant_id,
    company_id: realCompanyId ?? activeCompany.id,
    opportunity_id: interaction.opportunity_id ?? undefined,
    contact_id: interaction.contact_id ?? undefined,
    user_id: interaction.user_id ?? undefined,
    agent_type: interaction.agent_type as Interaction['agent_type'],
    channel: interaction.channel as Interaction['channel'],
    direction: interaction.direction as Interaction['direction'],
    subject: interaction.subject ?? 'Interacción',
    content: interaction.content ?? undefined,
    summary: interaction.summary ?? interaction.content ?? undefined,
    sentiment: interaction.sentiment as Interaction['sentiment'],
    intent: undefined,
    outcome: undefined,
    metadata: {},
    occurred_at: interaction.occurred_at,
    created_at: interaction.created_at,
  })) ?? fallbackInteractions
  const tasks = realOpp?.tasks?.map(task => ({
    ...task,
    task_type: task.type ?? 'follow_up',
    ai_generated: false,
  })) ?? fallbackTasks
  const nextStage = stage ? activeStages.find(candidate => candidate.order_index === stage.order_index + 1) : undefined
  const opportunityId = opp?.id ?? ''
  const contactId = contact?.id ?? ''
  const contactName = contact?.full_name ?? 'contacto'
  const opportunityTitle = opp?.title ?? 'oportunidad'

  const stageMutation = useMutation({
    mutationFn: (stageId: string) => updateOpportunityStage(opportunityId, { stage_id: stageId, user_id: currentUser.id }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['opportunity-detail', id, realCompanyId] })
      void queryClient.invalidateQueries({ queryKey: ['opportunities', realCompanyId] })
      void queryClient.invalidateQueries({ queryKey: ['interactions', realCompanyId, 'revenue-radar'] })
      void queryClient.invalidateQueries({ queryKey: ['ai-findings', realCompanyId, 'revenue-radar'] })
    },
  })

  const statusMutation = useMutation({
    mutationFn: (status: 'won' | 'lost') => updateOpportunityStatus(opportunityId, { status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['opportunity-detail', id, realCompanyId] })
      void queryClient.invalidateQueries({ queryKey: ['opportunities', realCompanyId] })
      void queryClient.invalidateQueries({ queryKey: ['ai-findings', realCompanyId, 'revenue-radar'] })
    },
  })

  const taskMutation = useMutation({
    mutationFn: () => createTask({
      tenant_id: currentUser.tenant_id,
      company_id: realCompanyId as string,
      contact_id: contactId,
      opportunity_id: opportunityId,
      assigned_to: currentUser.id,
      created_by: currentUser.id,
      type: 'follow_up',
      priority: 'medium',
      title: `Seguimiento a ${contactName}`,
      description: `Tarea creada desde la oportunidad ${opportunityTitle}.`,
      due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      ai_generated: false,
      metadata: { source: 'opportunity_detail' },
    }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['opportunity-detail', id, realCompanyId] })
      void queryClient.invalidateQueries({ queryKey: ['tasks', realCompanyId] })
    },
  })

  const ownerMutation = useMutation({
    mutationFn: (nextOwnerId: string) => updateOpportunityOwner(opportunityId, { owner_user_id: nextOwnerId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['opportunity-detail', id, realCompanyId] })
      void queryClient.invalidateQueries({ queryKey: ['opportunities', realCompanyId] })
      void queryClient.invalidateQueries({ queryKey: ['sellers', realCompanyId] })
    },
  })

  const handleMoveStage = () => {
    if (!nextStage) return
    if (realCompanyId) {
      stageMutation.mutate(nextStage.id)
      return
    }
    moveOpportunityStage(opportunityId, nextStage.id)
    logEvent('opportunity.stage_changed', { opportunity_id: opportunityId, stage_id: nextStage.id })
  }

  const handleCreateTask = () => {
    if (realCompanyId) {
      taskMutation.mutate()
      return
    }
    logEvent('task.drawer_opened', { opportunity_id: opportunityId })
  }

  const handleStatusChange = (status: 'won' | 'lost') => {
    if (realCompanyId) {
      statusMutation.mutate(status)
      return
    }
    updateLocalOpportunityStatus(opportunityId, status)
    logEvent(status === 'won' ? 'opportunity.won' : 'opportunity.lost', { opportunity_id: opportunityId })
  }

  if (opportunityDetailQuery.isLoading && realCompanyId) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto">
        <LoadingState rows={3} />
      </div>
    )
  }

  if (opportunityDetailQuery.isError && realCompanyId) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto">
        <ErrorState message="No se pudo cargar la oportunidad real." onRetry={() => opportunityDetailQuery.refetch()} />
      </div>
    )
  }

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
              <span>Responsable: <span className="text-white">{ownerDisplayName.split(' ')[0]}</span></span>
              <span>Valor: <span className="text-alqia-copper font-data font-medium">{formatCurrency(opp.estimated_value ?? 0)}</span></span>
              <span>Probabilidad: <span className="text-white">{opp.probability}%</span></span>
            </div>
            {realCompanyId && sellerOptions.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[11px] text-alqia-muted uppercase tracking-wide">Asignar a</span>
                <select
                  value={ownerUserId}
                  onChange={(e) => ownerMutation.mutate(e.target.value)}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-alqia-copper/40"
                  disabled={ownerMutation.isPending}
                >
                  {sellerOptions.map(seller => (
                    <option key={seller.id} value={seller.id} className="bg-alqia-dark text-white">
                      {seller.full_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
              onClick={handleMoveStage}
              disabled={stageMutation.isPending || !nextStage}
            >
              {nextStage ? `Mover a ${nextStage.name}` : 'Etapa final'}
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
                  <span className="text-alqia-secondary font-data">{contact.normalized_phone ?? contact.phone}</span>
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
                        <span className="text-[10px] text-alqia-muted">{task.due_at ? formatRelativeDate(task.due_at) : 'Sin fecha'}</span>
                        {task.ai_generated && <StatusBadge variant="info" size="sm">IA</StatusBadge>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <ActionButton
              variant="ghost"
              size="sm"
              icon={<CheckSquare size={12} />}
              className="mt-2 w-full justify-center"
              onClick={handleCreateTask}
              loading={taskMutation.isPending}
            >
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
                onClick={() => handleStatusChange('won')}
                loading={statusMutation.isPending}
              >
                Marcar ganada
              </ActionButton>
              <ActionButton
                variant="danger"
                size="sm"
                icon={<XCircle size={12} />}
                className="w-full justify-center"
                onClick={() => handleStatusChange('lost')}
                loading={statusMutation.isPending}
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
