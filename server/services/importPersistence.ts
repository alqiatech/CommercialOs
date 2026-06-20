import { supabaseAdmin } from './supabaseAdmin'
import type { ProcessedLead, ImportMetrics } from './importProcessor'

interface CompanyRecord {
  id: string
  tenant_id: string
  name: string
  industry_template?: string | null
  industry_key?: string | null
  settings?: Record<string, unknown> | null
}

interface PipelineStageRecord {
  id: string
  name: string
  order_index: number
  probability_default: number
}

interface PersistImportInput {
  companyRef: string
  filename?: string
  industryTemplate?: string
  userId?: string
  mapping: Record<string, string>
  leads: ProcessedLead[]
  metrics: ImportMetrics
}

interface PersistedImportResult {
  batch_id: string
  tenant_id: string
  company_id: string
  contacts_created: number
  contacts_updated: number
  opportunities_created: number
  duplicate_rows: number
}

interface UserRecord {
  id: string
  full_name: string
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase()
}

function buildOpportunityTitle(lead: ProcessedLead): string {
  const name = lead.cleaned.full_name || 'Lead importado'
  const interest = lead.cleaned.product_interest || 'Oportunidad comercial'
  return `${name} — ${interest}`
}

function toContactConsent(value: ProcessedLead['cleaned']['consent_status']): 'granted' | 'denied' | 'unknown' {
  if (value === 'yes') return 'granted'
  if (value === 'no') return 'denied'
  return 'unknown'
}

function toValidationStatus(isValid: boolean): string {
  return isValid ? 'format_valid' : 'format_invalid'
}

function calculateConversionScore(lead: ProcessedLead): number {
  const base = Math.round((lead.trust.score * 0.6) + ((lead.cleaned.estimated_value ? 15 : 0)) + (lead.cleaned.has_source ? 10 : 0))
  return Math.max(0, Math.min(100, base))
}

async function resolveCompany(companyRef: string): Promise<CompanyRecord> {
  const attempts = [
    () => supabaseAdmin.from('companies').select('id, tenant_id, name, industry_template, industry_key, settings').eq('id', companyRef).maybeSingle(),
    () => supabaseAdmin.from('companies').select('id, tenant_id, name, industry_template, industry_key, settings').eq('slug', companyRef).maybeSingle(),
    () => supabaseAdmin.from('companies').select('id, tenant_id, name, industry_template, industry_key, settings').contains('settings', { demo_key: companyRef }).maybeSingle(),
  ]

  for (const load of attempts) {
    const { data, error } = await load()
    if (error) continue
    if (data) return data as CompanyRecord
  }

  throw new Error(`No se encontró la unidad comercial destino para "${companyRef}"`)
}

