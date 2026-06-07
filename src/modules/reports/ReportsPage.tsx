import { GlassCard } from '@/components/ui/GlassCard'
import { PageHeader } from '@/components/layout/PageHeader'
import { MetricCard } from '@/components/ui/MetricCard'
import { ActionButton } from '@/components/ui/ActionButton'
import { useAppStore } from '@/store/appStore'
import { formatCurrency } from '@/lib/utils'
import { BarChart2, Download } from 'lucide-react'
import { logEvent } from '@/lib/utils'

export function ReportsPage() {
  const { activeOpportunities, activeIndustry, activeCompany } = useAppStore()
  const voc = activeIndustry.vocabulary

  const won = activeOpportunities.filter(o => o.status === 'won')
  const lost = activeOpportunities.filter(o => o.status === 'lost')
  const open = activeOpportunities.filter(o => o.status === 'open')
  const wonRevenue = won.reduce((s, o) => s + (o.estimated_value ?? 0), 0)
  const pipeline = open.reduce((s, o) => s + (o.estimated_value ?? 0) * (o.probability / 100), 0)

  const byOwner = [{ name: 'Equipo comercial', opps: open.length, won: won.length, value: wonRevenue }]

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <PageHeader
        title="Reportes"
        description="Analítica comercial básica"
        actions={
          <ActionButton variant="ghost" size="sm" icon={<Download size={13} />}
            onClick={() => logEvent('report.export_requested')}>
            Exportar
          </ActionButton>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard id="won" title="Ingresos ganados" value={wonRevenue} severity="success" trend={24} />
        <MetricCard id="pipeline" title="Pipeline ponderado" value={pipeline} severity="info" />
        <MetricCard id="won_count" title="Oportunidades ganadas" value={won.length} severity="success" />
        <MetricCard id="lost" title="Perdidas" value={lost.length} severity="risk"
          trendLabel={`${Math.round(lost.length / (won.length + lost.length + 1) * 100)}% tasa de pérdida`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Por vendedor */}
        <GlassCard>
          <h3 className="text-sm font-medium text-white mb-4">Rendimiento por vendedor</h3>
          <div className="flex flex-col gap-3">
            {byOwner.map(rep => (
              <div key={rep.name} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-alqia-copper/20 flex items-center justify-center text-alqia-copper text-[11px] font-medium flex-shrink-0">
                  {rep.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-white">{rep.name}</p>
                    <p className="text-xs font-data text-alqia-success">{formatCurrency(rep.value)}</p>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className="h-full bg-alqia-copper/60 rounded-full" style={{ width: `${Math.min(rep.opps * 20, 100)}%` }} />
                  </div>
                  <p className="text-[10px] text-alqia-muted mt-0.5">{rep.opps} opps · {rep.won} ganadas</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Por etapa */}
        <GlassCard>
          <h3 className="text-sm font-medium text-white mb-4">Distribución del pipeline</h3>
          <div className="flex flex-col gap-2">
            {[
              { label: 'Lead nuevo / Validado', count: open.filter(o => ['stg_001','stg_002'].includes(o.stage_id)).length, color: 'bg-alqia-info/50' },
              { label: 'Contactado / Interesado', count: open.filter(o => ['stg_003','stg_004'].includes(o.stage_id)).length, color: 'bg-alqia-warning/50' },
              { label: 'Cita / Cotización', count: open.filter(o => ['stg_005','stg_006'].includes(o.stage_id)).length, color: 'bg-alqia-copper/50' },
              { label: 'Financiamiento / Cierre', count: open.filter(o => ['stg_007','stg_008'].includes(o.stage_id)).length, color: 'bg-alqia-success/50' },
            ].map(row => (
              <div key={row.label} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${row.color}`} />
                <p className="text-xs text-alqia-secondary flex-1">{row.label}</p>
                <p className="text-xs font-data text-white">{row.count}</p>
                <div className="w-24 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${row.color}`} style={{ width: `${Math.min(row.count * 30, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
