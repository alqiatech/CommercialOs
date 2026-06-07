// ─────────────────────────────────────────────────────────────────────────────
// importPipeline.ts — Alqia Commercial OS / Data Spine
// Orquesta el flujo completo: CSV/XLSX raw → contactos + oportunidades en store
// Fases: parse → normalize → trust → dedupe → create contacts → create opps
// ─────────────────────────────────────────────────────────────────────────────

import { normalizeLead, type RawLeadInput } from './leadNormalizer'
import { calculateDataTrust, type TrustEngineOptions } from './dataTrustEngine'
import { checkForDuplicate } from './dedupeEngine'
import { createContactFromLead } from './contactFactory'
import { shouldCreateOpportunity, createOpportunityFromContact } from './opportunityFactory'
import type { Contact, Opportunity } from '@/types'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ImportRow {
  [key: string]: string | number | undefined
}

export type ImportStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'partial'

export interface ProcessedLead {
  rowIndex: number
  rawRow: ImportRow
  normalized: ReturnType<typeof normalizeLead>
  trustScore: number
  trustStatus: string
  trustFlags: string[]
  isDuplicate: boolean
  duplicateOfId?: string
  contact?: Contact
  opportunity?: Opportunity
  status: 'created' | 'duplicate' | 'invalid' | 'skipped'
  reason?: string
}

export interface ImportPipelineOptions {
  tenantId: string
  companyId: string
  pipelineId: string
  defaultStageId: string           // etapa inicial de nuevas oportunidades
  ownerUserId?: string             // si null → se asigna después
  columnMapping: Record<string, string>  // columna CSV → campo normalizado
  skipDuplicates?: boolean         // default: true
  minTrustScore?: number           // default: 30
  createOpportunities?: boolean    // default: true
  hasImpliedConsent?: boolean      // fuente tiene consentimiento implícito
  existingContacts?: Contact[]     // para detección de duplicados
}

export interface ImportPipelineResult {
  totalRows: number
  processed: number
  created: number
  duplicates: number
  invalid: number
  skipped: number
  leads: ProcessedLead[]
  contactsCreated: Contact[]
  opportunitiesCreated: Opportunity[]
  processingTimeMs: number
  errors: string[]
}

// ─── Mapeo de columnas ────────────────────────────────────────────────────────

export const DEFAULT_COLUMN_ALIASES: Record<string, string[]> = {
  email: ['email', 'correo', 'e-mail', 'email address', 'correo electronico'],
  phone: ['phone', 'telefono', 'tel', 'celular', 'movil', 'whatsapp', 'mobile', 'cel'],
  name: ['name', 'nombre', 'full name', 'nombre completo', 'contact name'],
  firstName: ['first name', 'nombre', 'first_name', 'nombre de pila'],
  lastName: ['last name', 'apellido', 'last_name', 'apellidos'],
  company: ['company', 'empresa', 'organization', 'organización', 'negocio'],
  source: ['source', 'fuente', 'lead source', 'origen', 'canal'],
  city: ['city', 'ciudad', 'municipio'],
  state: ['state', 'estado', 'provincia'],
  notes: ['notes', 'notas', 'comentarios', 'observations'],
}

export function autoDetectColumns(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}
  const lowerHeaders = headers.map(h => h.toLowerCase().trim())

  for (const [field, aliases] of Object.entries(DEFAULT_COLUMN_ALIASES)) {
    const matchIndex = lowerHeaders.findIndex(h => aliases.some(a => h.includes(a)))
    if (matchIndex !== -1) {
      mapping[headers[matchIndex]] = field
    }
  }
  return mapping
}

// ─── Aplicar mapeo de columnas ────────────────────────────────────────────────

function applyColumnMapping(
  row: ImportRow,
  mapping: Record<string, string>,
): RawLeadInput {
  const input: RawLeadInput = {}
  for (const [csvCol, field] of Object.entries(mapping)) {
    const value = row[csvCol]
    if (value !== undefined && value !== null && value !== '') {
      input[field] = String(value).trim()
    }
  }
  return input
}

// ─── Pipeline principal ───────────────────────────────────────────────────────

