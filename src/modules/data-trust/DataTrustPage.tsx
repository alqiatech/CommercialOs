import { GlassCard } from '@/components/ui/GlassCard'
import { PageHeader } from '@/components/layout/PageHeader'
import { ActionButton } from '@/components/ui/ActionButton'
import { MetricCard } from '@/components/ui/MetricCard'
import { ErrorState, LoadingState } from '@/components/ui/States'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { mockContacts } from '@/data'
import { fetchContacts } from '@/lib/apiClient'
import { useAppStore } from '@/store/appStore'
import { logEvent } from '@/lib/utils'
import { ShieldCheck, AlertCircle, Copy, Mail, Phone, Zap } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

export function DataTrustPage() {
  const { activeCompany } = useAppStore()
  const realCompanyId = activeCompany.db_company_id

  const contactsQuery = useQuery({
    queryKey: ['contacts', realCompanyId, 'data-trust'],
    queryFn: () => fetchContacts(realCompanyId as string),
    enabled: Boolean(realCompanyId),
  })

  const contacts = contactsQuery.data?.data?.length ? contactsQuery.data.data : mockContacts
  const avgScore = contacts.length ? Math.round(contacts.reduce((s, c) => s + c.data_trust_score, 0) / contacts.length) : 0
  const clean = contacts.filter(c => c.data_trust_score >= 70).length
  const needsReview = contacts.filter(c => c.data_trust_score < 50).length
  const withEmail = contacts.filter(c => c.email).length
  const withPhone = contacts.filter(c => c.phone).length
  const withWhatsApp = contacts.filter(c => c.whatsapp_phone).length
  const duplicateEstimate = Math.max(0, contacts.length - new Set(contacts.map(c => `${c.email ?? ''}|${c.normalized_phone ?? ''}`)).size)

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <PageHeader
        title="Data Trust Center"
        description="Calidad de datos antes de gastar en comunicación"
        actions={
          <ActionButton
            variant="copper"
            size="sm"
            icon={<Zap size={13} />}
            onClick={() => logEvent('data.email_external_validation_requested')}
          >
            Validar con API externa
          </ActionButton>
        }
      />

      {/* Health overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <GlassCard variant="elevated" className="flex flex-col items-center gap-2 py-5">
          <ScoreRing value={avgScore} size="lg" />
          <p className="text-xs text-alqia-muted">Score promedio de la base</p>
        </GlassCard>
        <MetricCard id="clean" title="Contactos limpios" value={clean} severity="success"
          trendLabel="score ≥ 70" icon={<ShieldCheck size={14} />} />
        <MetricCard id="review" title="Requieren revisión" value={needsReview} severity="warning"
          trendLabel="score < 50" icon={<AlertCircle size={14} />} />
        <MetricCard id="dupes" title="Duplicados estimados" value={duplicateEstimate} severity="risk"
          icon={<Copy size={14} />}
          actionLabel="Revisar duplicados"
          onAction={() => logEvent('data.duplicate.merge_opened')} />
      </div>

      {/* Cards de problemas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <GlassCard variant="warning" className="flex items-center gap-3">
          <Mail size={18} className="text-alqia-warning" />
          <div>
            <p className="text-sm font-medium text-white">{Math.max(0, contacts.length - withEmail)} sin email</p>
            <p className="text-xs text-alqia-secondary">No contactables por correo</p>
          </div>
          <ActionButton variant="ghost" size="sm" className="ml-auto">Validar</ActionButton>
        </GlassCard>
        <GlassCard variant="warning" className="flex items-center gap-3">
          <Phone size={18} className="text-alqia-warning" />
          <div>
            <p className="text-sm font-medium text-white">{Math.max(0, contacts.length - withPhone)} teléfonos sin validar</p>
            <p className="text-xs text-alqia-secondary">Carrier no confirmado</p>
          </div>
          <ActionButton variant="ghost" size="sm" className="ml-auto">Validar</ActionButton>
        </GlassCard>
        <GlassCard variant="danger" className="flex items-center gap-3">
          <Copy size={18} className="text-alqia-risk" />
          <div>
            <p className="text-sm font-medium text-white">{duplicateEstimate} duplicados confirmados</p>
            <p className="text-xs text-alqia-secondary">Listos para fusionar</p>
          </div>
          <ActionButton variant="ghost" size="sm" className="ml-auto">Fusionar</ActionButton>
        </GlassCard>
      </div>

      {/* Tabla de contactos con score */}
      {contactsQuery.isLoading && realCompanyId ? (
        <LoadingState rows={4} />
      ) : contactsQuery.isError && realCompanyId ? (
        <ErrorState message="No se pudieron cargar los contactos reales." onRetry={() => contactsQuery.refetch()} />
      ) : (
        <GlassCard padding="none" className="overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.07]">
            <p className="text-xs font-medium text-alqia-secondary uppercase tracking-wide">Contactos — Vista de calidad</p>
          </div>
          <table className="w-full font-data text-sm">
            <thead>
              <tr className="border-b border-white/[0.05]">
                {['Contacto', 'Email', 'Teléfono', 'Data Trust', 'WhatsApp', 'Estado', 'Acción sugerida'].map(h => (
                  <th key={h} className="text-left text-[11px] text-alqia-muted font-medium px-4 py-2.5 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contacts.map(contact => (
                <tr key={contact.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-xs font-sans text-white">{contact.full_name}</td>
                  <td className="px-4 py-3 text-xs text-alqia-secondary">{contact.email ?? <span className="text-alqia-risk">Sin email</span>}</td>
                  <td className="px-4 py-3 text-xs text-alqia-secondary font-data">{contact.normalized_phone ?? contact.phone ?? <span className="text-alqia-risk">Sin teléfono</span>}</td>
                  <td className="px-4 py-3"><ScoreRing value={contact.data_trust_score} size="sm" /></td>
                  <td className="px-4 py-3">
                    <StatusBadge variant={contact.whatsapp_phone ? 'success' : 'neutral'} size="sm">
                      {contact.whatsapp_phone ? 'Disponible' : 'Desconocido'}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge variant={contact.status === 'active' ? 'success' : 'risk'} size="sm">{contact.status}</StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-xs text-alqia-secondary">
                    {contact.data_trust_score < 50 ? 'Validar datos' : contact.data_trust_score < 70 ? 'Enriquecer' : 'Listo para cadencia'}
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
