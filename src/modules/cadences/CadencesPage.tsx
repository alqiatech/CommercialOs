import { GlassCard } from '@/components/ui/GlassCard'
import { PageHeader } from '@/components/layout/PageHeader'
import { ActionButton } from '@/components/ui/ActionButton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { mockCadences } from '@/data'
import { logEvent } from '@/lib/utils'
import { GitBranch, Play, Pause, Plus, MessageCircle, Phone, Mail } from 'lucide-react'

const channelIcons = { whatsapp: MessageCircle, phone: Phone, email: Mail } as const

export function CadencesPage() {
  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <PageHeader
        title="Cadencias"
        description="Secuencias de seguimiento multicanal"
        actions={
          <ActionButton variant="copper" size="sm" icon={<Plus size={13} />}>
            Crear cadencia
          </ActionButton>
        }
      />

      <div className="flex flex-col gap-4">
        {mockCadences.map(cadence => (
          <GlassCard key={cadence.id} variant="elevated">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-alqia-copper/10 flex items-center justify-center flex-shrink-0">
                  <GitBranch size={16} className="text-alqia-copper" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium text-white">{cadence.name}</h3>
                    <StatusBadge variant={cadence.status === 'active' ? 'success' : 'warning'} size="sm" dot>
                      {cadence.status}
                    </StatusBadge>
                  </div>
                  <p className="text-xs text-alqia-secondary">{cadence.description}</p>

                  {/* Pasos */}
                  {cadence.steps && cadence.steps.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-3">
                      {cadence.steps.map((step, i) => {
                        const channelKey = (step.channel === 'phone' ? 'phone' : step.channel === 'email' ? 'email' : 'whatsapp') as keyof typeof channelIcons
                        const Icon = channelIcons[channelKey] ?? MessageCircle
                        return (
                          <div key={step.id} className="flex items-center gap-1">
                            <div className="w-7 h-7 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center" title={`Día ${step.delay_amount}`}>
                              <Icon size={11} className="text-alqia-secondary" />
                            </div>
                            {i < cadence.steps!.length - 1 && <div className="w-3 h-px bg-white/10" />}
                          </div>
                        )
                      })}
                      <span className="text-[11px] text-alqia-muted ml-1">{cadence.steps.length} pasos</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Métricas y acciones */}
              <div className="flex items-start gap-6">
                {cadence.enrollment_count !== undefined && cadence.enrollment_count > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-white font-data font-medium">{cadence.enrollment_count}</p>
                    <p className="text-[10px] text-alqia-muted">inscritos</p>
                  </div>
                )}
                {cadence.reply_rate !== undefined && cadence.reply_rate > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-alqia-success font-data font-medium">{Math.round(cadence.reply_rate * 100)}%</p>
                    <p className="text-[10px] text-alqia-muted">respuesta</p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <ActionButton
                    variant="outline"
                    size="sm"
                    icon={cadence.status === 'active' ? <Pause size={12} /> : <Play size={12} />}
                    onClick={() => logEvent(cadence.status === 'active' ? 'cadence.paused' : 'cadence.activated', { id: cadence.id })}
                    className={cadence.status === 'active'
                      ? 'bg-alqia-warning/10 text-alqia-warning border-alqia-warning/20'
                      : 'bg-alqia-success/10 text-alqia-success border-alqia-success/20'}
                  >
                    {cadence.status === 'active' ? 'Pausar' : 'Activar'}
                  </ActionButton>
                  <ActionButton variant="ghost" size="sm">Editar</ActionButton>
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