export function runImportPipeline(
  rows: ImportRow[],
  options: ImportPipelineOptions,
): ImportPipelineResult {
  const start = performance.now()
  const {
    tenantId, companyId, pipelineId, defaultStageId,
    ownerUserId, columnMapping, existingContacts = [],
    skipDuplicates = true,
    minTrustScore = 30,
    createOpportunities = true,
    hasImpliedConsent = false,
  } = options

  const errors: string[] = []
  const processedLeads: ProcessedLead[] = []
  const contactsCreated: Contact[] = []
  const opportunitiesCreated: Opportunity[] = []

  // Pool de contactos para deduplicación en tiempo real (existentes + creados en esta ejecución)
  const contactPool = [...existingContacts]

  for (let i = 0; i < rows.length; i++) {
    const rawRow = rows[i]
    const processed: ProcessedLead = {
      rowIndex: i,
      rawRow,
      normalized: null as unknown as ReturnType<typeof normalizeLead>,
      trustScore: 0,
      trustStatus: 'pending',
      trustFlags: [],
      isDuplicate: false,
      status: 'pending' as unknown as ProcessedLead['status'],
    }

    try {
      // Fase 1: Normalizar
      const rawInput = applyColumnMapping(rawRow, columnMapping)
      const normalized = normalizeLead(rawInput)
      processed.normalized = normalized

      // Fase 2: Data Trust
      const trustOptions: TrustEngineOptions = {
        hasExplicitConsent: hasImpliedConsent,
        locationCity: String(rawRow[Object.keys(rawRow).find(k => k.toLowerCase().includes('ciudad') || k.toLowerCase().includes('city')) ?? ''] ?? ''),
        locationState: String(rawRow[Object.keys(rawRow).find(k => k.toLowerCase().includes('estado') || k.toLowerCase().includes('state')) ?? ''] ?? ''),
        locationCountry: 'MX',
      }
      const trust = calculateDataTrust(normalized, trustOptions)
      processed.trustScore = trust.score
      processed.trustStatus = trust.status
      processed.trustFlags = trust.flags

      // Fase 3: Validación mínima
      if (trust.score < minTrustScore) {
        processed.status = 'invalid'
        processed.reason = `Trust score ${trust.score} por debajo del mínimo ${minTrustScore}`
        processedLeads.push(processed)
        continue
      }

      // Fase 4: Detección de duplicados
      const tempContact = createContactFromLead(normalized, trust, {
        tenantId, companyId, sourceRow: rawRow,
        city: String(trustOptions.locationCity),
        state: String(trustOptions.locationState),
      })

      const dupResult = checkForDuplicate(tempContact, contactPool)
      if (dupResult) {
        processed.isDuplicate = true
        processed.duplicateOfId = dupResult.suggestedMerge.keepId
        if (skipDuplicates) {
          processed.status = 'duplicate'
          processed.reason = `Duplicado de contacto ${dupResult.suggestedMerge.keepId} (estrategia: ${dupResult.strategy})`
          processedLeads.push(processed)
          continue
        }
      }

      // Fase 5: Crear contacto
      const contact = tempContact
      processed.contact = contact
      contactsCreated.push(contact)
      contactPool.push(contact)

      // Fase 6: Crear oportunidad (si aplica)
      if (createOpportunities && shouldCreateOpportunity(contact, trust)) {
        const opp = createOpportunityFromContact(contact, trust, {
          tenantId, companyId, pipelineId, defaultStageId,
          ownerUserId,
        })
        processed.opportunity = opp
        opportunitiesCreated.push(opp)
      }

      processed.status = 'created'
      processedLeads.push(processed)
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      errors.push(`Fila ${i + 1}: ${errMsg}`)
      processed.status = 'invalid'
      processed.reason = errMsg
      processedLeads.push(processed)
    }
  }

  const created = processedLeads.filter(l => l.status === 'created').length
  const duplicates = processedLeads.filter(l => l.status === 'duplicate').length
  const invalid = processedLeads.filter(l => l.status === 'invalid').length
  const skipped = processedLeads.filter(l => l.status === 'skipped').length

  return {
    totalRows: rows.length,
    processed: processedLeads.length,
    created,
    duplicates,
    invalid,
    skipped,
    leads: processedLeads,
    contactsCreated,
    opportunitiesCreated,
    processingTimeMs: Math.round(performance.now() - start),
    errors,
  }
}
