// ─────────────────────────────────────────────────────────────────────────────
// assignmentEngine.ts — Alqia Commercial OS / Data Spine
// Asigna oportunidades y contactos a vendedores.
// Estrategias: manual, round_robin, by_workload, by_performance
// ─────────────────────────────────────────────────────────────────────────────

import type { Opportunity } from '@/types'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type AssignmentStrategy =
  | 'manual'           // el usuario asigna
  | 'round_robin'      // rotación equitativa
  | 'by_workload'      // al que tenga menos oportunidades abiertas
  | 'by_performance'   // al que tenga mejor tasa de conversión reciente
  | 'by_branch'        // por zona geográfica o sucursal
  | 'unassigned'       // deja sin asignar (bandeja de entrada)

export interface Seller {
  id: string
  tenant_id: string
  company_id: string
  user_id: string
  name: string
  email: string
  phone?: string
  role: 'asesor' | 'gerente' | 'director'
  branch?: string
  territories?: string[]      // ciudades, estados o zonas
  is_active: boolean
  max_open_opps?: number      // límite de oportunidades simultáneas
  created_at: string
  updated_at: string
}

export interface SellerPerformance {
  sellerId: string
  openOpportunities: number
  wonLast30Days: number
  lostLast30Days: number
  conversionRate: number      // 0-1
  avgCycledays: number
  totalPipelineValue: number
  avgResponseTimeHours?: number
}

export interface AssignmentResult {
  oppId: string
  assignedTo: string | null   // userId del vendedor, o null si no se pudo asignar
  strategy: AssignmentStrategy
  reason: string
  timestamp: string
}

export interface AssignmentEngineOptions {
  strategy: AssignmentStrategy
  sellers: Seller[]
  performances?: Record<string, SellerPerformance>
  preferences?: {
    respectTerritories?: boolean
    contactCity?: string
    contactState?: string
    preferBranch?: string
    manualSellerId?: string
  }
}

// ─── Round Robin ──────────────────────────────────────────────────────────────

const roundRobinIndex: Record<string, number> = {}

function nextRoundRobin(companyId: string, activeSellers: Seller[]): Seller | null {
  if (activeSellers.length === 0) return null
  const idx = (roundRobinIndex[companyId] ?? 0) % activeSellers.length
  roundRobinIndex[companyId] = idx + 1
  return activeSellers[idx]
}

// ─── Por carga de trabajo ─────────────────────────────────────────────────────

function sellerByWorkload(
  sellers: Seller[],
  performances: Record<string, SellerPerformance>,
): Seller | null {
  if (sellers.length === 0) return null
  return sellers.reduce((best, s) => {
    const bestLoad = performances[best.id]?.openOpportunities ?? 999
    const sLoad = performances[s.id]?.openOpportunities ?? 0
    const maxLoad = s.max_open_opps ?? 50
    if (sLoad >= maxLoad) return best
    return sLoad < bestLoad ? s : best
  })
}

// ─── Por rendimiento ──────────────────────────────────────────────────────────

function sellerByPerformance(
  sellers: Seller[],
  performances: Record<string, SellerPerformance>,
): Seller | null {
  if (sellers.length === 0) return null
  return sellers.reduce((best, s) => {
    const bestRate = performances[best.id]?.conversionRate ?? 0
    const sRate = performances[s.id]?.conversionRate ?? 0
    return sRate > bestRate ? s : best
  })
}

// ─── Por territorio ───────────────────────────────────────────────────────────

function sellerByTerritory(
  sellers: Seller[],
  city?: string,
  state?: string,
): Seller[] {
  if (!city && !state) return sellers
  const normalized = (s: string) => s?.toLowerCase().trim() ?? ''
  return sellers.filter(s =>
    s.territories?.some(t =>
      normalized(t) === normalized(city ?? '') ||
      normalized(t) === normalized(state ?? '')
    )
  )
}

// ─── Motor principal ──────────────────────────────────────────────────────────

