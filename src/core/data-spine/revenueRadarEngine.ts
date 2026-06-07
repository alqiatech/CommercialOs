// ─────────────────────────────────────────────────────────────────────────────
// revenueRadarEngine.ts — Alqia Commercial OS / Data Spine
// Genera hallazgos de IA desde datos reales del store.
// Sin APIs, sin fetch — análisis local sobre los datos importados.
// Se ejecuta cuando hay datos reales en commercialStore.
// ─────────────────────────────────────────────────────────────────────────────

import type { Contact, Opportunity, AiFinding } from '@/types'

let findingCounter = 0
function genFindingId(): string {
  findingCounter++
  return `radar_${Date.now().toString(36)}_${findingCounter}`
}

const T = 'ten_001'
const NOW = () => new Date().toISOString()

function makeFinding(
  companyId: string,
  type: AiFinding['finding_type'],
  sev: AiFinding['severity'],
  title: string,
  desc: string,
  count: number,
  metrics: Record<string, number | string>,
  action: string,
  confidence: number,
): AiFinding {
  return {
    id: genFindingId(),
    tenant_id: T,
    company_id: companyId,
    finding_type: type,
    severity: sev,
    title,
    description: desc,
    evidence: { count, metrics, explanation: 'Análisis generado desde datos reales importados por Alqia IA.' },
    recommended_action: action,
    confidence,
    status: 'new',
    created_at: NOW(),
  }
}

// ─── Umbrales configurables ───────────────────────────────────────────────────

const THRESHOLDS = {
  followUpGapDays: 5,          // días sin seguimiento = oportunidad en riesgo
  forgottenLeadDays: 45,       // días sin contacto = lead olvidado
  highTrustMinScore: 70,       // score mínimo para "alto trust"
  lowTrustMaxScore: 40,        // score máximo para "bajo trust"
  whatsappMinScore: 55,        // score mínimo para recomendar WhatsApp
  urgentConversionMinScore: 80, // score de intent mínimo para urgente
}

// ─── Análisis 1: Oportunidades sin seguimiento ────────────────────────────────

function analyzeFollowUpGaps(
  opportunities: Opportunity[],
  companyId: string,
): AiFinding | null {
  const now = Date.now()
  const gapMs = THRESHOLDS.followUpGapDays * 24 * 60 * 60 * 1000
  const openOpps = opportunities.filter(o => o.status === 'open' && o.company_id === companyId)
  const gapped = openOpps.filter(o => {
    const lastContact = o.last_contact_at ? Date.parse(o.last_contact_at) : 0
    return lastContact > 0 && (now - lastContact) > gapMs
  })

  if (gapped.length === 0) return null

  const avgDays = gapped.length > 0
    ? Math.round(gapped.reduce((sum, o) => {
        const lastContact = Date.parse(o.last_contact_at ?? '')
        return sum + (now - lastContact) / (24 * 60 * 60 * 1000)
      }, 0) / gapped.length)
    : 0

  const valueAtRisk = gapped.reduce((s, o) => s + (o.estimated_value ?? 0), 0)

  return makeFinding(
    companyId,
    'follow_up_gap',
    gapped.length >= 10 ? 'critical' : gapped.length >= 5 ? 'high' : 'medium',
    `${gapped.length} oportunidades sin seguimiento en más de ${THRESHOLDS.followUpGapDays} días`,
    `Hay ${gapped.length} oportunidades abiertas sin actividad registrada en más de ${THRESHOLDS.followUpGapDays} días hábiles. Valor en riesgo: ${valueAtRisk.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}. Promedio: ${avgDays} días sin contacto.`,
    gapped.length,
    { avg_days: avgDays, value_at_risk: valueAtRisk },
    `Crear tarea de seguimiento para las ${gapped.length} oportunidades. Priorizar las de mayor valor.`,
    0.95,
  )
}

// ─── Análisis 2: Leads olvidados con datos válidos ────────────────────────────

function analyzeForgottenLeads(
  contacts: Contact[],
  opportunities: Opportunity[],
  companyId: string,
): AiFinding | null {
  const now = Date.now()
  const forgottenMs = THRESHOLDS.forgottenLeadDays * 24 * 60 * 60 * 1000

  const companyContacts = contacts.filter(c => c.company_id === companyId && c.status === 'active')
  const contactsWithOpps = new Set(opportunities.map(o => o.contact_id).filter(Boolean))

  const forgotten = companyContacts.filter(c => {
    const createdAt = Date.parse(c.created_at)
    const isOld = (now - createdAt) > forgottenMs
    const hasValidChannel = c.phone || c.email
    const hasNoOpp = !contactsWithOpps.has(c.id)
    return isOld && hasValidChannel && hasNoOpp
  })

  if (forgotten.length === 0) return null

  const withWhatsApp = forgotten.filter(c => c.whatsapp_phone || c.tags?.includes('whatsapp_probable')).length
  const avgScore = forgotten.length > 0
    ? Math.round(forgotten.reduce((s, c) => s + (c.data_trust_score ?? 0), 0) / forgotten.length)
    : 0

  return makeFinding(
    companyId,
    'forgotten_leads',
    forgotten.length >= 50 ? 'critical' : forgotten.length >= 20 ? 'high' : 'medium',
    `${forgotten.length} leads con datos válidos sin oportunidad asignada`,
    `${forgotten.length} contactos con al menos un canal de comunicación válido y sin oportunidad creada. ${withWhatsApp} tienen WhatsApp probable. Trust score promedio: ${avgScore}.`,
    forgotten.length,
    { with_whatsapp: withWhatsApp, avg_trust: avgScore, avg_days: THRESHOLDS.forgottenLeadDays },
    `Activar cadencia de reactivación para los ${withWhatsApp} con WhatsApp disponible. Crear oportunidades para los de mayor trust score.`,
    0.92,
  )
}

