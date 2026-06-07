import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { RadarFindingCard } from '@/components/ui/RadarFindingCard'
import { OpportunityPulseCard } from '@/components/ui/OpportunityPulseCard'
import { TimelineEvent } from '@/components/ui/TimelineEvent'
import { useAppStore } from '@/store/appStore'
import { useCommercialStore } from '@/store/commercialStore'
import { runRevenueRadarEngine } from '@/core/data-spine/revenueRadarEngine'
import { logEvent, formatCurrency } from '@/lib/utils'
import {
  RefreshCw, Sparkles, ArrowRight, TrendingUp,
  TrendingDown, AlertTriangle, Flame, RotateCcw,
  Clock, ChevronRight, Building2, Bell,
} from 'lucide-react'
import type { AiFinding } from '@/types'
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

  // Si hay datos importados reales, usar el radar engine real
  const realFindings = useMemo(() => {
    if (dataMode === 'mock' || importedContacts.length === 0) return null
    return runRevenueRadarEngine({
      contacts: importedContacts,
      opportunities: importedOpportunities,
      companyId: activeCompany.id,
    })
  }, [dataMode, importedContacts, importedOpportunities, activeCompany.id])

  // Refrescar findings cuando cambia la empresa activa o llegan datos reales
  useEffect(() => {
    setFindings(realFindings ?? storeFindings)
  }, [activeCompany.id, realFindings, storeFindings])

  const hora = new Date().getHours()
  const greeting = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'

  // KPIs calculados desde los datos activos (reales si están disponibles, demo si no)
  const allOpps = dataMode !== 'mock' && importedOpportunities.length > 0
    ? importedOpportunities
    : activeOpportunities
  const allContacts = dataMode !== 'mock' && importedContacts.length > 0
    ? importedContacts
    : activeContacts

  const openOpps = allOpps.filter(o => o.status === 'open')
  const potentialRevenue = openOpps.reduce((s, o) => s + (o.estimated_value ?? 0) * ((o.probability ?? 0) / 100), 0)
  const hotOpps = openOpps.filter(o => (o.lead_intent_score ?? 0) >= 70)
  const overdueOpps = openOpps.filter(o => (o.urgency_score ?? 0) >= 80)

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

  const recentActivity = [...activeInteractions]
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
              value: 47,
              trend: 18,
              sub: 'con datos válidos',
              severity: 'info' as const,
              action: { label: 'Activar rescate', onClick: () => logEvent('recovery.segment_opened') },
            },
            {
              label: 'Seguimientos vencidos',
              value: overdueOpps.length + 6,
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
                to="/oportunidades"
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
                { label: 'Tareas vencidas', to: '/tareas', count: 3, color: 'text-alqia-risk' },
                { label: 'Importar base', to: '/importaciones', count: null, color: 'text-alqia-copper' },
                { label: 'Data Trust', to: '/data-trust', count: null, color: 'text-alqia-info' },
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
