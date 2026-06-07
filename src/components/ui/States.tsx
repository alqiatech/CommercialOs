import type { ReactNode } from 'react'
import { ActionButton } from './ActionButton'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  title: string
  description: string
  action?: string
  onAction?: () => void
  icon?: ReactNode
  className?: string
}

export function EmptyState({ title, description, action, onAction, icon, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 py-16 px-8 text-center', className)}>
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-alqia-muted">
          {icon}
        </div>
      )}
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-medium text-white">{title}</h3>
        <p className="text-sm text-alqia-secondary max-w-xs leading-relaxed">{description}</p>
      </div>
      {action && onAction && (
        <ActionButton variant="copper" size="md" onClick={onAction}>
          {action}
        </ActionButton>
      )}
    </div>
  )
}

// ---- LoadingState ----
interface LoadingStateProps {
  rows?: number
  className?: string
}

export function LoadingState({ rows = 3, className }: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-5 animate-pulse">
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-white/[0.08] flex-shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-3 bg-white/[0.08] rounded w-2/3" />
              <div className="h-2 bg-white/[0.05] rounded w-full" />
              <div className="h-2 bg-white/[0.05] rounded w-4/5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ---- ErrorState ----
interface ErrorStateProps {
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({ message = 'Ocurrió un error inesperado.', onRetry, className }: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 py-12 px-6 text-center', className)}>
      <div className="w-12 h-12 rounded-2xl bg-alqia-risk/10 border border-alqia-risk/20 flex items-center justify-center">
        <span className="text-alqia-risk text-xl">⚠</span>
      </div>
      <div>
        <p className="text-sm text-white font-medium">{message}</p>
        <p className="text-xs text-alqia-muted mt-1">Tus datos están seguros.</p>
      </div>
      {onRetry && (
        <ActionButton variant="ghost" size="sm" onClick={onRetry}>
          Reintentar
        </ActionButton>
      )}
    </div>
  )
}
