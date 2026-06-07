import { EmptyState } from '@/components/ui/States'
import { PageHeader } from '@/components/layout/PageHeader'
import { MessageSquare } from 'lucide-react'
export function CommunicationsPage() {
  return (
    <div className="p-6">
      <PageHeader title="Comunicaciones" description="Bandeja unificada WhatsApp · Email · Llamadas" />
      <EmptyState icon={<MessageSquare size={24} />} title="Módulo en construcción"
        description="La bandeja unificada estará disponible en la siguiente iteración." />
    </div>
  )
}
