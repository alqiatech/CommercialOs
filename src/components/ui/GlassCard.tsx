import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type GlassCardVariant = 'default' | 'elevated' | 'warning' | 'danger' | 'success' | 'interactive'

interface GlassCardProps {
  children: ReactNode
  variant?: GlassCardVariant
  className?: string
  onClick?: () => void
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

const variantClasses: Record<GlassCardVariant, string> = {
  default:     'bg-white/[0.05] border border-white/10',
  elevated:    'bg-white/[0.08] border border-white/14 shadow-glass',
  warning:     'bg-alqia-warning/5 border border-alqia-warning/20',
  danger:      'bg-alqia-risk/5 border border-alqia-risk/20',
  success:     'bg-alqia-success/5 border border-alqia-success/20',
  interactive: 'bg-white/[0.05] border border-white/10 hover:bg-white/[0.08] hover:border-white/16 cursor-pointer transition-all duration-200 hover:shadow-glass',
}

const paddingClasses = {
  none: '',
  sm:   'p-3',
  md:   'p-5',
  lg:   'p-6',
}

export function GlassCard({
  children, variant = 'default', className, onClick, padding = 'md',
}: GlassCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl2 backdrop-blur-sm',
        variantClasses[variant],
        paddingClasses[padding],
        className,
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  )
}
