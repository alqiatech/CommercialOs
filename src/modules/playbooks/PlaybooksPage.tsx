import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { ActionButton } from '@/components/ui/ActionButton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAppStore } from '@/store/appStore'
import { industryTemplates, getTemplate } from '@/data/industryTemplates'
import type { IndustryKey, IndustryTemplate } from '@/data/industryTemplates'
import { logEvent } from '@/lib/utils'
import {
  BookOpen, ChevronRight, ChevronLeft, Bike, Factory,
  Building, Briefcase, Monitor, Stethoscope, Globe,
  Wine, Shield, GraduationCap, Check, GitBranch,
  MessageCircle, Target, Zap, ArrowRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const industryIcons: Record<IndustryKey, LucideIcon> = {
  automotriz: Bike,
  distribucion_industrial: Factory,
  inmobiliaria: Building,
  servicios_profesionales: Briefcase,
  saas_membresias: Monitor,
  clinicas_salud: Stethoscope,
  turismo_medico: Globe,
  tequilera_exportacion: Wine,
  seguros: Shield,
  educacion_capacitacion: GraduationCap,
}

// ─── Vista de detalle del playbook ──────────────────────────────────────────
function PlaybookDetail({
  template,
  onBack,
  onApply,
  isActive,
}: {
  template: IndustryTemplate
  onBack: () => void
  onApply: (key: IndustryKey) => void
  isActive: boolean
}) {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'cadencias' | 'scripts' | 'scoring' | 'kpis'>('pipeline')
  const Icon = industryIcons[template.industry_key]

  const tabs = [
    { id: 'pipeline' as const, label: 'Pipeline' },
    { id: 'cadencias' as const, label: 'Cadencias' },
    { id: 'scripts' as const, label: 'Mensajes' },
    { id: 'scoring' as const, label: 'Scoring IA' },
    { id: 'kpis' as const, label: 'KPIs' },
  ]

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-alqia-muted hover:text-white transition-colors"
        >
          <ChevronLeft size={14} />
          Playbooks
        </button>
        <span className="text-alqia-muted/30">/</span>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-alqia-copper/10 border border-alqia-copper/20 flex items-center justify-center">
            <Icon size={13} className="text-alqia-copper" />
          </div>
          <span className="text-sm font-medium text-white">{template.name}</span>
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 rounded-2xl border border-white/8 bg-white/[0.025] p-5">
          <p className="text-xs text-alqia-muted uppercase tracking-widest mb-2">{template.industry_key.replace(/_/g, ' ')}</p>
          <h2 className="text-lg font-medium text-white mb-2">{template.pipeline_name}</h2>
          <p className="text-sm text-alqia-secondary leading-relaxed">{template.commercial_description}</p>
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/6">
            <div>
              <p className="text-[10px] text-alqia-muted uppercase tracking-wide">Ciclo promedio</p>
              <p className="text-sm font-data font-medium text-white">{template.avg_cycle_days} días</p>
            </div>
            <div>
              <p className="text-[10px] text-alqia-muted uppercase tracking-wide">Ticket estimado</p>
              <p className="text-sm font-data font-medium text-white">{template.avg_ticket}</p>
            </div>
            <div>
              <p className="text-[10px] text-alqia-muted uppercase tracking-wide">Tipo de venta</p>
              <p className="text-sm font-medium text-white uppercase">{template.sale_type}</p>
            </div>
            <div>
              <p className="text-[10px] text-alqia-muted uppercase tracking-wide">Acción clave</p>
              <p className="text-sm font-medium text-alqia-copper">{template.vocabulary.key_action}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5 flex flex-col gap-3">
          <p className="text-xs text-alqia-muted uppercase tracking-widest">Vocabulario comercial</p>
          {[
            { label: 'Contacto', value: template.vocabulary.contact_label },
            { label: 'Producto', value: template.vocabulary.product_label },
            { label: 'Cierre', value: template.vocabulary.close_label },
            { label: 'Acción central', value: template.vocabulary.key_action },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between">
              <p className="text-[11px] text-alqia-muted">{item.label}</p>
              <p className="text-[11px] text-white font-medium">{item.value}</p>
            </div>
          ))}

          <div className="mt-auto pt-3 border-t border-white/6">
            {isActive ? (
              <div className="flex items-center gap-2 justify-center py-2 rounded-xl bg-alqia-success/10 border border-alqia-success/20">
                <Check size={12} className="text-alqia-success" />
                <p className="text-xs text-alqia-success font-medium">Plantilla aplicada</p>
              </div>
            ) : (
              <button
                onClick={() => onApply(template.industry_key)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-alqia-copper text-white text-xs font-medium hover:bg-alqia-copper-hover transition-all"
              >
                Aplicar a empresa actual
                <ArrowRight size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-white/6 pb-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2.5 text-xs font-medium transition-all border-b-2 -mb-px',
              activeTab === tab.id
                ? 'text-white border-alqia-copper'
                : 'text-alqia-muted border-transparent hover:text-alqia-secondary',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'pipeline' && (
        <div className="grid grid-cols-1 gap-2">
          {template.stages.map((stage, i) => (
            <div key={stage.key} className="flex items-start gap-3 p-3 rounded-xl border border-white/6 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-data font-semibold flex-shrink-0 mt-0.5',
                stage.is_terminal ? 'bg-alqia-success/15 text-alqia-success border border-alqia-success/25' : 'bg-alqia-copper/10 text-alqia-copper border border-alqia-copper/20',
              )}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white">{stage.label}</p>
                  {stage.is_terminal && <StatusBadge variant="success" size="sm">Cierre</StatusBadge>}
                </div>
                <p className="text-xs text-alqia-secondary mt-0.5">{stage.description}</p>
              </div>
              <div className="flex items-center gap-4 text-right flex-shrink-0">
                <div>
                  <p className="text-[10px] text-alqia-muted">Conversión</p>
                  <p className="text-xs font-data text-alqia-success font-medium">{Math.round(stage.conversion_rate_avg * 100)}%</p>
                </div>
                <div>
                  <p className="text-[10px] text-alqia-muted">Duración</p>
                  <p className="text-xs font-data text-white">{stage.typical_duration_days}d</p>
                </div>
              </div>
            </div>
          ))}
          </div>
      )}

      {activeTab === 'cadencias' && (
        <div className="flex flex-col gap-4">
          {template.cadence_templates.length === 0 ? (
            <p className="text-sm text-alqia-muted py-6 text-center">No hay cadencias definidas para esta industria en esta versión.</p>
          ) : template.cadence_templates.map(cad => (
            <div key={cad.name} className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
              <div className="flex items-start gap-2 mb-4">
                <GitBranch size={14} className="text-alqia-copper mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white">{cad.name}</p>
                  <p className="text-xs text-alqia-muted mt-0.5">Activada por: {cad.trigger.replace(/_/g, ' ')}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {cad.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                      <div className="w-5 h-5 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center">
                        <span className="text-[8px] text-alqia-muted font-medium">D{step.day}</span>
                      </div>
                      {idx < cad.steps.length - 1 && <div className="w-px h-4 bg-white/8" />}
                    </div>
                    <div className="pb-2">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <StatusBadge variant={
                          step.channel === 'whatsapp' ? 'success' :
                          step.channel === 'phone' ? 'info' :
                          step.channel === 'email' ? 'neutral' : 'warning'
                        } size="sm">{step.channel}</StatusBadge>
                      </div>
                      <p className="text-xs text-alqia-secondary">{step.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'scripts' && (
        <div className="flex flex-col gap-4">
          {template.message_templates.map((msg, i) => (
            <div key={i} className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle size={13} className="text-alqia-info" />
                <p className="text-xs font-medium text-white">{msg.context.replace(/_/g, ' ')} · {msg.channel}</p>
                <StatusBadge variant="neutral" size="sm">{msg.tone}</StatusBadge>
              </div>
              <p className="text-sm text-alqia-secondary leading-relaxed italic">"{msg.template}"</p>
            </div>
          ))}
          {template.common_objections.length > 0 && (
            <div className="rounded-2xl border border-alqia-warning/15 bg-alqia-warning/4 p-5">
              <p className="text-xs font-medium text-alqia-warning mb-3">Objeciones frecuentes</p>
              <div className="flex flex-col gap-2">
                {template.common_objections.map((obj, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-alqia-warning mt-1.5 flex-shrink-0" />
                    <p className="text-xs text-alqia-secondary">{obj}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'scoring' && (
        <div className="flex flex-col gap-3">
          {template.scoring_rules.map((rule, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-white/6 bg-white/[0.02]">
              <div className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 font-data font-semibold text-xs',
                rule.weight >= 8 ? 'bg-alqia-success/15 text-alqia-success border border-alqia-success/20' :
                rule.weight >= 5 ? 'bg-alqia-copper/10 text-alqia-copper border border-alqia-copper/15' :
                'bg-alqia-risk/10 text-alqia-risk border border-alqia-risk/15',
              )}>
                {rule.weight > 0 ? `+${rule.weight}` : rule.weight}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{rule.signal}</p>
                <p className="text-xs text-alqia-secondary mt-0.5">{rule.description}</p>
              </div>
            </div>
          ))}
          <div className="rounded-2xl border border-alqia-info/15 bg-alqia-info/4 p-4 mt-2">
            <p className="text-xs font-medium text-alqia-info mb-2">Acciones IA recomendadas</p>
            <div className="flex flex-col gap-2">
              {template.ai_recommended_actions.map((action, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Zap size={10} className="text-alqia-info mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-alqia-secondary">{action}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'kpis' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {template.kpis.map(kpi => (
            <div key={kpi.key} className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target size={13} className="text-alqia-copper" />
                <p className="text-xs font-medium text-white">{kpi.label}</p>
              </div>
              <p className="text-xs text-alqia-muted mb-1">Unidad: {kpi.unit}</p>
              <p className="text-xs text-alqia-success font-medium">Benchmark: {kpi.benchmark}</p>
            </div>
          ))}
          {template.example_products.length > 0 && (
            <div className="sm:col-span-2 rounded-2xl border border-white/8 bg-white/[0.025] p-4">
              <p className="text-xs text-alqia-muted mb-3">Productos / Servicios de ejemplo</p>
              <div className="flex flex-wrap gap-2">
                {template.example_products.map((p, i) => (
                  <span key={i} className="text-[11px] text-alqia-secondary border border-white/10 px-2.5 py-1 rounded-full">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Lista de playbooks ──────────────────────────────────────────────────────
export function PlaybooksPage() {
  const { activeIndustry, activeCompany } = useAppStore()
  const [selected, setSelected] = useState<IndustryKey | null>(null)
  const [applied, setApplied] = useState<IndustryKey | null>(activeIndustry.industry_key)
  const [applyToast, setApplyToast] = useState(false)

  const handleApply = (key: IndustryKey) => {
    setApplied(key)
    logEvent('playbook.applied', { industry_key: key, company_id: activeCompany.id })
    setApplyToast(true)
    setTimeout(() => setApplyToast(false), 3000)
  }

  const allTemplates = Object.values(industryTemplates)

  if (selected) {
    const template = getTemplate(selected)
    return (
      <div className="p-6 max-w-[1000px] mx-auto">
        {applyToast && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-alqia-success/15 border border-alqia-success/25 text-alqia-success text-sm animate-fade-in">
            <Check size={14} />
            Plantilla aplicada a {activeCompany.name}
          </div>
        )}
        <PlaybookDetail
          template={template}
          onBack={() => setSelected(null)}
          onApply={handleApply}
          isActive={applied === selected}
        />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-[1000px] mx-auto">
      {applyToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-alqia-success/15 border border-alqia-success/25 text-alqia-success text-sm animate-fade-in">
          <Check size={14} />
          Plantilla aplicada
        </div>
      )}
      <PageHeader
        title="Playbooks"
        description="Estrategias comerciales probadas por industria. Aplica una plantilla para adaptar el pipeline, cadencias y scoring a tu vertical."
      />

      {/* Playbook activo */}
      {applied && (
        <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl border border-alqia-copper/20 bg-alqia-copper/5">
          <Check size={13} className="text-alqia-copper" />
          <p className="text-xs text-alqia-secondary">
            Plantilla activa en <span className="text-white font-medium">{activeCompany.name}</span>:{' '}
            <span className="text-alqia-copper">{getTemplate(applied).name}</span>
          </p>
          <button
            onClick={() => setSelected(applied)}
            className="ml-auto text-[10px] text-alqia-copper hover:text-white transition-colors flex items-center gap-0.5"
          >
            Ver detalle <ChevronRight size={9} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {allTemplates.map(tpl => {
          const Icon = industryIcons[tpl.industry_key]
          const isApplied = applied === tpl.industry_key
          return (
            <div
              key={tpl.industry_key}
              className={cn(
                'group rounded-2xl border p-5 transition-all cursor-pointer',
                isApplied
                  ? 'border-alqia-copper/30 bg-alqia-copper/5'
                  : 'border-white/8 bg-white/[0.025] hover:border-white/15 hover:bg-white/[0.04]',
              )}
              onClick={() => setSelected(tpl.industry_key)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center',
                  isApplied ? 'bg-alqia-copper/15 border border-alqia-copper/30' : 'bg-white/[0.05] border border-white/8 group-hover:bg-alqia-copper/8 group-hover:border-alqia-copper/20',
                )}>
                  <Icon size={15} className={isApplied ? 'text-alqia-copper' : 'text-alqia-muted group-hover:text-alqia-copper'} />
                </div>
                {isApplied && (
                  <div className="flex items-center gap-1 text-[9px] text-alqia-copper font-medium uppercase tracking-wider">
                    <Check size={9} />
                    Activo
                  </div>
                )}
              </div>

              <h3 className="text-sm font-medium text-white mb-1">{tpl.name}</h3>
              <p className="text-[11px] text-alqia-muted leading-relaxed mb-3 line-clamp-2">{tpl.commercial_description}</p>

              <div className="flex items-center gap-3 text-[10px] text-alqia-muted border-t border-white/6 pt-3">
                <span>{tpl.stages.length} etapas</span>
                <span>{tpl.cadence_templates.length} cadencias</span>
                <span>{tpl.scoring_rules.length} reglas IA</span>
              </div>

              <button className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] text-alqia-muted hover:text-white border border-white/8 hover:border-white/15 transition-all">
                <BookOpen size={11} />
                Ver playbook
                <ChevronRight size={10} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

