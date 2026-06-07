// ─────────────────────────────────────────────────────────────────────────────
// leadNormalizer.ts — Alqia Commercial OS / Data Spine
// Normaliza campos de leads crudos antes de procesarlos.
// No hace fetch, no llama a APIs — pura transformación local de strings.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Email ───────────────────────────────────────────────────────────────────

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwaway.email',
  'sharklasers.com', 'guerrillamailblock.com', 'grr.la', 'spam4.me',
  'dispostable.com', 'yopmail.com', 'trashmail.com', '10minutemail.com',
])

export interface NormalizedEmail {
  raw: string
  normalized: string
  isValid: boolean
  isDisposable: boolean
  domain: string
  localPart: string
}

export function normalizeEmail(raw: string): NormalizedEmail {
  const trimmed = (raw ?? '').trim().toLowerCase()
  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/
  const isValid = emailRegex.test(trimmed)
  const parts = trimmed.split('@')
  const domain = parts[1] ?? ''
  const localPart = parts[0] ?? ''
  const isDisposable = DISPOSABLE_DOMAINS.has(domain)

  return {
    raw,
    normalized: trimmed,
    isValid: isValid && !isDisposable,
    isDisposable,
    domain,
    localPart,
  }
}

// ─── Phone ────────────────────────────────────────────────────────────────────

export interface NormalizedPhone {
  raw: string
  normalized: string        // formato E.164
  isValid: boolean
  isMexican: boolean
  isLikelyWhatsApp: boolean  // móvil → alta probabilidad
  countryCode: string
  localNumber: string
}

export function normalizePhone(raw: string, defaultCountry = 'MX'): NormalizedPhone {
  const digits = (raw ?? '').replace(/\D/g, '')
  let normalized = ''
  let countryCode = ''
  let localNumber = ''
  let isMexican = false

  if (digits.startsWith('521') && digits.length === 13) {
    // México celular: 521 + 10 dígitos
    normalized = `+${digits}`
    countryCode = '52'
    localNumber = digits.slice(3)
    isMexican = true
  } else if (digits.startsWith('52') && digits.length === 12) {
    // México fijo: 52 + 10 dígitos
    normalized = `+${digits}`
    countryCode = '52'
    localNumber = digits.slice(2)
    isMexican = true
  } else if (digits.startsWith('1') && digits.length === 11) {
    // USA/Canadá: 1 + 10 dígitos
    normalized = `+${digits}`
    countryCode = '1'
    localNumber = digits.slice(1)
  } else if (defaultCountry === 'MX' && digits.length === 10) {
    // Sin código de país, asumir México
    normalized = `+52${digits}`
    countryCode = '52'
    localNumber = digits
    isMexican = true
  } else {
    normalized = digits.length >= 7 ? `+${digits}` : ''
    countryCode = ''
    localNumber = digits
  }

  const isValid = normalized.length >= 10
  // Móvil mexicano (prefijo 521) o números de 10 dígitos iniciando en 33, 55, etc.
  const isLikelyWhatsApp = isValid && (
    digits.startsWith('521') ||
    (isMexican && !digits.startsWith('5233') && !digits.startsWith('5255') && localNumber.length === 10)
    || countryCode === '1'
  )

  return {
    raw,
    normalized,
    isValid,
    isMexican,
    isLikelyWhatsApp,
    countryCode,
    localNumber,
  }
}

// ─── Name ─────────────────────────────────────────────────────────────────────

export interface NormalizedName {
  raw: string
  firstName: string
  lastName: string
  fullName: string
  normalized: string  // lowercase para comparación
  wordCount: number
  isLikelyReal: boolean
}

const SINGLE_CHAR_NAMES = new Set(['n/a', 'na', '-', 'x', 'sin nombre', 'test', 'prueba', 'asdf'])

