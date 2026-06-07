// ─────────────────────────────────────────────────────────────────────────────
// commercialStore.ts — Alqia Commercial OS
// Store único para datos comerciales reales (importados) vs mock.
// Responsable de: contacts, opportunities, pipeline state.
// Al importar datos reales, estos toman precedencia sobre los mocks de demo.
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand'
import type { Contact, Opportunity, AiFinding, Interaction } from '@/types'
import type { ImportPipelineResult } from '@/core/data-spine/importPipeline'
import type { DataTrustStatus } from '@/core/data-spine/dataTrustEngine'
import { runDedupeEngine, type DedupeReport } from '@/core/data-spine/dedupeEngine'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type DataMode = 'mock' | 'imported' | 'mixed'

export interface ImportBatch {
  id: string
  importedAt: string
  totalRows: number
  created: number
  duplicates: number
  invalid: number
  fileName: string
  companyId: string
}

interface CommercialState {
  // ── Fuente de datos ─────────────────────────────────────────────────────────
  dataMode: DataMode

  // ── Contactos reales (importados) ───────────────────────────────────────────
  importedContacts: Contact[]
  importedOpportunities: Opportunity[]

  // ── Historial de importaciones ──────────────────────────────────────────────
  importBatches: ImportBatch[]
  lastImportResult: ImportPipelineResult | null

  // ── Hallazgos IA generados desde datos reales ───────────────────────────────
  generatedFindings: AiFinding[]

  // ── Estado de deduplicación ─────────────────────────────────────────────────
  dedupeReport: DedupeReport | null
  pendingDuplicates: Array<{
    contactId: string
    duplicateOfId: string
    strategy: string
    confidence: number
  }>

  // ── Stats rápidas (calculadas en background) ────────────────────────────────
  stats: {
    totalContacts: number
    totalOpportunities: number
    contactsWithWhatsApp: number
    contactsHighTrust: number    // score >= 70
    contactsLowTrust: number     // score < 40
    openOpportunities: number
    totalPipelineValue: number
    avgTrustScore: number
    statusBreakdown: Record<DataTrustStatus, number>
  }

  // ── Acciones ────────────────────────────────────────────────────────────────
  acceptImportResult: (result: ImportPipelineResult, meta: { fileName: string; companyId: string }) => void
  addContact: (contact: Contact) => void
  updateContact: (contactId: string, updates: Partial<Contact>) => void
  removeContact: (contactId: string) => void
  updateOpportunity: (oppId: string, updates: Partial<Opportunity>) => void
  addOpportunity: (opp: Opportunity) => void
  dismissDuplicate: (contactId: string) => void
  mergeDuplicate: (keepId: string, discardId: string) => void
  clearImportedData: () => void
  runDedupe: () => void
  setGeneratedFindings: (findings: AiFinding[]) => void
}

// ─── Cálculo de stats ─────────────────────────────────────────────────────────

