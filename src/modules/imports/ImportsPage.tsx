import { GlassCard } from '@/components/ui/GlassCard'
import { PageHeader } from '@/components/layout/PageHeader'
import { ActionButton } from '@/components/ui/ActionButton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { MetricCard } from '@/components/ui/MetricCard'
import { ErrorState, LoadingState } from '@/components/ui/States'
import { mockImportBatches } from '@/data'
import { fetchImportBatches } from '@/lib/apiClient'
import { useAppStore } from '@/store/appStore'
import { formatRelativeDate } from '@/lib/utils'
import { Upload, CheckCircle, AlertCircle, Copy, FileText, Plus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logEvent } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'

interface DisplayImportBatch {
  id: string
  file_name: string
  status: string
  total_rows: number
  valid_rows: number
  invalid_rows: number
  duplicate_rows: number
  created_at: string
}

export function ImportsPage() {
  const navigate = useNavigate()
  const { activeCompany } = useAppStore()
  const [dragging, setDragging] = useState(false)
  const realCompanyId = activeCompany.db_company_id

  const importBatchesQuery = useQuery({
    queryKey: ['import-batches', realCompanyId],
    queryFn: () => fetchImportBatches(realCompanyId as string),
    enabled: Boolean(realCompanyId),
  })

  const importBatches: DisplayImportBatch[] = (importBatchesQuery.data?.data?.length ? importBatchesQuery.data.data : mockImportBatches)
    .map((batch) => ({
      id: batch.id,
      file_name: batch.file_name ?? ('filename' in batch ? (batch.filename ?? 'Importación') : 'Importación'),
      status: batch.status,
      total_rows: batch.total_rows ?? 0,
      valid_rows: batch.valid_rows ?? ('summary' in batch ? Number(batch.summary?.contacts_created ?? 0) : Number(batch.contacts_created ?? 0)),
      invalid_rows: batch.invalid_rows ?? 0,
      duplicate_rows: batch.duplicate_rows ?? 0,
      created_at: batch.created_at,
    }))
  const totalImported = importBatches.reduce((sum, batch) => sum + (batch.total_rows ?? 0), 0)
  const validImported = importBatches.reduce((sum, batch) => sum + (batch.valid_rows ?? 0), 0)
  const duplicateImported = importBatches.reduce((sum, batch) => sum + (batch.duplicate_rows ?? 0), 0)
  const invalidImported = importBatches.reduce((sum, batch) => sum + (batch.invalid_rows ?? 0), 0)

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    logEvent('import.file_selected')
    navigate('/app/importaciones/nuevo')
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <PageHeader
        title="Importaciones"
        description="Carga leads desde CSV o Excel"
        actions={
          <ActionButton variant="copper" size="sm" icon={<Plus size={13} />} onClick={() => navigate('/app/importaciones/nuevo')}>
            Nueva importación
          </ActionButton>
        }
      />

      {/* KPIs de historial */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard id="total" title="Registros importados" value={totalImported} />
        <MetricCard id="valid" title="Contactos creados" value={validImported} severity="success" />
        <MetricCard id="dupes" title="Duplicados detectados" value={duplicateImported} severity="warning" />
        <MetricCard id="invalid" title="Inválidos" value={invalidImported} severity="risk" />
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleFileDrop}
        onClick={() => navigate('/app/importaciones/nuevo')}
        className={`border-2 border-dashed rounded-xl2 p-10 text-center cursor-pointer transition-all mb-6 ${
          dragging
            ? 'border-alqia-copper/50 bg-alqia-copper/5'
            : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
        }`}
      >
        <Upload size={32} className="mx-auto text-alqia-muted mb-3" />
        <p className="text-sm text-white font-medium">Arrastra tu archivo aquí</p>
        <p className="text-xs text-alqia-muted mt-1">CSV o Excel · Máximo 50 MB</p>
        <ActionButton variant="copper" size="sm" className="mt-4">
          Seleccionar archivo
        </ActionButton>
      </div>

      {/* Historial de lotes */}
      <h2 className="text-sm font-medium text-white mb-3">Historial de importaciones</h2>
      {importBatchesQuery.isLoading && realCompanyId ? (
        <LoadingState rows={3} />
      ) : importBatchesQuery.isError && realCompanyId ? (
        <ErrorState message="No se pudieron cargar las importaciones reales." onRetry={() => importBatchesQuery.refetch()} />
      ) : (
        <div className="flex flex-col gap-3">
          {importBatches.map(batch => (
            <GlassCard key={batch.id} variant="interactive" className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-alqia-copper/10 flex items-center justify-center flex-shrink-0">
                <FileText size={16} className="text-alqia-copper" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white truncate">{batch.file_name}</p>
                  <StatusBadge variant={batch.status === 'completed' ? 'success' : 'warning'} size="sm">
                    {batch.status}
                  </StatusBadge>
                </div>
                <p className="text-xs text-alqia-secondary mt-0.5">
                  {formatRelativeDate(batch.created_at)} · {(batch.total_rows ?? 0).toLocaleString()} registros
                </p>
                <div className="flex items-center gap-4 mt-2 text-[11px]">
                  <span className="flex items-center gap-1 text-alqia-success"><CheckCircle size={10} />{batch.valid_rows.toLocaleString()} válidos</span>
                  <span className="flex items-center gap-1 text-alqia-risk"><AlertCircle size={10} />{(batch.invalid_rows ?? 0).toLocaleString()} inválidos</span>
                  <span className="flex items-center gap-1 text-alqia-warning"><Copy size={10} />{(batch.duplicate_rows ?? 0).toLocaleString()} duplicados</span>
                </div>
              </div>
              <ActionButton variant="ghost" size="sm">Ver resultado</ActionButton>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}