// ─── Análisis 3: Contactos con alto trust sin oportunidad ────────────────────

function analyzeHighTrustWithoutOpp(
  contacts: Contact[],
  opportunities: Opportunity[],
  companyId: string,
): AiFinding | null {
  const companyContacts = contacts.filter(c => c.company_id === companyId && c.status === 'active')
  const contactsWithOpps = new Set(opportunities.map(o => o.contact_id).filter(Boolean))

  const highTrustNoOpp = companyContacts.filter(c =>
    (c.data_trust_score ?? 0) >= THRESHOLDS.highTrustMinScore && !contactsWithOpps.has(c.id)
  )

  if (highTrustNoOpp.length === 0) return null

  return makeFinding(
    companyId,
    'conversion_signal',
    highTrustNoOpp.length >= 20 ? 'high' : 'medium',
    `${highTrustNoOpp.length} contactos de alta calidad sin oportunidad activa`,
    `${highTrustNoOpp.length} contactos con trust score ≥ ${THRESHOLDS.highTrustMinScore} que no tienen ninguna oportunidad en el pipeline. Representan el potencial más calificado de tu base actual.`,
    highTrustNoOpp.length,
    { min_trust: THRESHOLDS.highTrustMinScore, avg_trust: Math.round(highTrustNoOpp.reduce((s, c) => s + (c.data_trust_score ?? 0), 0) / highTrustNoOpp.length) },
    `Crear oportunidades manualmente para estos contactos o activar flujo de creación automática en el pipeline.`,
    0.90,
  )
}

// ─── Análisis 4: Calidad de datos baja ───────────────────────────────────────

function analyzeDataQuality(
  contacts: Contact[],
  companyId: string,
): AiFinding | null {
  const companyContacts = contacts.filter(c => c.company_id === companyId && c.status === 'active')
  if (companyContacts.length === 0) return null

  const lowTrust = companyContacts.filter(c => (c.data_trust_score ?? 0) < THRESHOLDS.lowTrustMaxScore)
  const pct = Math.round((lowTrust.length / companyContacts.length) * 100)

  if (pct < 15 || lowTrust.length < 5) return null

  const noPhone = lowTrust.filter(c => !c.phone).length
  const noEmail = lowTrust.filter(c => !c.email).length

  return makeFinding(
    companyId,
    'data_quality',
    pct >= 40 ? 'high' : 'medium',
    `${pct}% de contactos con calidad de datos insuficiente`,
    `${lowTrust.length} de ${companyContacts.length} contactos tienen trust score menor a ${THRESHOLDS.lowTrustMaxScore}. ${noPhone} sin teléfono, ${noEmail} sin email.`,
    lowTrust.length,
    { pct_low_trust: pct, no_phone: noPhone, no_email: noEmail },
    `Ejecutar enriquecimiento de datos sobre los ${lowTrust.length} registros con calidad baja. Priorizar obtener teléfono o WhatsApp.`,
    0.88,
  )
}

// ─── Análisis 5: Oportunidades de alto intent sin acción urgente ──────────────

function analyzeUrgentHighIntent(
  opportunities: Opportunity[],
  companyId: string,
): AiFinding | null {
  const now = new Date()
  const openOpps = opportunities.filter(o => o.status === 'open' && o.company_id === companyId)

  const urgent = openOpps.filter(o => {
    const intentHigh = (o.lead_intent_score ?? 0) >= THRESHOLDS.urgentConversionMinScore
    const hasNextAction = !!o.next_action_at
    const actionOverdue = hasNextAction && Date.parse(o.next_action_at!) < now.getTime()
    return intentHigh && (!hasNextAction || actionOverdue)
  })

  if (urgent.length === 0) return null

  const totalValue = urgent.reduce((s, o) => s + (o.estimated_value ?? 0), 0)

  return makeFinding(
    companyId,
    'conversion_signal',
    'critical',
    `${urgent.length} oportunidades de alta intención sin acción programada`,
    `${urgent.length} oportunidades tienen intent score ≥ ${THRESHOLDS.urgentConversionMinScore} pero no tienen próxima acción programada o la tienen vencida. Valor total: ${totalValue.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}.`,
    urgent.length,
    { total_value: totalValue, min_intent: THRESHOLDS.urgentConversionMinScore },
    `Programar próxima acción para estas ${urgent.length} oportunidades HOY. Son las de mayor probabilidad de conversión.`,
    0.97,
  )
}

// ─── Motor principal ──────────────────────────────────────────────────────────

export interface RadarEngineInput {
  contacts: Contact[]
  opportunities: Opportunity[]
  companyId: string
}

export function runRevenueRadarEngine(input: RadarEngineInput): AiFinding[] {
  const { contacts, opportunities, companyId } = input
  const findings: AiFinding[] = []

  const analyzers = [
    () => analyzeFollowUpGaps(opportunities, companyId),
    () => analyzeForgottenLeads(contacts, opportunities, companyId),
    () => analyzeHighTrustWithoutOpp(contacts, opportunities, companyId),
    () => analyzeDataQuality(contacts, companyId),
    () => analyzeUrgentHighIntent(opportunities, companyId),
  ]

  for (const analyzer of analyzers) {
    const finding = analyzer()
    if (finding) findings.push(finding)
  }

  // Ordenar: critical primero, luego por confidence desc
  return findings.sort((a, b) => {
    const sevOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }
    const sevDiff = (sevOrder[a.severity] ?? 3) - (sevOrder[b.severity] ?? 3)
    if (sevDiff !== 0) return sevDiff
    return b.confidence - a.confidence
  })
}
