// ─────────────────────────────────────────────────────────────────────────────
// normalizeEmail — limpieza determinística de correos
// Sin IA: solo reglas duras
// ─────────────────────────────────────────────────────────────────────────────

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwam.com',
  'maildrop.cc', 'yopmail.com', 'sharklasers.com', 'guerrillamailblock.com',
  'grr.la', 'spam4.me', '10minutemail.com', 'trashmail.com', 'fakeinbox.com',
])

export interface EmailResult {
  value: string
  original: string
  valid: boolean
  reason?: string
  disposable?: boolean
}

export function normalizeEmail(raw: string | undefined | null): EmailResult {
  const original = raw ?? ''
  if (!original.trim()) {
    return { value: '', original, valid: false, reason: 'vacío' }
  }

  const cleaned = original.trim().toLowerCase().replace(/\s+/g, '')

  // Formato básico: contiene @ y al menos un punto después del @
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  if (!emailRegex.test(cleaned)) {
    return { value: cleaned, original, valid: false, reason: 'formato_invalido' }
  }

  const domain = cleaned.split('@')[1]
  const isDisposable = DISPOSABLE_DOMAINS.has(domain)

  return {
    value: cleaned,
    original,
    valid: true,
    disposable: isDisposable,
    reason: isDisposable ? 'dominio_temporal' : undefined,
  }
}
