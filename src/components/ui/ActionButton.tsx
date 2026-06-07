import { cn } from '@/lib/utils'
import type { ReactNode, ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

type ActionButtonVariant = 'copper' | 'ghost' | 'danger' | 'success' | 'outline'
type ActionButtonSize = 'sm' | 'md' | 'lg'

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ActionButtonVariant
  size?: ActionButtonSize
  loading?: boolean
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  children?: ReactNode
}

const variantClasses: Record<ActionButtonVariant, string> = {
  copper:  'bg-alqia-copper text-white hover:bg-alqia-copper-hover hover:shadow-copper-glow',
  ghost:   'bg-white/[0.06] text-alqia-secondary border border-white/10 hover:bg-white/[0.10] hover:text-white',
  danger:  'bg-alqia-risk/10 text-alqia-risk border border-alqia-risk/20 hover:bg-alqia-risk/20',
  success: 'bg-alqia-success/10 text-alqia-success border border-alqia-success/20 hover:bg-alqia-success/20',
  outline: 'bg-transparent text-white border border-white/20 hover:bg-white/[0.06]',
}

const sizeClasses: Record<ActionButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
}

export function ActionButton({
  variant = 'copper', size = 'md', loading = false,
  icon, iconPosition = 'left', children, className, disabled, ...props
}: ActionButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-sans font-medium rounded-xl',
        'transition-all duration-200 active:scale-95 select-none',
        'disabled:opacity-50 disabled:pointer-events-none',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        iconPosition === 'left' && icon && <span className="flex-shrink-0">{icon}</span>
      )}
      {children && <span>{children}</span>}
      {!loading && iconPosition === 'right' && icon && <span className="flex-shrink-0">{icon}</span>}
    </button>
  )
}
