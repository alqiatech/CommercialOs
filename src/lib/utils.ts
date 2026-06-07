import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Combina clases Tailwind sin conflictos */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formatea número como moneda MXN */
export function formatCurrency(value: number, currency = 'MXN'): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(value)
}

/** Formatea fecha relativa */
export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (diffMinutes < 1) return 'Ahora mismo'
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`
  if (diffHours < 24) return `Hace ${diffHours}h`
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} sem`
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

/** Formatea fecha larga */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

/** Devuelve las iniciales de un nombre */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/** Color del ScoreRing según valor 0-100 */
export function getScoreColor(score: number): string {
  if (score <= 30) return '#FB7185'   // riesgo
  if (score <= 60) return '#FACC15'  // alerta
  if (score <= 80) return '#38BDF8'  // info
  return '#4ADE80'                    // éxito
}

/** Etiqueta del score de intención */
export function getIntentLabel(score: number): string {
  if (score <= 20) return 'Frío'
  if (score <= 45) return 'Bajo'
  if (score <= 65) return 'Tibio'
  if (score <= 80) return 'Caliente'
  return 'Prioritario'
}

/** Color del badge de severidad */
export function getSeverityColor(severity: string): string {
  const map: Record<string, string> = {
    critical: 'text-alqia-risk bg-alqia-risk/10 border border-alqia-risk/20',
    high:     'text-orange-400 bg-orange-400/10 border border-orange-400/20',
    medium:   'text-alqia-warning bg-alqia-warning/10 border border-alqia-warning/20',
    low:      'text-alqia-info bg-alqia-info/10 border border-alqia-info/20',
    info:     'text-alqia-secondary bg-white/5 border border-white/10',
  }
  return map[severity] ?? map.info
}

/** Registra evento en consola (mock de audit) */
export function logEvent(eventName: string, payload?: Record<string, unknown>) {
  if (import.meta.env.DEV) {
    console.log(
      `%c[ALQIA EVENT] ${eventName}`,
      'color: #F98058; font-weight: bold;',
      payload ?? '',
    )
  }
}
