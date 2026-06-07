import type { CleanedLead } from './dataCleaner'

// ─────────────────────────────────────────────────────────────────────────────
// dataTrustEngine — Calcula Data Trust Score 0-100 y clasifica cada registro
// Sin IA: solo reglas determinísticas
// ─────────────────────────────────────────────────────────────────────────────

export type LeadClassification =
  | 'ready_for_cadence'     // todo en orden, listo para contactar
  | 'needs_review'          // datos incompletos pero contactable
  | 'duplicate_candidate'   // posible duplicado detectado
  | 'invalid_email'         // email con formato inválido
  | 'invalid_phone'         // teléfono inválido
  | 'no_contact_channel'    // ni email ni teléfono válidos
  | 'do_not_contact'        // consentimiento negado explícitamente

export interface TrustScoreResult {
  score: number             // 0-100
  classification: LeadClassification
  flags: string[]           // razones del score bajo
  contactable: boolean
  whatsapp_probable: boolean
}

// Pesos por señal (suman 100)
const WEIGHTS = {
  email_valid: 20,
  phone_valid: 25,
  has_name: 15,
  has_location: 10,
  has_source: 10,
  has_consent: 10,
  not_disposable: 5,
  is_mobile: 5,
}

export function calculateTrustScore(lead: CleanedLead, isDuplicate = false): TrustScoreResult {
  const flags: string[] = []
  let score = 0

  if (lead.email_valid) {
    score += WEIGHTS.email_valid
    if (lead.email_disposable) {
      score -= 5
      flags.push('email_temporal')
    } else {
      score += WEIGHTS.not_disposable
    }
  } else {
    flags.push('email_invalido')
  }

  if (lead.phone_valid) {
    score += WEIGHTS.phone_valid
    if (lead.phone_line_type === 'mobile') {
      score += WEIGHTS.is_mobile
    }
  } else {
    flags.push('telefono_invalido')
  }

  if (lead.has_name) score += WEIGHTS.has_name
  else flags.push('sin_nombre')

  if (lead.has_location) score += WEIGHTS.has_location
  else flags.push('sin_ubicacion')

  if (lead.has_source) score += WEIGHTS.has_source
  else flags.push('sin_fuente')

  if (lead.has_consent) score += WEIGHTS.has_consent
  else if (lead.consent_status === 'no') flags.push('consentimiento_negado')
  else flags.push('sin_consentimiento')

  // Penalización por duplicado
  if (isDuplicate) {
    score = Math.max(score - 20, 0)
    flags.push('posible_duplicado')
  }

  score = Math.min(100, Math.max(0, score))

  // Clasificación
  let classification: LeadClassification

  if (lead.consent_status === 'no') {
    classification = 'do_not_contact'
  } else if (!lead.has_email && !lead.phone_valid) {
    classification = 'no_contact_channel'
  } else if (!lead.email_valid && lead.email_raw.trim()) {
    classification = 'invalid_email'
  } else if (!lead.phone_valid && lead.phone_raw.trim()) {
    classification = 'invalid_phone'
  } else if (isDuplicate) {
    classification = 'duplicate_candidate'
  } else if (score >= 65) {
    classification = 'ready_for_cadence'
  } else {
    classification = 'needs_review'
  }

  const contactable = !['do_not_contact', 'no_contact_channel'].includes(classification)
  const whatsappProbable = lead.phone_valid && lead.phone_country === 'MX'

  return { score, classification, flags, contactable, whatsapp_probable: whatsappProbable }
}
