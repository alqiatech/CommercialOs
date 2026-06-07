import { cn, formatRelativeDate } from '@/lib/utils'
import { ChannelBadge } from './StatusBadge'
import {
  MessageCircle, Phone, Mail, FileText, Settings,
  GitCommitHorizontal, CheckSquare, Sparkles, ArrowRight,
  ChevronDown,
} from 'lucide-react'
import { useState } from 'react'
import type { Interaction } from '@/types'

const channelIcons: Record<string, typeof MessageCircle> = {
  whatsapp: MessageCircle,
  phone:    Phone,
  email:    Mail,
  note:     FileText,
  system:   Settings,
  meeting:  CheckSquare,
}

const agentColors: Record<string, string> = {
  human:   'bg-alqia-copper/20 text-alqia-copper',
  ai:      'bg-alqia-info/15 text-alqia-info',
  system:  'bg-white/10 text-alqia-secondary',
}

interface TimelineEventProps {
  interaction: Interaction
  isLast?: boolean
}

export function TimelineEvent({ interaction, isLast = false }: TimelineEventProps) {
  const [expanded, setExpanded] = useState(false)
  const Icon = channelIcons[interaction.channel] ?? Settings
  const isAi = interaction.agent_type === 'ai'

  return (
    <div className="relative flex gap-3">
      {/* Línea vertical */}
      {!isLast && (
        <div className="absolute left-4 top-8 bottom-0 w-px bg-white/[0.07]" />
      )}

      {/* Ícono del canal */}
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm z-10',
        agentColors[interaction.agent_type] ?? agentColors.system,
      )}>
        {isAi ? <Sparkles size={14} /> : <Icon size={14} />}
      </div>

      {/* Contenido */}
      <div className="flex-1 pb-4 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-white leading-tight">
              {interaction.subject ?? 'Interacción'}
            </span>
            <ChannelBadge channel={interaction.channel as never} size="sm" />
            {interaction.direction === 'inbound' && (
              <span className="text-[10px] text-alqia-secondary">← Entrante</span>
            )}
          </div>
          <span className="text-[11px] text-alqia-muted flex-shrink-0">
            {formatRelativeDate(interaction.occurred_at)}
          </span>
        </div>

        {/* Resumen */}
        {interaction.summary && (
          <p className="text-xs text-alqia-secondary mt-1 leading-relaxed">
            {interaction.summary}
          </p>
        )}

        {/* Contenido expandible */}
        {interaction.content && (
          <div className="mt-2">
            {!expanded ? (
              <button
                onClick={() => setExpanded(true)}
                className="flex items-center gap-1 text-[11px] text-alqia-muted hover:text-alqia-secondary transition-colors"
              >
                <ChevronDown size={12} /> Ver mensaje completo
              </button>
            ) : (
              <div className="bg-white/[0.04] rounded-lg p-3 mt-1 border border-white/[0.06]">
                <p className="text-xs text-alqia-secondary leading-relaxed whitespace-pre-wrap">
                  {interaction.content}
                </p>
                <button
                  onClick={() => setExpanded(false)}
                  className="text-[11px] text-alqia-muted hover:text-alqia-secondary mt-2 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Resultado */}
        {interaction.outcome && interaction.outcome !== 'stage_changed' && (
          <div className="flex items-center gap-1 mt-1">
            <ArrowRight size={10} className="text-alqia-muted" />
            <span className="text-[11px] text-alqia-muted capitalize">
              {interaction.outcome.replace(/_/g, ' ')}
            </span>
          </div>
        )}

        {/* Stage change especial */}
        {interaction.outcome === 'stage_changed' && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <GitCommitHorizontal size={12} className="text-alqia-info" />
            <span className="text-[11px] text-alqia-info">{interaction.content}</span>
          </div>
        )}
      </div>
    </div>
  )
}
