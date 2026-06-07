import { GlassCard } from './GlassCard'
import { cn, formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { ReactNode } from 'react'
import type { KpiCard } from '@/types'
import { ActionButton } from './ActionButton'

interface MetricCardProps extends KpiCard {
  icon?: ReactNode
  className?: string
}

export function MetricCard({
  title, value, trend, trendLabel, severity = 'neutral',
  actionLabel, onAction, icon, className,
}: MetricCardProps) {
  const isMonetary = typeof value === 'number' && value > 1000

  const formattedValue = isMonetary
    ? formatCurrency(value as number)
    : value.toLocaleString('es-MX')

  const trendPositive = (trend ?? 0) > 0
  const trendNeutral = (trend ?? 0) === 0

  const severityBorder: Record<string, string> = {
    success: 'border-t-2 border-t-alqia-success/40',
    warning: 'border-t-2 border-t-alqia-warning/40',
    risk:    'border-t-2 border-t-alqia-risk/40',
    info:    'border-t-2 border-t-alqia-info/40',
    neutral: '',
  }

  return (
    <GlassCard
      variant="elevated"
      className={cn('flex flex-col gap-3', severityBorder[severity], className)}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs text-alqia-muted font-sans uppercase tracking-wide">{title}</p>
        {icon && <div className="text-alqia-secondary opacity-60">{icon}</div>}
      </div>

      <div className="flex items-end justify-between gap-2">
        <span className="text-2xl font-data font-semibold text-white leading-none">
          {formattedValue}
        </span>

        {trend !== undefined && (
          <div className={cn(
            'flex items-center gap-0.5 text-xs font-data',
            trendPositive ? 'text-alqia-success' : trendNeutral ? 'text-alqia-secondary' : 'text-alqia-risk',
          )}>
            {trendNeutral
              ? <Minus size={12} />
              : trendPositive
                ? <TrendingUp size={12} />
                : <TrendingDown size={12} />}
            {Math.abs(trend ?? 0)}%
          </div>
        )}
      </div>

      {trendLabel && (
        <p className="text-[11px] text-alqia-muted leading-tight">{trendLabel}</p>
      )}

      {actionLabel && onAction && (
        <ActionButton
          variant="ghost"
          size="sm"
          onClick={onAction}
          className="mt-1 w-full justify-center text-alqia-copper border-alqia-copper/20 hover:bg-alqia-copper/10"
        >
          {actionLabel}
        </ActionButton>
      )}
    </GlassCard>
  )
}
