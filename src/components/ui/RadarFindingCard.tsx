import { cn, formatRelativeDate, formatCurrency } from '@/lib/utils'
import type { AiFinding } from '@/types'
import {
  Sparkles, ChevronDown, ChevronUp, X,
  AlertTriangle, AlertCircle, Zap, Info,
  ArrowRight, TrendingUp,
} from 'lucide-react'
import { useState } from 'react'
import { logEvent } from '@/lib/utils'

const severityConfig = {
  critical: {
    icon: AlertCircle,
    labelColor: 'text-alqia-risk',
    borderColor: 'border-alqia-risk/25',
    bgColor: 'bg-alqia-risk/5',
    accentBar: 'bg-alqia-risk',
    label: 'CRITICO',
  },
  high: {
    icon: AlertTriangle,
    labelColor: 'text-alqia-warning',
    borderColor: 'border-alqia-warning/20',
    bgColor: 'bg-alqia-warning/4',
    accentBar: 'bg-alqia-warning',
    label: 'ALTO',
  },
  medium: {
    icon: Zap,
    labelColor: 'text-alqia-info',
    borderColor: 'border-alqia-info/15',
    bgColor: 'bg-alqia-info/3',
    accentBar: 'bg-alqia-info',
    label: 'MEDIO',
  },
  low: {
    icon: Info,
    labelColor: 'text-alqia-muted',
    borderColor: 'border-white/10',
    bgColor: 'bg-white/[0.02]',
    accentBar: 'bg-white/20',
    label: 'BAJO',
  },
  info: {
    icon: Info,
    labelColor: 'text-alqia-muted',
    borderColor: 'border-white/10',
    bgColor: 'bg-white/[0.02]',
    accentBar: 'bg-white/20',
    label: 'INFO',
  },
}

interface RadarFindingCardProps {
  finding: AiFinding
  onExecute?: (finding: AiFinding) => void
  onDismiss?: (finding: AiFinding) => void
  className?: string
}

export function RadarFindingCard({ finding, onExecute, onDismiss, className }: RadarFindingCardProps) {
  const [expanded, setExpanded] = useState(false)
  const cfg = severityConfig[finding.severity] ?? severityConfig.info
  const Icon = cfg.icon

  // Impacto económico estimado desde evidencia
  const estimatedImpact: number | null = (finding.evidence?.metrics?.total_value_at_risk as number) ?? null

  const handleExecute = () => {
    logEvent('ai.action.approval_requested', { finding_id: finding.id })
    onExecute?.(finding)
  }

  const handleDismiss = () => {
    logEvent('ai.finding.dismissed', { finding_id: finding.id })
    onDismiss?.(finding)
  }

  return (
    <div className={cn(
      'group relative rounded-2xl border transition-all duration-200 overflow-hidden',
      cfg.borderColor, cfg.bgColor,
      'hover:shadow-glass-hover',
      className,
    )}>
      {/* Barra de acento lateral */}
      <div className={cn('absolute left-0 top-4 bottom-4 w-[3px] rounded-full', cfg.accentBar)} />

      <div className="pl-5 pr-4 pt-4 pb-4">

        {/* Encabezado — severidad + título + dismiss */}
        <div className="flex items-start gap-3">
          <Icon size={15} className={cn('flex-shrink-0 mt-0.5', cfg.labelColor)} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={cn('text-[9px] font-semibold tracking-[0.12em] uppercase', cfg.labelColor)}>
                {cfg.label}
              </span>
              <span className="text-[9px] text-alqia-muted">
                · {formatRelativeDate(finding.created_at)} · {Math.round(finding.confidence * 100)}% confianza
              </span>
            </div>
            <h4 className="text-sm font-medium text-white leading-snug">{finding.title}</h4>
          </div>

          <button
            onClick={handleDismiss}
            className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-alqia-muted hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
          >
            <X size={12} />
          </button>
        </div>

        {/* Impacto económico — si existe */}
        {estimatedImpact != null && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-alqia-risk/8 border border-alqia-risk/15">
            <TrendingUp size={12} className="text-alqia-risk flex-shrink-0" />
            <p className="text-[11px] text-alqia-secondary">
              <span className="text-white font-medium">{formatCurrency(estimatedImpact)}</span>
              {' '}en pipeline sin seguimiento activo
            </p>
          </div>
        )}

        {/* Descripción breve */}
        <p className="text-xs text-alqia-secondary mt-3 leading-relaxed line-clamp-2">
          {finding.description}
        </p>

        {/* Evidencia expandible */}
        {finding.evidence && (
          <div className="mt-3">
            <button
              onClick={() => {
                setExpanded(!expanded)
                if (!expanded) logEvent('ai.finding.evidence_opened', { finding_id: finding.id })
              }}
              className="flex items-center gap-1.5 text-[11px] text-alqia-muted hover:text-alqia-secondary transition-colors"
            >
              <Sparkles size={10} className="text-alqia-info" />
              <span>Evidencia IA</span>
              {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}

              {finding.evidence.count && (
                <span className="ml-2 text-white font-medium">{finding.evidence.count} registros</span>
              )}
            </button>

            {expanded && (
              <div className="mt-2 rounded-xl bg-white/[0.04] border border-white/[0.07] p-3 animate-fade-in">
                {finding.evidence.metrics && (
                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    {Object.entries(finding.evidence.metrics)
                      .filter(([k]) => k !== 'total_value_at_risk')
                      .map(([k, v]) => (
                      <div key={k}>
                        <p className="text-[9px] text-alqia-muted uppercase tracking-wide">
                          {k.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs font-data font-medium text-white">{String(v)}</p>
                      </div>
                    ))}
                  </div>
                )}
                {finding.evidence.explanation && (
                  <p className="text-[10px] text-alqia-muted mt-2 leading-relaxed italic border-t border-white/6 pt-2">
                    {finding.evidence.explanation}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Acción recomendada + CTA */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-[11px] text-alqia-secondary leading-snug flex-1">
            <span className="text-alqia-copper font-medium">Acción: </span>
            {finding.recommended_action}
          </p>
          <button
            onClick={handleExecute}
            className={cn(
              'flex items-center gap-1.5 flex-shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-medium',
              'bg-alqia-copper text-white hover:bg-alqia-copper-hover transition-colors shadow-copper-glow',
            )}
          >
            Ejecutar
            <ArrowRight size={11} />
          </button>
        </div>
      </div>
    </div>
  )
}
