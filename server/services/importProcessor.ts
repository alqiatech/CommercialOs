import { cleanLead } from './dataCleaner'
import { detectDuplicates } from './dedupeEngine'
import { calculateTrustScore } from './dataTrustEngine'
import type { RawLead, CleanedLead } from './dataCleaner'
import type { TrustScoreResult } from './dataTrustEngine'
import type { DuplicateResult } from './dedupeEngine'
import type { DestinationField } from '../schemas/import.schemas'

// ─────────────────────────────────────────────────────────────────────────────
// importProcessor — Orquesta el pipeline completo de importación
// 1. Mapear columnas a campos destino
// 2. Limpiar registros (determinístico)
// 3. Detectar duplicados
// 4. Calcular Data Trust Score
// 5. Generar resultados con métricas
// ─────────────────────────────────────────────────────────────────────────────

export interface ProcessedLead {
  index: number
  raw: Record<string, string>
  cleaned: CleanedLead
  trust: TrustScoreResult
  duplicate: DuplicateResult
}

export interface ImportResult {
  leads: ProcessedLead[]
  metrics: ImportMetrics
  processed_at: string
}

export interface ImportMetrics {
  total: number
  ready_for_cadence: number
  needs_review: number
  duplicates: number
  invalid_email: number
  invalid_phone: number
  no_contact_channel: number
  do_not_contact: number
  avg_trust_score: number
  whatsapp_contactable: number
  email_contactable: number
}

function applyMapping(row: Record<string, string>, mapping: Record<string, DestinationField>): RawLead {
  const lead: RawLead = {}
  for (const [col, dest] of Object.entries(mapping)) {
    if (dest === 'skip') continue
    const val = row[col]
    if (val !== undefined) {
      lead[dest] = val
    }
  }
  return lead
}

export function processImport(
  rows: Record<string, string>[],
  mapping: Record<string, DestinationField>,
): ImportResult {
  // Paso 1: Mapear + limpiar
  const rawLeads = rows.map(row => applyMapping(row, mapping))
  const cleanedLeads: CleanedLead[] = rawLeads.map(r => cleanLead(r))

  // Paso 2: Detectar duplicados
  const duplicates: DuplicateResult[] = detectDuplicates(cleanedLeads)

  // Paso 3: Calcular trust scores
  const processedLeads: ProcessedLead[] = cleanedLeads.map((cleaned, i) => ({
    index: i,
    raw: rows[i],
    cleaned,
    trust: calculateTrustScore(cleaned, duplicates[i].is_duplicate),
    duplicate: duplicates[i],
  }))

  // Paso 4: Métricas
  const metrics = calculateMetrics(processedLeads)

  return {
    leads: processedLeads,
    metrics,
    processed_at: new Date().toISOString(),
  }
}

function calculateMetrics(leads: ProcessedLead[]): ImportMetrics {
  const counts = {
    ready_for_cadence: 0,
    needs_review: 0,
    duplicates: 0,
    invalid_email: 0,
    invalid_phone: 0,
    no_contact_channel: 0,
    do_not_contact: 0,
  }

  let totalScore = 0
  let whatsapp = 0
  let email = 0

  for (const lead of leads) {
    const c = lead.trust.classification
    if (c === 'ready_for_cadence') counts.ready_for_cadence++
    else if (c === 'needs_review') counts.needs_review++
    else if (c === 'duplicate_candidate') counts.duplicates++
    else if (c === 'invalid_email') counts.invalid_email++
    else if (c === 'invalid_phone') counts.invalid_phone++
    else if (c === 'no_contact_channel') counts.no_contact_channel++
    else if (c === 'do_not_contact') counts.do_not_contact++

    totalScore += lead.trust.score
    if (lead.trust.whatsapp_probable) whatsapp++
    if (lead.cleaned.email_valid) email++
  }

  return {
    total: leads.length,
    ...counts,
    avg_trust_score: leads.length ? Math.round(totalScore / leads.length) : 0,
    whatsapp_contactable: whatsapp,
    email_contactable: email,
  }
}
