// ─────────────────────────────────────────────────────────────────────────────
// contactFactory.ts — Alqia Commercial OS / Data Spine
// Crea un objeto Contact tipado desde un lead normalizado.
// ─────────────────────────────────────────────────────────────────────────────

import type { Contact } from '@/types'
import type { NormalizedLeadFields } from './leadNormalizer'
import type { DataTrustResult } from './dataTrustEngine'
import type { ImportRow } from './importPipeline'

export interface ContactFactoryOptions {
  tenantId: string
  companyId: string
  city?: string
  state?: string
  sourceRow?: ImportRow
  ownerUserId?: string
  tags?: string[]
}

let contactCounter = 0
function generateContactId(): string {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 6)
  contactCounter++
  return `cnt_${ts}_${rand}_${contactCounter}`
}

export function createContactFromLead(
  normalized: NormalizedLeadFields,
  trust: DataTrustResult,
  opts: ContactFactoryOptions,
): Contact {
  const now = new Date().toISOString()
  const { email, phone, name, company, source } = normalized

  const tags: string[] = [...(opts.tags ?? [])]
  if (source !== 'unknown') tags.push(`source_${source}`)
  if (phone.isLikelyWhatsApp) tags.push('whatsapp_probable')
  if (company.isLikelyB2B) tags.push('b2b')
  if (trust.score >= 75) tags.push('high_trust')

  const contact: Contact = {
    id: generateContactId(),
    tenant_id: opts.tenantId,
    company_id: opts.companyId,

    first_name: name.firstName || 'Sin Nombre',
    last_name: name.lastName || '',
    full_name: name.fullName || 'Sin Nombre',
    normalized_name: name.normalized,

    email: email.isValid ? email.normalized : undefined,
    normalized_email: email.isValid ? email.normalized : undefined,

    phone: phone.isValid ? phone.normalized : undefined,
    normalized_phone: phone.isValid ? phone.normalized : undefined,
    whatsapp_phone: phone.isLikelyWhatsApp && phone.isValid ? phone.normalized : undefined,

    city: opts.city || undefined,
    state: opts.state || undefined,
    country: phone.isMexican ? 'México' : undefined,

    preferred_channel: phone.isLikelyWhatsApp ? 'whatsapp' : email.isValid ? 'email' : 'phone',
    consent_status: 'unknown',

    data_trust_score: trust.score,
    identity_verification_status: 'unverified' as const,

    tags,
    metadata: {
      import_source: 'csv_import',
      trust_flags: trust.flags,
      trust_status: trust.status,
      lead_source: source,
      company_name: company.isGeneric ? undefined : company.normalized,
      raw_data: opts.sourceRow ?? {},
    },

    status: 'active',
    created_at: now,
    updated_at: now,
  }

  return contact
}
