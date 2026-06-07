// ─────────────────────────────────────────────────────────────────────────────
// normalizePhone — limpieza determinística de teléfonos
// Prioriza México (+52). Detecta probables móviles.
// Sin IA: solo reglas duras.
// ─────────────────────────────────────────────────────────────────────────────

export interface PhoneResult {
  value: string           // teléfono limpio (sin formateo bonito)
  e164: string            // formato E.164 p.e. +5213312345678
  original: string
  valid: boolean
  country: 'MX' | 'US' | 'CA' | 'other' | 'unknown'
  line_type: 'mobile' | 'landline' | 'unknown'
  reason?: string
}

function stripNonDigits(s: string): string {
  return s.replace(/[^\d]/g, '')
}

export function normalizePhone(raw: string | undefined | null): PhoneResult {
  const original = raw ?? ''
  if (!original.trim()) {
    return { value: '', e164: '', original, valid: false, country: 'unknown', line_type: 'unknown', reason: 'vacío' }
  }

  let digits = stripNonDigits(original)

  // Quitar 00 de discado internacional
  if (digits.startsWith('00')) digits = digits.slice(2)

  // Detectar país por prefijo internacional
  let country: PhoneResult['country'] = 'unknown'
  let nationalDigits = digits

  if (digits.startsWith('52')) {
    country = 'MX'
    nationalDigits = digits.slice(2)
  } else if (digits.startsWith('1') && digits.length === 11) {
    country = digits.slice(1, 4) === '800' ? 'US' : 'US' // USA/Canada
    nationalDigits = digits.slice(1)
  } else if (digits.startsWith('1')) {
    // Puede ser +1 de US/CA sin el 1
  }

  // Si no tiene prefijo internacional y tiene 10 dígitos — asumir México
  if (country === 'unknown' && digits.length === 10) {
    country = 'MX'
    nationalDigits = digits
  }
  // Si tiene 12 dígitos y empieza en 52 ya se procesó arriba
  // Si tiene 13 dígitos con lada celular completa tipo 521xxxxxxxxxx
  if (country === 'unknown' && digits.length === 13 && digits.startsWith('521')) {
    country = 'MX'
    nationalDigits = digits.slice(2) // 11 dígitos: 1 + 10
  }

  if (country === 'MX') {
    // México celular: 10 dígitos empezando en 55, 33, 81, 664, etc.
    // O 11 dígitos si incluye el 1 de celular (legado)
    const n = nationalDigits.length === 11 && nationalDigits.startsWith('1')
      ? nationalDigits.slice(1)
      : nationalDigits

    if (n.length !== 10) {
      return { value: digits, e164: '', original, valid: false, country: 'MX', line_type: 'unknown', reason: 'longitud_invalida' }
    }

    const prefix3 = parseInt(n.slice(0, 3))
    // Ladas con alto % de celular: 55x, 33x, 81x, 664, 618, 614, 998, etc.
    const mobilePrefixes = [55, 33, 81, 664, 614, 618, 667, 998, 984, 477, 442, 222, 341, 312]
    const isMobile = mobilePrefixes.some(p => n.startsWith(String(p)))

    return {
      value: n,
      e164: `+52${n}`,
      original,
      valid: true,
      country: 'MX',
      line_type: isMobile ? 'mobile' : 'unknown',
    }
  }

  if (country === 'US' || country === 'CA') {
    if (nationalDigits.length !== 10) {
      return { value: digits, e164: '', original, valid: false, country, line_type: 'unknown', reason: 'longitud_invalida' }
    }
    return { value: nationalDigits, e164: `+1${nationalDigits}`, original, valid: true, country, line_type: 'unknown' }
  }

  // Internacional genérico: mínimo 7 dígitos, máximo 15
  if (digits.length >= 7 && digits.length <= 15) {
    return { value: digits, e164: `+${digits}`, original, valid: true, country: 'other', line_type: 'unknown' }
  }

  return { value: digits, e164: '', original, valid: false, country: 'unknown', line_type: 'unknown', reason: 'no_reconocido' }
}
