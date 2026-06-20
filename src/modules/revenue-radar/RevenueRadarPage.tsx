import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { RadarFindingCard } from '@/components/ui/RadarFindingCard'
import { OpportunityPulseCard } from '@/components/ui/OpportunityPulseCard'
import { TimelineEvent } from '@/components/ui/TimelineEvent'
import { useAppStore } from '@/store/appStore'
import { useCommercialStore } from '@/store/commercialStore'
import { runRevenueRadarEngine } from '@/core/data-spine/revenueRadarEngine'
import { fetchAiFindings, fetchContacts, fetchInteractions, fetchOpportunities } from '@/lib/apiClient'
import { logEvent, formatCurrency } from '@/lib/utils'
import {
  RefreshCw, Sparkles, ArrowRight, TrendingUp,
  TrendingDown, AlertTriangle, Flame, RotateCcw,
  Clock, ChevronRight, Building2, Bell,
} from 'lucide-react'
import type { AiFinding, Contact, Interaction, Opportunity, PipelineStage } from '@/types'
import { cn } from '@/lib/utils'

// ─── Señal de KPI compacta ──────────────────────────────────────────────────
interface SignalProps {
  label: string
  value: string | number
  sub?: string
  trend?: number
  severity?: 'success' | 'warning' | 'risk' | 'info' | 'neutral'
  action?: { label: string; onClick: () => void }
}

function Signal({ label, value, sub, trend, severity = 'neutral', action }: SignalProps) {
  const valueColors = {
    success: 'text-alqia-success',
    warning: 'text-alqia-warning',
    risk: 'text-alqia-risk',
    info: 'text-alqia-info',
    neutral: 'text-white',
  }
  const TrendIcon = trend && trend > 0 ? TrendingUp : TrendingDown
  const trendColor = trend && trend > 0 ? 'text-alqia-success' : 'text-alqia-risk'

  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[9px] text-alqia-muted uppercase tracking-[0.12em] font-medium">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span className={cn('text-xl font-data font-semibold leading-none', valueColors[severity])}>
          {value}
        </span>
        {trend !== undefined && (
          <div className={cn('flex items-center gap-0.5', trendColor)}>
            <TrendIcon size={10} />
            <span className="text-[10px] font-medium">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      {sub && <p className="text-[10px] text-alqia-muted leading-tight">{sub}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-1 text-[10px] text-alqia-copper hover:text-white transition-colors flex items-center gap-0.5"
        >
          {action.label} <ChevronRight size={9} />
        </button>
      )}
    </div>
  )
}

function buildPreferredChannel(contact?: { whatsapp_phone?: string | null; email?: string | null; phone?: string | null }) {
  if (contact?.whatsapp_phone) return 'whatsapp'
  if (contact?.email) return 'email'
  if (contact?.phone) return 'phone'
  return undefined
}