export function assignOpportunity(
  opp: Opportunity,
  opts: AssignmentEngineOptions,
): AssignmentResult {
  const now = new Date().toISOString()
  const activeSellers = opts.sellers.filter(s => s.is_active)

  if (activeSellers.length === 0 || opts.strategy === 'unassigned') {
    return {
      oppId: opp.id,
      assignedTo: null,
      strategy: 'unassigned',
      reason: 'Sin vendedores activos o estrategia de bandeja sin asignar',
      timestamp: now,
    }
  }

  if (opts.strategy === 'manual') {
    const sellerId = opts.preferences?.manualSellerId
    if (!sellerId) {
      return { oppId: opp.id, assignedTo: null, strategy: 'manual', reason: 'Asignación manual sin selección', timestamp: now }
    }
    return { oppId: opp.id, assignedTo: sellerId, strategy: 'manual', reason: 'Asignado manualmente', timestamp: now }
  }

  // Filtrar por territorio si se pide
  let candidateSellers = activeSellers
  if (opts.preferences?.respectTerritories) {
    const byTerritory = sellerByTerritory(
      activeSellers,
      opts.preferences.contactCity,
      opts.preferences.contactState,
    )
    if (byTerritory.length > 0) candidateSellers = byTerritory
  }

  let seller: Seller | null = null

  switch (opts.strategy) {
    case 'round_robin':
      seller = nextRoundRobin(opp.company_id, candidateSellers)
      break
    case 'by_workload':
      seller = sellerByWorkload(candidateSellers, opts.performances ?? {})
      break
    case 'by_performance':
      seller = sellerByPerformance(candidateSellers, opts.performances ?? {})
      break
    case 'by_branch':
      seller = candidateSellers.find(s => s.branch === opts.preferences?.preferBranch) ?? candidateSellers[0] ?? null
      break
    default:
      seller = candidateSellers[0] ?? null
  }

  if (!seller) {
    return { oppId: opp.id, assignedTo: null, strategy: opts.strategy, reason: 'No se encontró vendedor disponible', timestamp: now }
  }

  return {
    oppId: opp.id,
    assignedTo: seller.user_id,
    strategy: opts.strategy,
    reason: `Asignado por estrategia: ${opts.strategy} → ${seller.name}`,
    timestamp: now,
  }
}

/**
 * Asigna en lote múltiples oportunidades.
 * Round robin mantiene estado entre llamadas.
 */
export function assignBatch(
  opportunities: Opportunity[],
  opts: AssignmentEngineOptions,
): AssignmentResult[] {
  return opportunities.map(opp => assignOpportunity(opp, opts))
}

// ─── Calcular performance de vendedores ──────────────────────────────────────

export function computeSellerPerformance(
  sellers: Seller[],
  opportunities: Opportunity[],
): Record<string, SellerPerformance> {
  const now = Date.now()
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()

  return Object.fromEntries(sellers.map(seller => {
    const sellerOpps = opportunities.filter(o => o.owner_user_id === seller.user_id)
    const openOpps = sellerOpps.filter(o => o.status === 'open')
    const recentWon = sellerOpps.filter(o => o.status === 'won' && (o.won_at ?? '') >= thirtyDaysAgo)
    const recentLost = sellerOpps.filter(o => o.status === 'lost' && (o.updated_at ?? '') >= thirtyDaysAgo)
    const closed = recentWon.length + recentLost.length
    const conversionRate = closed > 0 ? recentWon.length / closed : 0
    const pipelineValue = openOpps.reduce((s, o) => s + (o.estimated_value ?? 0), 0)

    const perf: SellerPerformance = {
      sellerId: seller.id,
      openOpportunities: openOpps.length,
      wonLast30Days: recentWon.length,
      lostLast30Days: recentLost.length,
      conversionRate,
      avgCycledays: 14, // placeholder
      totalPipelineValue: pipelineValue,
    }
    return [seller.id, perf]
  }))
}
