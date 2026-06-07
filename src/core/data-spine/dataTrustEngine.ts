// ─────────────────────────────────────────────────────────────────────────────
// dataTrustEngine.ts — Alqia Commercial OS / Data Spine
// Calcula score de confianza 0-100 sobre un lead normalizado.
// Determina el estado operativo del registro para guiar acciones.
// ─────────────────────────────────────────────────────────────────────────────

import type { NormalizedLeadFields } from './leadNormalizer'

// ─── Estados operativos ───────────────────────────────────────────────────────

export type DataTrustStatus =
  | 'ready_for_cadence'        // score >= 75, todos los canales primarios ok
  | 'ready_for_contact'        // score >= 55, al menos un canal válido
  | 'needs_enrichment'         // score 35-54, datos parciales
  | 'duplicate_candidate'      // detectado como posible duplicado
  | 'invalid_contact_data'     // email y teléfono inválidos
  | 'disposable_email'         // email desechable
  | 'incomplete_name'          // nombre faltante o genérico
  | 'low_trust'                // score < 35
  | 'blacklisted'              // en lista negra (no contactar)
  | 'consent_missing'          // sin consentimiento explícito
  | 'enriched'                 // enriquecido con datos adicionales

// ─── Breakdown de puntuación ─────────────────────────────────────────────────

export interface TrustScoreBreakdown {
  emailScore: number        // 0-15
  phoneScore: number        // 0-25
  whatsappScore: number     // 0-15
  nameScore: number         // 0-10
  locationScore: number     // 0-10
  sourceScore: number       // 0-10
  consentScore: number      // 0-10
  dedupeScore: number       // 0-5 (penalización si es duplicado)
  total: number             // suma de todos
}

export interface DataTrustResult {
  score: number                    // 0-100
  status: DataTrustStatus
  breakdown: TrustScoreBreakdown
  flags: string[]                  // lista de problemas detectados
  recommendations: string[]        // acciones recomendadas
}

// ─── Opciones adicionales de contexto ────────────────────────────────────────

export interface TrustEngineOptions {
  hasExplicitConsent?: boolean
  locationCity?: string
  locationState?: string
  locationCountry?: string
  isDuplicateCandidate?: boolean
  isEnriched?: boolean
}

// ─── Motor principal ─────────────────────────────────────────────────────────

