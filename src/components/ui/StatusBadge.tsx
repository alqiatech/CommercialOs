import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type BadgeVariant = 'success' | 'warning' | 'risk' | 'info' | 'neutral' | 'copper'
type BadgeSize = 'sm' | 'md'

interface StatusBadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'text-alqia-success bg-alqia-success/10 border border-alqia-success/20',
  warning: 'text-alqia-warning bg-alqia-warning/10 border border-alqia-warning/20',
  risk:    'text-alqia-risk bg-alqia-risk/10 border border-alqia-risk/20',
  info:    'text-alqia-info bg-alqia-info/10 border border-alqia-info/20',
  neutral: 'text-alqia-secondary bg-white/5 border border-white/10',
  copper:  'text-alqia-copper bg-alqia-copper/10 border border-alqia-copper/20',
}

const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-alqia-success',
  warning: 'bg-alqia-warning',
  risk:    'bg-alqia-risk',
  info:    'bg-alqia-info',
  neutral: 'bg-alqia-secondary',
  copper:  'bg-alqia-copper',
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-xs',
}

export function StatusBadge({
  children, variant = 'neutral', size = 'md', dot = false, className,
}: StatusBadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full font-medium font-sans', variantClasses[variant], sizeClasses[size], className)}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColors[variant])} />}
      {children}
    </span>
  )
}

// ---- ChannelBadge ----
import {
  MessageCircle, Mail, Phone, Hash, FileText, Settings,
} from 'lucide-react'

type ChannelType = 'whatsapp' | 'email' | 'phone' | 'sms' | 'note' | 'system'

const channelConfig: Record<ChannelType, { icon: typeof MessageCircle; label: string; variant: BadgeVariant }> = {
  whatsapp: { icon: MessageCircle, label: 'WhatsApp', variant: 'success' },
  email:    { icon: Mail,          label: 'Email',    variant: 'info' },
  phone:    { icon: Phone,         label: 'Llamada',  variant: 'copper' },
  sms:      { icon: Hash,          label: 'SMS',      variant: 'neutral' },
  note:     { icon: FileText,      label: 'Nota',     variant: 'neutral' },
  system:   { icon: Settings,      label: 'Sistema',  variant: 'neutral' },
}

interface ChannelBadgeProps {
  channel: ChannelType
  showLabel?: boolean
  size?: BadgeSize
  className?: string
}

export function ChannelBadge({ channel, showLabel = true, size = 'md', className }: ChannelBadgeProps) {
  const config = channelConfig[channel] ?? channelConfig.system
  const Icon = config.icon
  return (
    <StatusBadge variant={config.variant} size={size} className={className}>
      <Icon size={10} />
      {showLabel && config.label}
    </StatusBadge>
  )
}