export function normalizeName(raw: string): NormalizedName {
  const trimmed = (raw ?? '').trim()
  const cleaned = trimmed
    .replace(/\s+/g, ' ')
    .replace(/[^a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s'-]/g, '')
    .trim()

  const capitalize = (s: string) =>
    s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')

  const parts = cleaned.split(' ').filter(Boolean)
  const wordCount = parts.length
  const firstName = wordCount > 0 ? capitalize(parts[0]) : ''
  const lastName = wordCount > 1 ? capitalize(parts.slice(1).join(' ')) : ''
  const fullName = capitalize(cleaned)

  const isLikelyReal = (
    wordCount >= 1 &&
    cleaned.length >= 3 &&
    !SINGLE_CHAR_NAMES.has(cleaned.toLowerCase())
  )

  return {
    raw,
    firstName,
    lastName,
    fullName,
    normalized: cleaned.toLowerCase(),
    wordCount,
    isLikelyReal,
  }
}

// ─── Company ──────────────────────────────────────────────────────────────────

export interface NormalizedCompany {
  raw: string
  normalized: string
  isLikelyB2B: boolean
  isGeneric: boolean
  slug: string
}

const B2B_KEYWORDS = [
  'sa de cv', 'srl', 's.a.', 's.r.l.', 'inc', 'corp', 'ltd', 'gmbh',
  'group', 'grupo', 'industrial', 'logística', 'servicios', 'soluciones',
  'constructora', 'distribuidora', 'importadora', 'exportadora', 'tecnología',
]

const GENERIC_COMPANY_VALUES = new Set([
  'empresa', 'company', 'negocio', 'mi empresa', 'n/a', 'na', '-', 'ninguno',
])

export function normalizeCompany(raw: string): NormalizedCompany {
  const trimmed = (raw ?? '').trim()
  const normalized = trimmed.replace(/\s+/g, ' ').trim()
  const lower = normalized.toLowerCase()

  const isGeneric = GENERIC_COMPANY_VALUES.has(lower) || normalized.length < 3
  const isLikelyB2B = B2B_KEYWORDS.some(kw => lower.includes(kw))

  const slug = lower
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)

  return {
    raw,
    normalized: trimmed,
    isLikelyB2B,
    isGeneric,
    slug,
  }
}

// ─── Source ───────────────────────────────────────────────────────────────────

export type LeadSource =
  | 'facebook_ads' | 'google_ads' | 'instagram_ads'
  | 'whatsapp_inbound' | 'web_form' | 'referral'
  | 'cold_email' | 'event' | 'organic' | 'unknown'

const SOURCE_KEYWORDS: [string[], LeadSource][] = [
  [['facebook', 'fb', 'meta'], 'facebook_ads'],
  [['google', 'gads'], 'google_ads'],
  [['instagram', 'ig'], 'instagram_ads'],
  [['whatsapp', 'wa'], 'whatsapp_inbound'],
  [['web', 'form', 'landing', 'sitio'], 'web_form'],
  [['referido', 'referral', 'recomendacion'], 'referral'],
  [['email', 'correo', 'cold'], 'cold_email'],
  [['evento', 'expo', 'feria'], 'event'],
  [['organico', 'seo'], 'organic'],
]

export function normalizeSource(raw: string): LeadSource {
  const lower = (raw ?? '').toLowerCase()
  for (const [keywords, source] of SOURCE_KEYWORDS) {
    if (keywords.some(kw => lower.includes(kw))) return source
  }
  return 'unknown'
}

// ─── Batch ────────────────────────────────────────────────────────────────────

export interface RawLeadInput {
  email?: string
  phone?: string
  name?: string
  firstName?: string
  lastName?: string
  company?: string
  source?: string
  [key: string]: unknown
}

export interface NormalizedLeadFields {
  email: NormalizedEmail
  phone: NormalizedPhone
  name: NormalizedName
  company: NormalizedCompany
  source: LeadSource
}

export function normalizeLead(input: RawLeadInput): NormalizedLeadFields {
  const rawName = input.name ?? [input.firstName, input.lastName].filter(Boolean).join(' ')
  return {
    email: normalizeEmail(input.email ?? ''),
    phone: normalizePhone(input.phone ?? ''),
    name: normalizeName(rawName),
    company: normalizeCompany(input.company ?? ''),
    source: normalizeSource(input.source ?? ''),
  }
}