export function calculateDataTrust(
  fields: NormalizedLeadFields,
  options: TrustEngineOptions = {},
): DataTrustResult {
  const flags: string[] = []
  const recommendations: string[] = []
  const breakdown: TrustScoreBreakdown = {
    emailScore: 0,
    phoneScore: 0,
    whatsappScore: 0,
    nameScore: 0,
    locationScore: 0,
    sourceScore: 0,
    consentScore: 0,
    dedupeScore: 0,
    total: 0,
  }

  // ── Email: hasta 15 puntos ──────────────────────────────────────────────────
  if (fields.email.isValid && !fields.email.isDisposable) {
    breakdown.emailScore = 15
  } else if (fields.email.isDisposable) {
    breakdown.emailScore = 0
    flags.push('EMAIL_DESECHABLE')
    recommendations.push('Solicitar email corporativo o personal válido')
  } else if (fields.email.raw && !fields.email.isValid) {
    breakdown.emailScore = 0
    flags.push('EMAIL_INVALIDO')
    recommendations.push('Validar formato de email')
  } else {
    breakdown.emailScore = 0
    flags.push('EMAIL_FALTANTE')
    recommendations.push('Obtener email para canal de seguimiento')
  }

  // ── Teléfono: hasta 25 puntos ───────────────────────────────────────────────
  if (fields.phone.isValid) {
    breakdown.phoneScore = 25
  } else if (fields.phone.raw && !fields.phone.isValid) {
    breakdown.phoneScore = 5
    flags.push('TELEFONO_INVALIDO')
    recommendations.push('Verificar número de teléfono — formato incorrecto')
  } else {
    breakdown.phoneScore = 0
    flags.push('TELEFONO_FALTANTE')
    recommendations.push('Obtener número de teléfono o WhatsApp')
  }

  // ── WhatsApp probable: hasta 15 puntos ──────────────────────────────────────
  if (fields.phone.isValid && fields.phone.isLikelyWhatsApp) {
    breakdown.whatsappScore = 15
  } else if (fields.phone.isValid) {
    breakdown.whatsappScore = 5
    flags.push('WHATSAPP_NO_CONFIRMADO')
    recommendations.push('Verificar si el número tiene WhatsApp activo')
  }

  // ── Nombre: hasta 10 puntos ─────────────────────────────────────────────────
  if (fields.name.isLikelyReal && fields.name.wordCount >= 2) {
    breakdown.nameScore = 10
  } else if (fields.name.isLikelyReal) {
    breakdown.nameScore = 5
    flags.push('NOMBRE_PARCIAL')
    recommendations.push('Obtener nombre completo (nombre y apellido)')
  } else {
    breakdown.nameScore = 0
    flags.push('NOMBRE_INVALIDO')
    recommendations.push('Nombre genérico o faltante — validar contacto')
  }

  // ── Ubicación: hasta 10 puntos ──────────────────────────────────────────────
  if (options.locationCity || options.locationState) {
    breakdown.locationScore = options.locationCity && options.locationState ? 10 : 5
  } else {
    flags.push('UBICACION_FALTANTE')
    recommendations.push('Obtener ciudad/estado para segmentación')
  }

  // ── Fuente: hasta 10 puntos ─────────────────────────────────────────────────
  if (fields.source !== 'unknown') {
    breakdown.sourceScore = 10
  } else {
    breakdown.sourceScore = 3
    flags.push('FUENTE_DESCONOCIDA')
  }

  // ── Consentimiento: hasta 10 puntos ─────────────────────────────────────────
  if (options.hasExplicitConsent) {
    breakdown.consentScore = 10
  } else {
    breakdown.consentScore = 0
    flags.push('CONSENTIMIENTO_FALTANTE')
    recommendations.push('Solicitar consentimiento explícito de contacto')
  }

  // ── Penalización por duplicado: hasta -5 ────────────────────────────────────
  if (options.isDuplicateCandidate) {
    breakdown.dedupeScore = -5
    flags.push('DUPLICADO_PROBABLE')
    recommendations.push('Verificar si ya existe este contacto en el sistema')
  }

  // ── Total ────────────────────────────────────────────────────────────────────
  breakdown.total = Math.max(0, Math.min(100,
    breakdown.emailScore +
    breakdown.phoneScore +
    breakdown.whatsappScore +
    breakdown.nameScore +
    breakdown.locationScore +
    breakdown.sourceScore +
    breakdown.consentScore +
    breakdown.dedupeScore
  ))

  const score = breakdown.total

  // ── Determinar estado ────────────────────────────────────────────────────────
  let status: DataTrustStatus

  if (options.isDuplicateCandidate) {
    status = 'duplicate_candidate'
  } else if (fields.email.isDisposable) {
    status = 'disposable_email'
  } else if (!fields.email.isValid && !fields.phone.isValid) {
    status = 'invalid_contact_data'
  } else if (!fields.name.isLikelyReal) {
    status = 'incomplete_name'
  } else if (!options.hasExplicitConsent) {
    status = 'consent_missing'
  } else if (score >= 75) {
    status = options.isEnriched ? 'enriched' : 'ready_for_cadence'
  } else if (score >= 55) {
    status = 'ready_for_contact'
  } else if (score >= 35) {
    status = 'needs_enrichment'
  } else {
    status = 'low_trust'
  }

  return { score, status, breakdown, flags, recommendations }
}

// ─── Helpers de UI ────────────────────────────────────────────────────────────

export const DATA_TRUST_LABELS: Record<DataTrustStatus, string> = {
  ready_for_cadence: 'Listo para cadencia',
  ready_for_contact: 'Listo para contactar',
  needs_enrichment: 'Requiere enriquecimiento',
  duplicate_candidate: 'Posible duplicado',
  invalid_contact_data: 'Datos de contacto inválidos',
  disposable_email: 'Email desechable',
  incomplete_name: 'Nombre incompleto',
  low_trust: 'Confianza baja',
  blacklisted: 'En lista negra',
  consent_missing: 'Sin consentimiento',
  enriched: 'Enriquecido',
}

export const DATA_TRUST_COLORS: Record<DataTrustStatus, string> = {
  ready_for_cadence: 'text-alqia-success',
  ready_for_contact: 'text-alqia-info',
  needs_enrichment: 'text-alqia-warning',
  duplicate_candidate: 'text-alqia-warning',
  invalid_contact_data: 'text-alqia-risk',
  disposable_email: 'text-alqia-risk',
  incomplete_name: 'text-alqia-muted',
  low_trust: 'text-alqia-risk',
  blacklisted: 'text-alqia-risk',
  consent_missing: 'text-alqia-warning',
  enriched: 'text-alqia-success',
}

export function trustScoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 85) return 'A'
  if (score >= 70) return 'B'
  if (score >= 55) return 'C'
  if (score >= 35) return 'D'
  return 'F'
}