function toContactModel(companyId: string, tenantId: string, contact: {
  id: string
  full_name: string
  email?: string | null
  normalized_email?: string | null
  phone?: string | null
  normalized_phone?: string | null
  whatsapp_phone?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  consent_status?: 'granted' | 'denied' | 'unknown' | 'expired'
  data_trust_score?: number
  status?: string
}): Contact {
  const [firstName, ...rest] = contact.full_name.trim().split(/\s+/)
  return {
    id: contact.id,
    tenant_id: tenantId,
    company_id: companyId,
    first_name: firstName ?? contact.full_name,
    last_name: rest.join(' ') || undefined,
    full_name: contact.full_name,
    normalized_name: contact.full_name.toLowerCase(),
    email: contact.email ?? undefined,
    normalized_email: contact.normalized_email ?? undefined,
    phone: contact.phone ?? undefined,
    normalized_phone: contact.normalized_phone ?? undefined,
    whatsapp_phone: contact.whatsapp_phone ?? undefined,
    city: contact.city ?? undefined,
    state: contact.state ?? undefined,
    country: contact.country ?? undefined,
    preferred_channel: buildPreferredChannel(contact),
    consent_status: contact.consent_status ?? 'unknown',
    data_trust_score: contact.data_trust_score ?? 0,
    identity_verification_status: 'unverified',
    tags: [],
    metadata: {},
    status: (contact.status as Contact['status']) ?? 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

function toOpportunityModel(
  companyId: string,
  tenantId: string,
  pipelineId: string,
  fallbackOwnerId: string,
  opportunity: Awaited<ReturnType<typeof fetchOpportunities>>['data'][number],
): Opportunity {
  return {
    id: opportunity.id,
    tenant_id: tenantId,
    company_id: companyId,
    pipeline_id: pipelineId,
    stage_id: opportunity.stage?.id ?? 'stage_unknown',
    contact_id: opportunity.contact?.id ?? `contact_${opportunity.id}`,
    owner_user_id: opportunity.owner_user_id ?? fallbackOwnerId,
    title: opportunity.title,
    product_interest: opportunity.product_interest ?? undefined,
    estimated_value: opportunity.estimated_value ?? undefined,
    currency: 'MXN',
    probability: opportunity.probability,
    lead_intent_score: opportunity.lead_intent_score,
    data_trust_score: opportunity.data_trust_score,
    urgency_score: opportunity.urgency_score,
    status: opportunity.status as Opportunity['status'],
    last_contact_at: opportunity.last_contact_at ?? undefined,
    ai_summary: undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    contact: opportunity.contact
      ? toContactModel(companyId, tenantId, opportunity.contact)
      : undefined,
    stage: opportunity.stage
      ? {
          id: opportunity.stage.id,
          tenant_id: tenantId,
          pipeline_id: pipelineId,
          name: opportunity.stage.name,
          order_index: opportunity.stage.order_index,
          probability_default: opportunity.stage.probability_default ?? opportunity.probability,
          max_days_in_stage: undefined,
          stage_type: opportunity.stage.stage_type as PipelineStage['stage_type'],
          color: opportunity.stage.color ?? '#64748b',
          rules: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      : undefined,
  }
}

function toInteractionModel(companyId: string, tenantId: string, interaction: Awaited<ReturnType<typeof fetchInteractions>>['data'][number]): Interaction {
  return {
    id: interaction.id,
    tenant_id: tenantId,
    company_id: companyId,
    opportunity_id: interaction.opportunity_id ?? undefined,
    contact_id: interaction.contact_id ?? undefined,
    user_id: interaction.user_id ?? undefined,
    agent_type: (interaction.agent_type as Interaction['agent_type']) ?? 'system',
    channel: (interaction.channel as Interaction['channel']) ?? 'system',
    direction: (interaction.direction as Interaction['direction']) ?? 'internal',
    subject: interaction.subject ?? undefined,
    content: interaction.content ?? undefined,
    summary: interaction.summary ?? interaction.content ?? undefined,
    sentiment: (interaction.sentiment as Interaction['sentiment']) ?? undefined,
    outcome: undefined,
    intent: undefined,
    metadata: {},
    occurred_at: interaction.occurred_at,
    created_at: interaction.created_at,
  }
}

function toFindingModel(companyId: string, tenantId: string, finding: Awaited<ReturnType<typeof fetchAiFindings>>['data'][number]): AiFinding {
  const evidence = typeof finding.evidence === 'string'
    ? { explanation: finding.evidence }
    : (finding.evidence ?? {})

  return {
    id: finding.id,
    tenant_id: tenantId,
    company_id: companyId,
    finding_type: (finding.finding_type ?? finding.type ?? 'conversion_signal') as AiFinding['finding_type'],
    severity: finding.severity,
    title: finding.title,
    description: finding.description ?? 'Hallazgo IA generado desde actividad real.',
    evidence,
    recommended_action: finding.recommended_action ?? finding.recommendation ?? 'Revisar hallazgo',
    confidence: finding.confidence ?? 0.75,
    status: 'new',
    related_entity_type: undefined,
    related_entity_id: undefined,
    created_at: finding.created_at,
    resolved_at: undefined,
  }
}

function daysSince(date?: string | null) {
  if (!date) return Number.POSITIVE_INFINITY
  const diff = Date.now() - new Date(date).getTime()
  return Math.floor(diff / 86400000)
}

function buildDerivedFindings(companyId: string, tenantId: string, opportunities: Opportunity[], contacts: Contact[], interactions: Interaction[]): AiFinding[] {
  const openOpps = opportunities.filter(opportunity => opportunity.status === 'open')
  const staleOpps = openOpps.filter(opportunity => daysSince(opportunity.last_contact_at) > 5)
  const lowTrustContacts = contacts.filter(contact => contact.data_trust_score < 50)
  const inactiveContacts = contacts.filter(contact => {
    const hasReachableChannel = Boolean(contact.whatsapp_phone || contact.email || contact.phone)
    const lastInteraction = interactions.find(interaction => interaction.contact_id === contact.id)
    return hasReachableChannel && !lastInteraction
  })

  const findings: AiFinding[] = []

  if (staleOpps.length > 0) {
    const valueAtRisk = staleOpps.reduce((sum, opportunity) => sum + ((opportunity.estimated_value ?? 0) * opportunity.probability) / 100, 0)
    findings.push({
      id: `derived_follow_up_gap_${companyId}`,
      tenant_id: tenantId,
      company_id: companyId,
      finding_type: 'follow_up_gap',
      severity: staleOpps.length >= 5 ? 'critical' : 'high',
      title: `${staleOpps.length} cotizaciones sin seguimiento en más de 5 días`,
      description: `Hay ${staleOpps.length} oportunidades abiertas sin interacción reciente. El tiempo óptimo post-cotización ya se pasó.`,
      evidence: {
        count: staleOpps.length,
        metrics: {
          total_value_at_risk: Math.round(valueAtRisk),
          opportunities_open: openOpps.length,
        },
        explanation: 'Se comparó la fecha del último contacto contra una ventana de 5 días para detectar riesgo de enfriamiento.',
      },
      recommended_action: 'Crear tarea urgente por cada oportunidad o iniciar cadencia de cierre.',
      confidence: 0.91,
      status: 'new',
      created_at: new Date().toISOString(),
    })
  }

  if (lowTrustContacts.length > 0) {
    findings.push({
      id: `derived_data_quality_${companyId}`,
      tenant_id: tenantId,
      company_id: companyId,
      finding_type: 'data_quality',
      severity: lowTrustContacts.length >= 10 ? 'high' : 'medium',
      title: `${lowTrustContacts.length} contactos con datos débiles frenan la conversión`,
      description: 'La base tiene contactos con score de confianza bajo; conviene validar canales antes de seguir gastando en outreach.',
      evidence: {
        count: lowTrustContacts.length,
        metrics: {
          avg_trust_low_segment: Math.round(lowTrustContacts.reduce((sum, contact) => sum + contact.data_trust_score, 0) / lowTrustContacts.length),
        },
        explanation: 'Se consideró bajo trust a todo contacto por debajo de 50 puntos.',
      },
      recommended_action: 'Priorizar validación y enriquecimiento de canales antes de nuevas campañas.',
      confidence: 0.83,
      status: 'new',
      created_at: new Date().toISOString(),
    })
  }

  if (inactiveContacts.length > 0) {
    findings.push({
      id: `derived_forgotten_leads_${companyId}`,
      tenant_id: tenantId,
      company_id: companyId,
      finding_type: 'forgotten_leads',
      severity: inactiveContacts.length >= 20 ? 'high' : 'medium',
      title: `${inactiveContacts.length} leads con canal válido siguen sin contacto`,
      description: 'Hay contactos contactables que todavía no entran a un flujo comercial o no tienen actividad registrada.',
      evidence: {
        count: inactiveContacts.length,
        metrics: {
          whatsapp_ready: inactiveContacts.filter(contact => Boolean(contact.whatsapp_phone)).length,
          email_ready: inactiveContacts.filter(contact => Boolean(contact.email)).length,
        },
        explanation: 'Se detectaron contactos con al menos un canal utilizable y sin interacción en memoria comercial.',
      },
      recommended_action: 'Activar rescate con WhatsApp o email según canal disponible.',
      confidence: 0.79,
      status: 'new',
      created_at: new Date().toISOString(),
    })
  }

  return findings
}

// ─── Página principal ────────────────────────────────────────────────────────
export function RevenueRadarPage() {
  const {
    currentUser, activeCompany, activeIndustry,
    activeAiFindings: storeFindings, activeOpportunities,
    activeInteractions, activeStages, activeContacts,
    dismissFinding,
  } = useAppStore()
  const { importedContacts, importedOpportunities, dataMode } = useCommercialStore()
  const voc = activeIndustry.vocabulary
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [findings, setFindings] = useState(storeFindings)
  const realCompanyId = activeCompany.db_company_id
  const tenantId = currentUser.tenant_id

  const opportunitiesQuery = useQuery({
    queryKey: ['opportunities', realCompanyId, 'revenue-radar'],
    queryFn: () => fetchOpportunities(realCompanyId as string),
    enabled: Boolean(realCompanyId),
  })

  const contactsQuery = useQuery({
    queryKey: ['contacts', realCompanyId, 'revenue-radar'],
    queryFn: () => fetchContacts(realCompanyId as string),
    enabled: Boolean(realCompanyId),
  })

  const interactionsQuery = useQuery({
    queryKey: ['interactions', realCompanyId, 'revenue-radar'],
    queryFn: () => fetchInteractions(realCompanyId as string),
    enabled: Boolean(realCompanyId),
  })

  const findingsQuery = useQuery({
    queryKey: ['ai-findings', realCompanyId, 'revenue-radar'],
    queryFn: () => fetchAiFindings(realCompanyId as string),
    enabled: Boolean(realCompanyId),
  })

  const realContacts = useMemo(() => {
    if (!realCompanyId || !contactsQuery.data?.data?.length) return []
    return contactsQuery.data.data.map(contact => toContactModel(realCompanyId, tenantId, contact))
  }, [contactsQuery.data?.data, realCompanyId, tenantId])

  const realOpportunities = useMemo(() => {
    if (!realCompanyId || !opportunitiesQuery.data?.data?.length) return []
    return opportunitiesQuery.data.data.map(opportunity =>
      toOpportunityModel(realCompanyId, tenantId, activeCompany.id, currentUser.id, opportunity),
    )
  }, [activeCompany.id, currentUser.id, opportunitiesQuery.data?.data, realCompanyId, tenantId])

  const realInteractions = useMemo(() => {
    if (!realCompanyId || !interactionsQuery.data?.data?.length) return []
    return interactionsQuery.data.data.map(interaction => toInteractionModel(realCompanyId, tenantId, interaction))
  }, [interactionsQuery.data?.data, realCompanyId, tenantId])

  const remoteFindings = useMemo(() => {
    if (!realCompanyId || !findingsQuery.data?.data?.length) return []
    return findingsQuery.data.data.map(finding => toFindingModel(realCompanyId, tenantId, finding))
  }, [findingsQuery.data?.data, realCompanyId, tenantId])

  // Si hay datos importados reales, usar el radar engine real
  const importedFindings = useMemo(() => {
    if (dataMode === 'mock' || importedContacts.length === 0) return null
    return runRevenueRadarEngine({
      contacts: importedContacts,
      opportunities: importedOpportunities,
      companyId: activeCompany.id,
    })
  }, [dataMode, importedContacts, importedOpportunities, activeCompany.id])

  const derivedRealFindings = useMemo(() => {
    if (!realCompanyId || realOpportunities.length === 0 || remoteFindings.length > 0) return []
    return buildDerivedFindings(realCompanyId, tenantId, realOpportunities, realContacts, realInteractions)
  }, [realCompanyId, realOpportunities, remoteFindings.length, tenantId, realContacts, realInteractions])

  const effectiveFindings = useMemo(() => {
    if (remoteFindings.length > 0) return remoteFindings
    if (derivedRealFindings.length > 0) return derivedRealFindings
    if (importedFindings?.length) return importedFindings
    return storeFindings
  }, [derivedRealFindings, importedFindings, remoteFindings, storeFindings])

  // Refrescar findings cuando cambia la empresa activa o llegan datos reales
  useEffect(() => {
    setFindings(effectiveFindings)
  }, [activeCompany.id, effectiveFindings])

  const hora = new Date().getHours()
  const greeting = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'

  // KPIs calculados desde los datos activos (reales si están disponibles, demo si no)
  const allOpps = realOpportunities.length > 0
    ? realOpportunities
    : dataMode !== 'mock' && importedOpportunities.length > 0
    ? importedOpportunities
    : activeOpportunities
  const allContacts = realContacts.length > 0
    ? realContacts
    : dataMode !== 'mock' && importedContacts.length > 0
    ? importedContacts
    : activeContacts
  const allInteractions = realInteractions.length > 0 ? realInteractions : activeInteractions

  const openOpps = allOpps.filter(o => o.status === 'open')
  const potentialRevenue = openOpps.reduce((s, o) => s + (o.estimated_value ?? 0) * ((o.probability ?? 0) / 100), 0)
  const hotOpps = openOpps.filter(o => (o.lead_intent_score ?? 0) >= 70)
  const overdueOpps = openOpps.filter(o => (o.urgency_score ?? 0) >= 80 || daysSince(o.last_contact_at) > 5)
  const recoverableContacts = allContacts.filter(contact =>
    contact.data_trust_score >= 60 && Boolean(contact.whatsapp_phone || contact.email || contact.phone),
  )

  // Top oportunidades enriquecidas
  const topOpportunities = [...openOpps]
    .sort((a, b) => b.urgency_score - a.urgency_score)
    .slice(0, 4)
    .map(o => ({
      ...o,
      contact: allContacts.find(c => c.id === o.contact_id),
      stage: activeStages.find(s => s.id === o.stage_id),
      owner: currentUser,
    }))

  const recentActivity = [...allInteractions]
    .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
    .slice(0, 5)

  const criticalFinding = findings.find(f => f.severity === 'critical') ?? findings[0]
  const otherFindings = findings.filter(f => f.id !== criticalFinding?.id)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    logEvent('radar.refresh_requested')
    await new Promise(r => setTimeout(r, 1500))
    setIsRefreshing(false)
    logEvent('radar.refresh_completed')
  }

  const handleDismissFinding = (finding: AiFinding) => {
    setFindings(prev => prev.filter(f => f.id !== finding.id))
    dismissFinding(finding.id)
  }

  return (
    <div className="min-h-full bg-[#0E1620]">

      {/* ── COMMAND BAR — sustituto del topbar ─────────────────────────── */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-6 h-12 border-b border-white/[0.05] bg-[#0E1620]/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="text-xs text-alqia-muted">{greeting},</span>
          <span className="text-xs font-medium text-white">{currentUser.full_name.split(' ')[0]}</span>
          <span className="w-px h-3 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <Building2 size={11} className="text-alqia-muted" />
            <span className="text-[11px] text-alqia-secondary">{activeCompany.short_name}</span>
            <span className="text-[9px] text-alqia-muted/60 border border-white/8 px-1.5 py-0.5 rounded-full ml-1">{activeIndustry.name}</span>
          </div>
          <span className="w-px h-3 bg-white/10" />
          <span className="text-[11px] text-alqia-muted">
            {new Date().toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Señal de sistema activo */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-alqia-success/8 border border-alqia-success/15">
            <span className="w-1.5 h-1.5 rounded-full bg-alqia-success animate-pulse-soft" />
            <span className="text-[9px] text-alqia-success uppercase tracking-widest font-medium">IA activa</span>
          </div>
          <button
            onClick={handleRefresh}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-alqia-muted hover:text-white hover:bg-white/[0.05] transition-all"
            title="Actualizar análisis"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <button className="w-7 h-7 rounded-lg flex items-center justify-center text-alqia-muted hover:text-white hover:bg-white/[0.05] transition-all relative">
            <Bell size={13} />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-alqia-copper" />
          </button>
        </div>
      </div>

      <div className="px-6 pt-6 pb-8 max-w-[1400px] mx-auto">

        {/* ── AI REVENUE BRIEFING ─────────────────────────────────────────── */}
        {criticalFinding && (
          <div className="mb-6 rounded-2xl border border-alqia-risk/20 bg-gradient-to-r from-alqia-risk/6 to-transparent overflow-hidden relative">
            <div className="absolute left-0 inset-y-0 w-[3px] bg-alqia-risk" />
            <div className="pl-5 pr-5 py-4 flex items-start justify-between gap-6">
              <div className="flex items-start gap-3 flex-1">
                <AlertTriangle size={16} className="text-alqia-risk flex-shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] text-alqia-risk font-semibold tracking-[0.12em] uppercase">Alerta prioritaria — Requiere acción hoy</span>
                  </div>
                  <p className="text-sm font-medium text-white leading-snug">{criticalFinding.title}</p>
                  <p className="text-xs text-alqia-secondary mt-1 leading-relaxed max-w-2xl">
                    {criticalFinding.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleDismissFinding(criticalFinding)}
                  className="px-3 py-1.5 rounded-xl text-xs text-alqia-muted border border-white/10 hover:text-white hover:border-white/20 transition-all"
                >
                  Descartar
                </button>
                <button
                  onClick={() => logEvent('ai.action.approval_requested', { finding_id: criticalFinding.id })}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-alqia-risk/15 border border-alqia-risk/30 text-alqia-risk text-xs font-medium hover:bg-alqia-risk/25 transition-all"
                >
                  {criticalFinding.recommended_action}
                  <ArrowRight size={11} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── SEÑALES COMPACTAS ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-px bg-white/[0.04] rounded-2xl overflow-hidden mb-6 border border-white/[0.06]">
          {[
            {
              label: 'Pipeline ponderado',
              value: formatCurrency(potentialRevenue),
              trend: 12,
              severity: 'success' as const,
              sub: `${openOpps.length} ${voc.opportunity_label.toLowerCase()}s abiertas`,
            },
            {
              label: `${voc.product_label}s calientes`,
              value: hotOpps.length,
              sub: 'intención alta',
              severity: 'warning' as const,
              action: { label: `Ver calientes`, onClick: () => logEvent('metric.hot_clicked') },
            },
            {
              label: `${voc.contact_label}s recuperables`,
              value: recoverableContacts.length,
              trend: 18,
              sub: 'con datos válidos',
              severity: 'info' as const,
              action: { label: 'Activar rescate', onClick: () => logEvent('recovery.segment_opened') },
            },
            {
              label: 'Seguimientos vencidos',
              value: overdueOpps.length,
              sub: 'requieren acción hoy',
              severity: 'risk' as const,
              action: { label: 'Ver vencidos', onClick: () => logEvent('metric.overdue_clicked') },
            },
            {
              label: 'Hallazgos IA',
              value: findings.length,
              sub: 'actualizados hoy',
              severity: 'neutral' as const,
            },
          ].map((sig, i) => (
            <div
              key={i}
              className="bg-[#121D2A] px-5 py-4 hover:bg-[#162030] transition-colors first:rounded-l-2xl last:rounded-r-2xl"
            >
              <Signal {...sig} />
            </div>
          ))}
        </div>

        {/* ── BODY — 3 columnas ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_300px] gap-5">

          {/* ── COLUMNA 1: Revenue Moves Today ───────────────────────────── */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Sparkles size={13} className="text-alqia-info" />
              <h2 className="text-xs font-medium text-white tracking-wide uppercase">Diagnósticos IA activos</h2>
              {findings.length > 1 && (
                <span className="text-[10px] text-alqia-muted border border-white/10 px-1.5 py-0.5 rounded-full">
                  {findings.length - 1} más
                </span>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {otherFindings.slice(0, 4).map(finding => (
                <RadarFindingCard
                  key={finding.id}
                  finding={finding}
                  onDismiss={handleDismissFinding}
                  onExecute={(f) => logEvent('ai.action.approval_requested', { finding_id: f.id })}
                />
              ))}

              {findings.length === 0 && (
                <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-8 text-center">
                  <Sparkles size={20} className="text-alqia-info mx-auto mb-3 opacity-40" />
                  <p className="text-sm text-alqia-secondary">Sin alertas activas.</p>
                  <p className="text-xs text-alqia-muted mt-1">El radar no detectó riesgos críticos.</p>
                  <button onClick={handleRefresh} className="mt-4 text-xs text-alqia-copper hover:text-white transition-colors">
                    Actualizar análisis
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── COLUMNA 2: Oportunidades que requieren movimiento ─────────── */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame size={13} className="text-alqia-copper" />
                <h2 className="text-xs font-medium text-white tracking-wide uppercase">Oportunidades urgentes</h2>
              </div>
              <Link
                to="/app/oportunidades"
                className="text-[10px] text-alqia-muted hover:text-alqia-secondary flex items-center gap-0.5 transition-colors"
              >
                Ver todas <ChevronRight size={10} />
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              {topOpportunities.map(opp => (
                <OpportunityPulseCard key={opp.id} opportunity={opp} />
              ))}
            </div>

            <div className="mt-1 rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3">
              <p className="text-[10px] text-alqia-muted uppercase tracking-[0.1em] mb-2">Pipeline por asesor</p>
              <div className="flex flex-col gap-2">
                {openOpps.reduce((acc: { uid: string; name: string; count: number; value: number }[], o) => {
                  const existing = acc.find(a => a.uid === o.owner_user_id)
                  if (existing) { existing.count++; existing.value += o.estimated_value ?? 0 }
                  else acc.push({ uid: o.owner_user_id, name: o.contact?.full_name?.split(' ')[0] ?? o.owner_user_id, count: 1, value: o.estimated_value ?? 0 })
                  return acc
                }, []).slice(0, 4).map(rep => (
                  <div key={rep.uid} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-alqia-copper/15 flex items-center justify-center text-alqia-copper text-[9px] font-medium flex-shrink-0">
                      {rep.uid.slice(-2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-[11px] text-alqia-secondary truncate">{voc.contact_label} {rep.count}</p>
                        <p className="text-[10px] font-data text-white">{formatCurrency(rep.value)}</p>
                      </div>
                      <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                        <div className="h-full bg-alqia-copper/50 rounded-full" style={{ width: `${Math.min(rep.count * 20, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── COLUMNA 3: Actividad (secundaria) ────────────────────────── */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Clock size={13} className="text-alqia-muted" />
              <h2 className="text-xs font-medium text-alqia-secondary tracking-wide uppercase">Actividad reciente</h2>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] divide-y divide-white/[0.04] overflow-hidden">
              {recentActivity.map((interaction, i) => (
                <TimelineEvent
                  key={interaction.id}
                  interaction={interaction}
                  isLast={i === recentActivity.length - 1}
                />
              ))}
            </div>

            {/* Acceso rápido a tareas */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
              <p className="text-[9px] text-alqia-muted uppercase tracking-widest mb-2">Acceso rápido</p>
              {[
                { label: 'Tareas vencidas', to: '/app/tareas', count: 3, color: 'text-alqia-risk' },
                { label: 'Importar base', to: '/app/importaciones', count: null, color: 'text-alqia-copper' },
                { label: 'Data Trust', to: '/app/data-trust', count: null, color: 'text-alqia-info' },
              ].map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center justify-between py-1.5 text-[11px] text-alqia-muted hover:text-white transition-colors"
                >
                  <span>{item.label}</span>
                  <div className="flex items-center gap-1">
                    {item.count && (
                      <span className={cn('font-data font-medium', item.color)}>{item.count}</span>
                    )}
                    <ChevronRight size={10} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
