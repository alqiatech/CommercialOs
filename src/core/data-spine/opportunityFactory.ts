// ─────────────────────────────────────────────────────────────────────────────
// opportunityFactory.ts — Alqia Commercial OS / Data Spine
// Criterios para decidir si crear oportunidad y cómo construirla.
// ─────────────────────────────────────────────────────────────────────────────

import type { Contact, Opportunity } from '@/types'
import type { DataTrustResult } from './dataTrustEngine'

export interface OpportunityFactoryOptions {
  tenantId: string
  companyId: string
  pipelineId: string
  defaultStageId: string
  ownerUserId?: string
}

let oppCounter = 0
function generateOppId(): string {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 6)
  oppCounter++
  return `opp_${ts}_${rand}_${oppCounter}`
}

/**
 * Determina si un contacto importado debe generar una oportunidad automáticamente.
 * Criterios:
 * - Trust score >= 45 (datos suficientes para trabajar)
 * - Al menos un canal de contacto válido
 * - No está marcado como duplicado candidato
 */
export function shouldCreateOpportunity(
  contact: Contact,
  trust: DataTrustResult,
): boolean {
  const hasChannel = !!(contact.email || contact.phone)
  const isTrustworthy = trust.score >= 45
  const isNotDuplicate = trust.status !== 'duplicate_candidate'
  const isNotBlacklisted = trust.status !== 'blacklisted'
  return hasChannel && isTrustworthy && isNotDuplicate && isNotBlacklisted
}

/**
 * Crea una oportunidad en etapa inicial desde un contacto importado.
 * El pipeline y stage se pasan en options; el título se genera desde el contacto.
 */
export function createOpportunityFromContact(
  contact: Contact,
  trust: DataTrustResult,
  opts: OpportunityFactoryOptions,
): Opportunity {
  const now = new Date().toISOString()
  const contactName = contact.full_name || contact.first_name || 'Lead importado'
  const metaCompany = contact.metadata?.['company_name'] as string | undefined
  const companyPart = metaCompany ? ` — ${metaCompany}` : ''

  // Intent score inicial basado en trust + fuente
  const intentBase = Math.round(trust.score * 0.7)
  const urgencyBase = contact.tags?.includes('high_trust') ? 55 : 30

  const opp: Opportunity = {
    id: generateOppId(),
    tenant_id: opts.tenantId,
    company_id: opts.companyId,
    pipeline_id: opts.pipelineId,
    stage_id: opts.defaultStageId,
    contact_id: contact.id,
    owner_user_id: opts.ownerUserId ?? 'unassigned',

    title: `${contactName}${companyPart}`,
    product_interest: undefined,
    estimated_value: undefined,
    currency: 'MXN' as string,

    probability: 5,   // etapa intake
    lead_intent_score: intentBase,
    data_trust_score: trust.score,
    urgency_score: urgencyBase,

    status: 'open',

    last_contact_at: undefined,
    next_action_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // +1 día

    ai_summary: `Lead importado. Trust score: ${trust.score}. Canal primario: ${contact.preferred_channel}. Fuente: ${(contact.metadata?.['lead_source'] as string) ?? 'unknown'}.${
      trust.flags.length > 0 ? ` Flags: ${trust.flags.slice(0, 3).join(', ')}.` : ''
    }`,

    created_at: now,
    updated_at: now,
  }

  return opp
}
