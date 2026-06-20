import { normalizeEmail } from '../utils/normalizeEmail'
import { normalizePhone } from '../utils/normalizePhone'

// ─────────────────────────────────────────────────────────────────────────────
// dataCleaner — Normalización determinística de un registro crudo
// ─────────────────────────────────────────────────────────────────────────────

export interface RawLead {
  full_name?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  whatsapp_phone?: string
  city?: string
  state?: string
  country?: string
  company?: string
  product_interest?: string
  source?: string
  campaign?: string
  created_at?: string
  owner?: string
  comments?: string
  consent_status?: string
  estimated_value?: string
  [key: string]: string | undefined
}

export interface CleanedLead {
  // Datos normalizados
  full_name: string
  first_name: string
  last_name: string
  email_raw: string
  email_clean: string
  email_valid: boolean
  email_disposable: boolean
  phone_raw: string
  phone_clean: string
  phone_e164: string
  phone_valid: boolean
  whatsapp_raw: string
  whatsapp_e164: string
  whatsapp_valid: boolean
  phone_country: string
  phone_line_type: string
  city: string
  state: string
  country: string
  company: string
  product_interest: string
  source: string
  campaign: string
  created_at: string
  owner: string
  comments: string
  estimated_value: number | null
  consent_status: 'yes' | 'no' | 'unknown'
  // Señales de calidad
  has_email: boolean
  has_phone: boolean
  has_name: boolean
  has_location: boolean
  has_source: boolean
  has_consent: boolean
}

function parseConsentStatus(raw: string | undefined): CleanedLead['consent_status'] {
  if (!raw) return 'unknown'
  const v = raw.trim().toLowerCase()
  if (['si', 'sí', 'yes', '1', 'true', 'autorizado', 'acepta', 'autoriza', 'acepto'].includes(v)) return 'yes'
  if (['no', '0', 'false', 'rechazado', 'no acepta'].includes(v)) return 'no'
  return 'unknown'
}

function splitFullName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { first: '', last: '' }
  if (parts.length === 1) return { first: parts[0], last: '' }
  if (parts.length === 2) return { first: parts[0], last: parts[1] }
  // 3+ partes: primer word = nombre, resto = apellido (convención común en México)
  return { first: parts[0], last: parts.slice(1).join(' ') }
}

function capitalize(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

export function cleanLead(raw: RawLead): CleanedLead {
  // Nombre
  let fullName = (raw.full_name ?? '').trim()
  let firstName = (raw.first_name ?? '').trim()
  let lastName = (raw.last_name ?? '').trim()

  if (!fullName && (firstName || lastName)) {
    fullName = `${firstName} ${lastName}`.trim()
  }
  if (fullName && (!firstName || !lastName)) {
    const split = splitFullName(fullName)
    firstName = firstName || split.first
    lastName = lastName || split.last
  }

  fullName = capitalize(fullName)
  firstName = capitalize(firstName)
  lastName = capitalize(lastName)

  // Email
  const emailResult = normalizeEmail(raw.email)

  // Teléfono
  const phoneResult = normalizePhone(raw.phone)
  const whatsappResult = normalizePhone(raw.whatsapp_phone ?? raw.phone)

  // Ubicación
  const city = capitalize((raw.city ?? '').trim())
  const state = capitalize((raw.state ?? '').trim())
  const country = ((raw.country ?? '').trim() || phoneResult.country || 'MX').toUpperCase()

  // Empresa
  const company = (raw.company ?? '').trim()

  // Fecha
  let createdAt = (raw.created_at ?? '').trim()
  if (!createdAt) createdAt = new Date().toISOString().split('T')[0]

  const estimatedValueRaw = (raw.estimated_value ?? '').trim()
  const estimatedValueSanitized = estimatedValueRaw.replace(/[^0-9.-]/g, '')
  const estimatedValue = estimatedValueSanitized ? Number(estimatedValueSanitized) : null

  // Consentimiento
  const consentStatus = parseConsentStatus(raw.consent_status)

  return {
    full_name: fullName,
    first_name: firstName,
    last_name: lastName,
    email_raw: emailResult.original,
    email_clean: emailResult.value,
    email_valid: emailResult.valid,
    email_disposable: emailResult.disposable ?? false,
    phone_raw: phoneResult.original,
    phone_clean: phoneResult.value,
    phone_e164: phoneResult.e164,
    phone_valid: phoneResult.valid,
    whatsapp_raw: whatsappResult.original,
    whatsapp_e164: whatsappResult.e164,
    whatsapp_valid: whatsappResult.valid,
    phone_country: phoneResult.country,
    phone_line_type: phoneResult.line_type,
    city,
    state,
    country,
    company,
    product_interest: (raw.product_interest ?? '').trim(),
    source: (raw.source ?? '').trim(),
    campaign: (raw.campaign ?? '').trim(),
    created_at: createdAt,
    owner: (raw.owner ?? '').trim(),
    comments: (raw.comments ?? '').trim(),
    estimated_value: Number.isFinite(estimatedValue) ? estimatedValue : null,
    consent_status: consentStatus,
    // Señales booleanas
    has_email: emailResult.valid,
    has_phone: phoneResult.valid,
    has_name: fullName.length > 1,
    has_location: !!(city || state || country),
    has_source: !!(raw.source?.trim()),
    has_consent: consentStatus === 'yes',
  }
}
