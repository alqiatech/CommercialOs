import { GlassCard } from './GlassCard'
import { ScoreRing } from './ScoreRing'
import { StatusBadge, ChannelBadge } from './StatusBadge'
import { ActionButton } from './ActionButton'
import { cn, formatRelativeDate, getInitials, getIntentLabel } from '@/lib/utils'
import type { Opportunity } from '@/types'
import { MessageCircle, Phone, CheckSquare, GitCommitHorizontal, User } from 'lucide-react'
import { logEvent } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

interface OpportunityPulseCardProps {
  opportunity: Opportunity
  className?: string
}

export function OpportunityPulseCard({ opportunity, className }: OpportunityPulseCardProps) {
  const navigate = useNavigate()
  const intentLabel = getIntentLabel(opportunity.lead_intent_score)

  const intentVariant = opportunity.lead_intent_score >= 80 ? 'success'
    : opportunity.lead_intent_score >= 60 ? 'warning'
    : 'neutral'

  const handleOpen = () => {
    logEvent('opportunity.opened', { id: opportunity.id })
    navigate(`/oportunidades/${opportunity.id}`)
  }

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation()
    logEvent('communication.whatsapp_composer_opened', { opportunity_id: opportunity.id })
  }

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation()
    logEvent('call.action_opened', { opportunity_id: opportunity.id })
  }

  const handleTask = (e: React.MouseEvent) => {
    e.stopPropagation()
    logEvent('task.drawer_opened', { opportunity_id: opportunity.id })
  }

  return (
    <GlassCard
      variant="interactive"
      onClick={handleOpen}
      className={cn('flex flex-col gap-3', className)}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-alqia-copper/20 flex items-center justify-center text-alqia-copper text-sm font-medium flex-shrink-0">
          {opportunity.contact
            ? getInitials(opportunity.contact.full_name)
            : <User size={16} />}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white leading-tight truncate">
            {opportunity.contact?.full_name ?? 'Contacto'}
          </p>
          <p className="text-xs text-alqia-secondary truncate">{opportunity.product_interest}</p>
        </div>

        <StatusBadge variant={intentVariant} size="sm" dot>
          {intentLabel}
        </StatusBadge>
      </div>

      {/* Scores */}
      <div className="flex items-center gap-4">
        <ScoreRing value={opportunity.lead_intent_score} size="sm" label="Intención" />
        <ScoreRing value={opportunity.data_trust_score} size="sm" label="Datos" />
        <ScoreRing value={opportunity.urgency_score} size="sm" label="Urgencia" />

        <div className="flex-1 text-right">
          <p className="text-[10px] text-alqia-muted">Último contacto</p>
          <p className="text-xs text-alqia-secondary">
            {opportunity.last_contact_at
              ? formatRelativeDate(opportunity.last_contact_at)
              : 'Sin contacto'}
          </p>
        </div>
      </div>

      {/* Canal recomendado */}
      {opportunity.contact?.preferred_channel && (
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-alqia-muted">Canal recomendado:</span>
          <ChannelBadge channel={opportunity.contact.preferred_channel as never} size="sm" />
        </div>
      )}

      {/* Resumen IA */}
      {opportunity.ai_summary && (
        <p className="text-xs text-alqia-secondary leading-relaxed line-clamp-2 border-t border-white/[0.06] pt-2">
          {opportunity.ai_summary}
        </p>
      )}

      {/* Acciones */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-white/[0.06]">
        <ActionButton
          variant="success"
          size="sm"
          icon={<MessageCircle size={12} />}
          onClick={handleWhatsApp}
          className="bg-alqia-success/10 text-alqia-success border-alqia-success/20 hover:bg-alqia-success/20"
        >
          WA
        </ActionButton>
        <ActionButton
          variant="ghost"
          size="sm"
          icon={<Phone size={12} />}
          onClick={handleCall}
        >
          Llamar
        </ActionButton>
        <ActionButton
          variant="ghost"
          size="sm"
          icon={<CheckSquare size={12} />}
          onClick={handleTask}
        >
          Tarea
        </ActionButton>
        <ActionButton
          variant="copper"
          size="sm"
          icon={<GitCommitHorizontal size={12} />}
          onClick={handleOpen}
          className="ml-auto"
        >
          Abrir
        </ActionButton>
      </div>
    </GlassCard>
  )
}