async function resolveDefaultPipelineStage(companyId: string) {
  const { data: pipeline, error: pipelineError } = await supabaseAdmin
    .from('pipelines')
    .select('id')
    .eq('company_id', companyId)
    .eq('is_default', true)
    .limit(1)
    .maybeSingle()

  if (pipelineError || !pipeline) {
    throw new Error('La unidad comercial no tiene pipeline por defecto configurado')
  }

  const { data: stage, error: stageError } = await supabaseAdmin
    .from('pipeline_stages')
    .select('id, name, order_index, probability_default')
    .eq('pipeline_id', pipeline.id)
    .order('order_index', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (stageError || !stage) {
    throw new Error('El pipeline por defecto no tiene etapas configuradas')
  }

  return {
    pipelineId: pipeline.id,
    stage: stage as PipelineStageRecord,
  }
}

async function loadCompanyUsers(companyId: string): Promise<UserRecord[]> {
  const { data, error } = await supabaseAdmin
    .from('user_company_access')
    .select('users!inner(id, full_name)')
    .eq('company_id', companyId)

  if (error || !data) return []

  return data
    .map(row => row.users)
    .filter(Boolean)
    .map((user) => user as unknown as UserRecord)
}

function matchOwnerId(ownerRaw: string, users: UserRecord[]): string | null {
  const normalized = normalizeText(ownerRaw)
  if (!normalized) return null

  const exact = users.find(user => normalizeText(user.full_name) === normalized)
  if (exact) return exact.id

  const partial = users.find(user => normalizeText(user.full_name).includes(normalized))
  return partial?.id ?? null
}

async function findExistingContact(companyId: string, email: string, phone: string) {
  if (email) {
    const { data } = await supabaseAdmin
      .from('contacts')
      .select('id, full_name, data_trust_score')
      .eq('company_id', companyId)
      .eq('normalized_email', email)
      .limit(1)
      .maybeSingle()
    if (data) return data
  }

  if (phone) {
    const { data } = await supabaseAdmin
      .from('contacts')
      .select('id, full_name, data_trust_score')
      .eq('company_id', companyId)
      .eq('normalized_phone', phone)
      .limit(1)
      .maybeSingle()
    if (data) return data
  }

  return null
}

async function findOrCreateAccount(tenantId: string, companyId: string, accountName: string) {
  const normalizedName = normalizeText(accountName)
  if (!normalizedName) return null

  const { data: existing } = await supabaseAdmin
    .from('accounts')
    .select('id')
    .eq('company_id', companyId)
    .eq('normalized_name', normalizedName)
    .limit(1)
    .maybeSingle()

  if (existing) return existing.id

  const { data, error } = await supabaseAdmin
    .from('accounts')
    .insert({
      tenant_id: tenantId,
      company_id: companyId,
      name: accountName,
      normalized_name: normalizedName,
      status: 'active',
      metadata: { created_from: 'import' },
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

export async function persistImportBatch(input: PersistImportInput): Promise<PersistedImportResult> {
  const company = await resolveCompany(input.companyRef)
  const { pipelineId, stage } = await resolveDefaultPipelineStage(company.id)
  const companyUsers = await loadCompanyUsers(company.id)

  const { data: batch, error: batchError } = await supabaseAdmin
    .from('import_batches')
    .insert({
      tenant_id: company.tenant_id,
      company_id: company.id,
      created_by: input.userId ?? null,
      filename: input.filename ?? `import-${new Date().toISOString()}.csv`,
      file_name: input.filename ?? `import-${new Date().toISOString()}.csv`,
      original_row_count: input.leads.length,
      total_rows: input.leads.length,
      status: 'processing',
      column_mapping: input.mapping,
      mapping: input.mapping,
      metrics: input.metrics,
      summary: {
        industry_template: input.industryTemplate ?? company.industry_template ?? company.industry_key ?? null,
        company_name: company.name,
      },
    })
    .select('id')
    .single()

  if (batchError || !batch) {
    throw new Error(batchError?.message ?? 'No se pudo crear el lote de importación')
  }

  let contactsCreated = 0
  let contactsUpdated = 0
  let opportunitiesCreated = 0
  let duplicateRows = 0

  const rawLeadRows: Array<Record<string, unknown>> = []
  const auditRows: Array<Record<string, unknown>> = []
  const analyticsRows: Array<Record<string, unknown>> = []
  const scoreRows: Array<Record<string, unknown>> = []

  for (const lead of input.leads) {
    const ownerUserId = matchOwnerId(lead.cleaned.owner, companyUsers)
    const existingContact = await findExistingContact(company.id, lead.cleaned.email_clean, lead.cleaned.phone_e164)
    const accountId = await findOrCreateAccount(company.tenant_id, company.id, lead.cleaned.company)
    const isDuplicate = lead.duplicate.is_duplicate || Boolean(existingContact)

    let contactId = existingContact?.id ?? null
    let opportunityId: string | null = null

    if (existingContact) {
      const { data: updatedContact, error: updateContactError } = await supabaseAdmin
        .from('contacts')
        .update({
          first_name: lead.cleaned.first_name || undefined,
          last_name: lead.cleaned.last_name || undefined,
          full_name: lead.cleaned.full_name || existingContact.full_name,
          email: lead.cleaned.email_clean || undefined,
          phone: lead.cleaned.phone_raw || undefined,
          normalized_phone: lead.cleaned.phone_e164 || undefined,
          whatsapp_phone: lead.cleaned.whatsapp_e164 || undefined,
          city: lead.cleaned.city || undefined,
          state: lead.cleaned.state || undefined,
          country: lead.cleaned.country || undefined,
          consent_status: toContactConsent(lead.cleaned.consent_status),
          data_trust_score: Math.max(existingContact.data_trust_score ?? 0, lead.trust.score),
          email_validation_status: toValidationStatus(lead.cleaned.email_valid),
          phone_validation_status: toValidationStatus(lead.cleaned.phone_valid),
          whatsapp_validation_status: toValidationStatus(lead.cleaned.whatsapp_valid),
          owner_user_id: ownerUserId ?? undefined,
          source: lead.cleaned.source || undefined,
          import_batch_id: batch.id,
          metadata: {
            import_campaign: lead.cleaned.campaign,
            import_comments: lead.cleaned.comments,
            last_import_batch_id: batch.id,
            updated_from_import: true,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingContact.id)
        .select('id')
        .single()

      if (updateContactError) throw updateContactError
      contactId = updatedContact.id
      contactsUpdated += 1
      duplicateRows += 1
    } else {
      const { data: createdContact, error: createContactError } = await supabaseAdmin
        .from('contacts')
        .insert({
          tenant_id: company.tenant_id,
          company_id: company.id,
          first_name: lead.cleaned.first_name,
          last_name: lead.cleaned.last_name || null,
          full_name: lead.cleaned.full_name,
          email: lead.cleaned.email_clean || null,
          phone: lead.cleaned.phone_raw || null,
          normalized_phone: lead.cleaned.phone_e164 || null,
          whatsapp_phone: lead.cleaned.whatsapp_e164 || null,
          city: lead.cleaned.city || null,
          state: lead.cleaned.state || null,
          country: lead.cleaned.country || 'MX',
          preferred_channel: lead.cleaned.whatsapp_valid ? 'whatsapp' : lead.cleaned.email_valid ? 'email' : lead.cleaned.phone_valid ? 'phone' : null,
          consent_status: toContactConsent(lead.cleaned.consent_status),
          data_trust_score: lead.trust.score,
          lead_intent_score: 0,
          urgency_score: 0,
          email_validation_status: toValidationStatus(lead.cleaned.email_valid),
          phone_validation_status: toValidationStatus(lead.cleaned.phone_valid),
          whatsapp_validation_status: toValidationStatus(lead.cleaned.whatsapp_valid),
          owner_user_id: ownerUserId,
          source: lead.cleaned.source || null,
          import_batch_id: batch.id,
          metadata: {
            import_campaign: lead.cleaned.campaign,
            import_comments: lead.cleaned.comments,
            created_from_import: true,
          },
          status: lead.trust.classification === 'do_not_contact' ? 'do_not_contact' : 'active',
        })
        .select('id')
        .single()

      if (createContactError) throw createContactError
      contactId = createdContact.id
      contactsCreated += 1
    }

    if (!isDuplicate && contactId) {
      const { data: createdOpportunity, error: createOpportunityError } = await supabaseAdmin
        .from('opportunities')
        .insert({
          tenant_id: company.tenant_id,
          company_id: company.id,
          contact_id: contactId,
          account_id: accountId,
          import_batch_id: batch.id,
          pipeline_id: pipelineId,
          stage_id: stage.id,
          owner_user_id: ownerUserId,
          title: buildOpportunityTitle(lead),
          description: lead.cleaned.comments || null,
          product_interest: lead.cleaned.product_interest || null,
          source: lead.cleaned.source || null,
          estimated_value: lead.cleaned.estimated_value,
          probability: stage.probability_default,
          data_trust_score: lead.trust.score,
          lead_intent_score: 0,
          urgency_score: 0,
          conversion_score: calculateConversionScore(lead),
          status: 'open',
          metadata: {
            import_campaign: lead.cleaned.campaign,
            import_comments: lead.cleaned.comments,
            created_from_import: true,
          },
        })
        .select('id')
        .single()

      if (createOpportunityError) throw createOpportunityError
      opportunityId = createdOpportunity.id
      opportunitiesCreated += 1
    }

    rawLeadRows.push({
      tenant_id: company.tenant_id,
      company_id: company.id,
      import_batch_id: batch.id,
      row_number: lead.index + 1,
      raw_data: lead.raw,
      raw_payload: lead.raw,
      cleaned_data: lead.cleaned,
      normalized_payload: lead.cleaned,
      processing_status: isDuplicate ? 'duplicate' : contactId ? 'created' : 'rejected',
      validation_status: lead.trust.classification,
      duplicate_status: isDuplicate ? 'duplicate_candidate' : 'unique',
      contact_id: contactId,
      opportunity_id: opportunityId,
      duplicate_of: existingContact?.id ?? null,
      duplicate_type: isDuplicate ? (lead.duplicate.type === 'none' ? 'existing_contact' : lead.duplicate.type) : null,
      trust_score: lead.trust.score,
      classification: lead.trust.classification,
      flags: lead.trust.flags,
      processed: true,
      created_at: new Date().toISOString(),
    })

    if (contactId) {
      scoreRows.push({
        tenant_id: company.tenant_id,
        company_id: company.id,
        entity_type: 'contact',
        entity_id: contactId,
        score_type: 'data_trust',
        score_value: lead.trust.score,
        score_breakdown: {
          classification: lead.trust.classification,
          flags: lead.trust.flags,
        },
        calculated_by: 'rules',
      })
    }

    if (opportunityId) {
      scoreRows.push({
        tenant_id: company.tenant_id,
        company_id: company.id,
        entity_type: 'opportunity',
        entity_id: opportunityId,
        score_type: 'conversion',
        score_value: calculateConversionScore(lead),
        score_breakdown: {
          trust_score: lead.trust.score,
          estimated_value: lead.cleaned.estimated_value,
          has_source: lead.cleaned.has_source,
        },
        calculated_by: 'rules',
      })
    }

    auditRows.push({
      tenant_id: company.tenant_id,
      company_id: company.id,
      user_id: input.userId ?? null,
      actor_type: input.userId ? 'user' : 'system',
      action: 'import.row_processed',
      entity_type: 'import_batch',
      entity_id: batch.id,
      changes: {
        row_number: lead.index + 1,
        contact_id: contactId,
        opportunity_id: opportunityId,
        duplicate: isDuplicate,
      },
      metadata: {
        classification: lead.trust.classification,
      },
    })

    analyticsRows.push({
      tenant_id: company.tenant_id,
      company_id: company.id,
      user_id: input.userId ?? null,
      event_name: 'import.row_processed',
      entity_type: 'import_batch',
      entity_id: batch.id,
      payload: {
        row_number: lead.index + 1,
        trust_score: lead.trust.score,
        classification: lead.trust.classification,
        duplicate: isDuplicate,
      },
    })
  }

  if (rawLeadRows.length) {
    const { error } = await supabaseAdmin.from('raw_leads').insert(rawLeadRows)
    if (error) throw error
  }

  if (scoreRows.length) {
    const { error } = await supabaseAdmin.from('scores').insert(scoreRows)
    if (error) throw error
  }

  if (auditRows.length) {
    const { error } = await supabaseAdmin.from('audit_logs').insert(auditRows)
    if (error) throw error
  }

  if (analyticsRows.length) {
    const { error } = await supabaseAdmin.from('analytics_events').insert(analyticsRows)
    if (error) throw error
  }

  const { error: batchUpdateError } = await supabaseAdmin
    .from('import_batches')
    .update({
      status: 'completed',
      processed_count: input.leads.length,
      processed_rows: input.leads.length,
      contacts_created: contactsCreated,
      contacts_updated: contactsUpdated,
      duplicates_found: duplicateRows,
      duplicate_rows: duplicateRows,
      invalid_count: input.metrics.invalid_email + input.metrics.invalid_phone + input.metrics.no_contact_channel,
      invalid_rows: input.metrics.invalid_email + input.metrics.invalid_phone + input.metrics.no_contact_channel,
      ready_for_cadence: input.metrics.ready_for_cadence,
      avg_trust_score: input.metrics.avg_trust_score,
      valid_rows: input.metrics.ready_for_cadence + input.metrics.needs_review,
      metrics: input.metrics,
      summary: {
        company_name: company.name,
        opportunities_created: opportunitiesCreated,
      },
      completed_at: new Date().toISOString(),
    })
    .eq('id', batch.id)

  if (batchUpdateError) throw batchUpdateError

  return {
    batch_id: batch.id,
    tenant_id: company.tenant_id,
    company_id: company.id,
    contacts_created: contactsCreated,
    contacts_updated: contactsUpdated,
    opportunities_created: opportunitiesCreated,
    duplicate_rows: duplicateRows,
  }
}