function computeStats(contacts: Contact[], opportunities: Opportunity[]): CommercialState['stats'] {
  const total = contacts.length
  const withWA = contacts.filter(c => !!c.whatsapp_phone).length
  const highTrust = contacts.filter(c => (c.data_trust_score ?? 0) >= 70).length
  const lowTrust = contacts.filter(c => (c.data_trust_score ?? 0) < 40).length
  const avgScore = total > 0
    ? Math.round(contacts.reduce((sum, c) => sum + (c.data_trust_score ?? 0), 0) / total)
    : 0
  const openOpps = opportunities.filter(o => o.status === 'open').length
  const pipelineValue = opportunities
    .filter(o => o.status === 'open')
    .reduce((sum, o) => sum + (o.estimated_value ?? 0), 0)

  const statusBreakdown = contacts.reduce((acc, c) => {
    const s = (c.metadata as Record<string, string>)?.trust_status as DataTrustStatus ?? 'low_trust'
    acc[s] = (acc[s] ?? 0) + 1
    return acc
  }, {} as Record<DataTrustStatus, number>)

  return {
    totalContacts: total,
    totalOpportunities: opportunities.length,
    contactsWithWhatsApp: withWA,
    contactsHighTrust: highTrust,
    contactsLowTrust: lowTrust,
    openOpportunities: openOpps,
    totalPipelineValue: pipelineValue,
    avgTrustScore: avgScore,
    statusBreakdown,
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useCommercialStore = create<CommercialState>((set, get) => ({
  dataMode: 'mock',
  importedContacts: [],
  importedOpportunities: [],
  importBatches: [],
  lastImportResult: null,
  generatedFindings: [],
  dedupeReport: null,
  pendingDuplicates: [],
  stats: computeStats([], []),

  // ─── Aceptar resultado de importación ──────────────────────────────────────
  acceptImportResult: (result, meta) => {
    set(state => {
      const newContacts = [...state.importedContacts, ...result.contactsCreated]
      const newOpps = [...state.importedOpportunities, ...result.opportunitiesCreated]

      const batch: ImportBatch = {
        id: `batch_${Date.now()}`,
        importedAt: new Date().toISOString(),
        totalRows: result.totalRows,
        created: result.created,
        duplicates: result.duplicates,
        invalid: result.invalid,
        fileName: meta.fileName,
        companyId: meta.companyId,
      }

      return {
        importedContacts: newContacts,
        importedOpportunities: newOpps,
        importBatches: [...state.importBatches, batch],
        lastImportResult: result,
        dataMode: 'imported',
        stats: computeStats(newContacts, newOpps),
      }
    })
  },

  addContact: (contact) => set(state => {
    const contacts = [...state.importedContacts, contact]
    return {
      importedContacts: contacts,
      stats: computeStats(contacts, state.importedOpportunities),
      dataMode: state.dataMode === 'mock' ? 'imported' : state.dataMode,
    }
  }),

  updateContact: (contactId, updates) => set(state => {
    const contacts = state.importedContacts.map(c =>
      c.id === contactId ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
    )
    return { importedContacts: contacts, stats: computeStats(contacts, state.importedOpportunities) }
  }),

  removeContact: (contactId) => set(state => {
    const contacts = state.importedContacts.filter(c => c.id !== contactId)
    const opps = state.importedOpportunities.filter(o => o.contact_id !== contactId)
    return {
      importedContacts: contacts,
      importedOpportunities: opps,
      stats: computeStats(contacts, opps),
    }
  }),

  updateOpportunity: (oppId, updates) => set(state => {
    const opps = state.importedOpportunities.map(o =>
      o.id === oppId ? { ...o, ...updates, updated_at: new Date().toISOString() } : o
    )
    return { importedOpportunities: opps, stats: computeStats(state.importedContacts, opps) }
  }),

  addOpportunity: (opp) => set(state => {
    const opps = [...state.importedOpportunities, opp]
    return { importedOpportunities: opps, stats: computeStats(state.importedContacts, opps) }
  }),

  dismissDuplicate: (contactId) => set(state => ({
    pendingDuplicates: state.pendingDuplicates.filter(d => d.contactId !== contactId),
  })),

  mergeDuplicate: (keepId, discardId) => set(state => {
    const keep = state.importedContacts.find(c => c.id === keepId)
    const discard = state.importedContacts.find(c => c.id === discardId)
    if (!keep || !discard) return {}

    const merged: Contact = {
      ...keep,
      email: keep.email ?? discard.email,
      phone: keep.phone ?? discard.phone,
      whatsapp_phone: keep.whatsapp_phone ?? discard.whatsapp_phone,
      city: keep.city ?? discard.city,
      state: keep.state ?? discard.state,
      tags: [...new Set([...(keep.tags ?? []), ...(discard.tags ?? [])])],
      updated_at: new Date().toISOString(),
    }

    const contacts = state.importedContacts
      .filter(c => c.id !== discardId)
      .map(c => c.id === keepId ? merged : c)

    const opps = state.importedOpportunities.map(o =>
      o.contact_id === discardId ? { ...o, contact_id: keepId } : o
    )

    return {
      importedContacts: contacts,
      importedOpportunities: opps,
      pendingDuplicates: state.pendingDuplicates.filter(
        d => d.contactId !== keepId && d.contactId !== discardId
      ),
      stats: computeStats(contacts, opps),
    }
  }),

  clearImportedData: () => set({
    importedContacts: [],
    importedOpportunities: [],
    importBatches: [],
    lastImportResult: null,
    dedupeReport: null,
    pendingDuplicates: [],
    dataMode: 'mock',
    stats: computeStats([], []),
  }),

  runDedupe: () => {
    const { importedContacts } = get()
    const report = runDedupeEngine(importedContacts)
    const pendingDuplicates = report.pairs.map(p => ({
      contactId: p.contactIdA,
      duplicateOfId: p.contactIdB,
      strategy: p.strategy,
      confidence: p.confidence,
    }))
    set({ dedupeReport: report, pendingDuplicates })
  },

  setGeneratedFindings: (findings) => set({ generatedFindings: findings }),
}))
