import { GlassCard } from '@/components/ui/GlassCard'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States'
import { ActionButton } from '@/components/ui/ActionButton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { useAppStore } from '@/store/appStore'
import { formatCurrency, formatRelativeDate } from '@/lib/utils'
import { fetchOpportunities } from '@/lib/apiClient'
import { Target, Filter, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

export function OpportunitiesPage() {
  const navigate = useNavigate()
  const { activeCompany, activeOpportunities, activeContacts, activeStages, activeIndustry, currentUser } = useAppStore()
  const [view, setView] = useState<'list' | 'pipeline'>('list')
  const voc = activeIndustry.vocabulary
  const realCompanyId = activeCompany.db_company_id
  const ownerFilter = currentUser.role_type === 'sales_rep' ? currentUser.id : undefined

  const fallbackOpps = activeOpportunities
    .filter(o => o.status === 'open')
    .map(o => ({
      ...o,
      contact: activeContacts.find(c => c.id === o.contact_id),
      stage: activeStages.find(s => s.id === o.stage_id),
    }))
    .sort((a, b) => b.urgency_score - a.urgency_score)

  const opportunitiesQuery = useQuery({
    queryKey: ['opportunities', realCompanyId, ownerFilter],
    queryFn: () => fetchOpportunities(realCompanyId as string, ownerFilter ? { owner_user_id: ownerFilter } : undefined),
    enabled: Boolean(realCompanyId),
  })

  const opps = opportunitiesQuery.data?.data?.length
    ? opportunitiesQuery.data.data
    : fallbackOpps

  const stageColors: Record<string, string> = Object.fromEntries(
    activeStages.map(s => [
      s.name,
      s.stage_type === 'won' ? 'success'
      : s.stage_type === 'lost' ? 'risk'
      : s.stage_type === 'closing' || s.stage_type === 'negotiation' ? 'copper'
      : s.stage_type === 'proposal' ? 'warning'
      : 'neutral',
    ])
  )

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title={`${voc.opportunity_label}s`}
        description={`${opps.length} ${voc.opportunity_label.toLowerCase()}s activas en ${activeIndustry.pipeline_name}`}
        actions={
          <>
            <div className="flex items-center bg-white/[0.05] border border-white/10 rounded-xl p-0.5">
              {(['list', 'pipeline'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1 text-xs rounded-lg transition-all ${view === v ? 'bg-white/10 text-white' : 'text-alqia-muted hover:text-white'}`}
                >
                  {v === 'list' ? 'Lista' : 'Pipeline'}
                </button>
              ))}
            </div>
            <ActionButton variant="ghost" size="sm" icon={<Filter size={13} />}>Filtros</ActionButton>
            <ActionButton variant="copper" size="sm" icon={<Plus size={13} />}>Nueva oportunidad</ActionButton>
          </>
        }
      />

      {opportunitiesQuery.isLoading && realCompanyId ? (
        <LoadingState rows={4} />
      ) : opportunitiesQuery.isError && realCompanyId ? (
        <ErrorState message="No se pudieron cargar las oportunidades reales." onRetry={() => opportunitiesQuery.refetch()} />
      ) : opps.length === 0 ? (
        <EmptyState
          icon={<Target size={24} />}
          title="Sin oportunidades"
          description="Importa leads o crea una oportunidad manual para activar el radar comercial."
          action="Importar leads"
          onAction={() => navigate('/app/importaciones')}
        />
      ) : (
        <GlassCard padding="none" className="overflow-hidden">
          <table className="w-full font-data text-sm">
            <thead>
              <tr className="border-b border-white/[0.07]">
                {['Contacto', voc.product_label, 'Etapa', 'Intención', 'Datos', 'Valor', 'Último contacto', ''].map(h => (
                  <th key={h} className="text-left text-[11px] text-alqia-muted font-medium px-4 py-3 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {opps.map((opp) => (
                <tr
                  key={opp.id}
                  onClick={() => navigate(`/app/oportunidades/${opp.id}`)}
                  className="border-b border-white/[0.04] hover:bg-white/[0.03] cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-alqia-copper/20 flex items-center justify-center text-alqia-copper text-[11px] font-medium flex-shrink-0">
                        {opp.contact?.full_name.split(' ').map(n => n[0]).join('').slice(0, 2) ?? '?'}
                      </div>
                      <div>
                        <p className="text-xs text-white font-sans">{opp.contact?.full_name ?? '—'}</p>
                        <p className="text-[10px] text-alqia-muted">{opp.contact?.city ?? '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-alqia-secondary">{opp.product_interest ?? '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge variant={(stageColors[opp.stage?.name ?? ''] ?? 'neutral') as never} size="sm">
                      {opp.stage?.name ?? '—'}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3"><ScoreRing value={opp.lead_intent_score} size="sm" /></td>
                  <td className="px-4 py-3"><ScoreRing value={opp.data_trust_score} size="sm" /></td>
                  <td className="px-4 py-3 text-xs text-white">{formatCurrency(opp.estimated_value ?? 0)}</td>
                  <td className="px-4 py-3 text-xs text-alqia-secondary">
                    {opp.last_contact_at ? formatRelativeDate(opp.last_contact_at) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-alqia-secondary">
                    {opp.owner_user_id ? 'Asignada' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}
    </div>
  )
}
