import { useState, useRef, useCallback } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { PageHeader } from '@/components/layout/PageHeader'
import { ActionButton } from '@/components/ui/ActionButton'
import { useAppStore } from '@/store/appStore'
import { previewImport, processImport } from '@/lib/apiClient'
import type { PreviewResult, ProcessResult } from '@/lib/apiClient'
import { getTemplate } from '@/data/industryTemplates'
import {
  Upload, ArrowRight, ArrowLeft, CheckCircle, AlertCircle,
  FileText, Loader2, Users, Phone, Mail, Zap, Copy,
} from 'lucide-react'
import { logEvent } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

// ─────────────────────────────────────────────────────────────────────────────
// DESTINATION_FIELD_LABELS — labels de campos destino para el mapeo
// ─────────────────────────────────────────────────────────────────────────────
const DEST_LABELS: Record<string, string> = {
  full_name: 'Nombre completo',
  first_name: 'Nombre',
  last_name: 'Apellido',
  email: 'Correo electrónico',
  phone: 'Teléfono',
  whatsapp_phone: 'WhatsApp',
  city: 'Ciudad',
  state: 'Estado',
  country: 'País',
  company: 'Empresa',
  product_interest: 'Producto / Interés',
  source: 'Fuente',
  campaign: 'Campaña',
  created_at: 'Fecha de captura',
  owner: 'Responsable',
  comments: 'Comentarios',
  consent_status: 'Consentimiento',
  estimated_value: 'Valor estimado',
  skip: '— Ignorar columna —',
}

const DEST_OPTIONS = Object.entries(DEST_LABELS)

type Step = 'upload' | 'mapping' | 'processing' | 'result'

interface ClassificationColors {
  ready_for_cadence: string
  needs_review: string
  duplicate_candidate: string
  invalid_email: string
  invalid_phone: string
  no_contact_channel: string
  do_not_contact: string
  [key: string]: string
}

const CLASS_COLORS: ClassificationColors = {
  ready_for_cadence: 'text-alqia-success',
  needs_review: 'text-alqia-warning',
  duplicate_candidate: 'text-alqia-copper',
  invalid_email: 'text-alqia-risk',
  invalid_phone: 'text-alqia-risk',
  no_contact_channel: 'text-alqia-muted',
  do_not_contact: 'text-alqia-risk',
}

const CLASS_LABELS: Record<string, string> = {
  ready_for_cadence: 'Listo para cadencia',
  needs_review: 'Requiere revisión',
  duplicate_candidate: 'Posible duplicado',
  invalid_email: 'Email inválido',
  invalid_phone: 'Teléfono inválido',
  no_contact_channel: 'Sin canal de contacto',
  do_not_contact: 'No contactar',
}

export function ImportWizard() {
  const navigate = useNavigate()
  const { activeCompany, companies } = useAppStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<PreviewResult | null>(null)
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ProcessResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [selectedCompanyId, setSelectedCompanyId] = useState(activeCompany.id)

  const selectedCompany = companies.find(company => company.id === selectedCompanyId) ?? activeCompany
  const selectedIndustry = getTemplate(selectedCompany.industry_key)
  const targetCompanyRef = selectedCompany.db_company_id ?? selectedCompany.id

  // ── Paso 1: Seleccionar / Drop archivo ────────────────────────────────
  const handleFile = useCallback(async (f: File) => {
    if (!/\.(csv|xlsx|xls)$/i.test(f.name)) {
      setError('Solo se permiten archivos CSV, XLS o XLSX')
      return
    }
    setFile(f)
    setError(null)
    setLoading(true)
    logEvent('import.file_selected', { name: f.name, size: f.size, company_id: targetCompanyRef })
    try {
      const result = await previewImport(f)
      setPreview(result)
      setMapping(result.suggestedMapping)
      setStep('mapping')
    } catch (err) {
      setError(`Error al leer el archivo: ${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
  }, [targetCompanyRef])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  // ── Paso 2: Confirmar mapeo y procesar ───────────────────────────────
  const handleProcess = async () => {
    if (!preview) return
    if (!targetCompanyRef) {
      setError('Selecciona una unidad destino antes de procesar la importación.')
      return
    }
    setLoading(true)
    setStep('processing')
    setError(null)
    logEvent('import.processing_started', { rows: preview.totalRows, company_id: targetCompanyRef })
    try {
      const res = await processImport(
        preview.rows,
        mapping,
        targetCompanyRef,
        file?.name,
        undefined,
        selectedIndustry.industry_key,
      )
      setResult(res)
      setStep('result')
      logEvent('import.completed', { total: res.metrics.total, ready: res.metrics.ready_for_cadence })
    } catch (err) {
      setError(`Error al procesar: ${(err as Error).message}`)
      setStep('mapping')
    } finally {
      setLoading(false)
    }
  }

  // ── Render pasos ─────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-[1100px] mx-auto">
      <PageHeader
        title="Nueva importación"
        description="Sube un archivo CSV o Excel para importar prospectos"
        actions={
          <ActionButton variant="ghost" size="sm" icon={<ArrowLeft size={13} />} onClick={() => navigate('/app/importaciones')}>
            Volver
          </ActionButton>
        }
      />

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-6 text-xs">
        {(['upload', 'mapping', 'processing', 'result'] as Step[]).map((s, i) => {
          const labels: Record<Step, string> = { upload: '1. Subir archivo', mapping: '2. Mapear columnas', processing: '3. Procesando', result: '4. Resultados' }
          const isActive = step === s
          const isDone = ['upload', 'mapping', 'processing'].indexOf(s) < ['upload', 'mapping', 'processing', 'result'].indexOf(step)
          return (
            <span key={s} className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
              isActive ? 'bg-alqia-copper/20 text-alqia-copper font-medium' :
              isDone ? 'text-alqia-success' : 'text-alqia-muted'
            }`}>
              {isDone && <CheckCircle size={12} />}
              {labels[s]}
              {i < 3 && <span className="mx-1 text-alqia-muted/40">›</span>}
            </span>
          )
        })}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-alqia-risk/10 border border-alqia-risk/30 rounded-xl flex items-center gap-2 text-sm text-alqia-risk">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* ── PASO 1: Upload ─────────────────────────────────────────── */}
      {step === 'upload' && (
        <GlassCard>
          <div className="mb-4 p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
            <p className="text-xs text-alqia-muted mb-1">Unidad destino</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-white font-medium">{selectedCompany.name}</p>
                <p className="text-xs text-alqia-secondary">{selectedIndustry.name}</p>
              </div>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-alqia-copper/40"
              >
                {companies.map(company => (
                  <option key={company.id} value={company.id} className="bg-alqia-dark text-white">
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
              dragging ? 'border-alqia-copper/60 bg-alqia-copper/5' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
            }`}
          >
            {loading ? (
              <Loader2 size={36} className="mx-auto text-alqia-copper mb-3 animate-spin" />
            ) : (
              <Upload size={36} className="mx-auto text-alqia-muted mb-3" />
            )}
            <p className="text-sm text-white font-medium mb-1">
              {loading ? 'Leyendo archivo...' : 'Arrastra tu archivo aquí o haz clic para seleccionar'}
            </p>
            <p className="text-xs text-alqia-muted">CSV o Excel · Máximo 10 MB · Hasta 5,000 registros</p>
          </div>

          <div className="mt-4 flex items-start gap-2 p-3 bg-alqia-info/5 border border-alqia-info/20 rounded-xl">
            <FileText size={14} className="text-alqia-info mt-0.5 flex-shrink-0" />
            <div className="text-xs text-alqia-secondary">
              <p className="font-medium text-white mb-1">Campos que detectamos automáticamente</p>
              <p>Nombre, email, teléfono, ciudad, empresa, producto/interés, fuente, fecha, comentarios y consentimiento.</p>
              <p className="mt-1">Después de subir el archivo podrás revisar y corregir el mapeo de columnas antes de procesar en {selectedCompany.name}.</p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* ── PASO 2: Mapping ────────────────────────────────────────── */}
      {step === 'mapping' && preview && (
        <div className="flex flex-col gap-4">
          {/* Info del archivo */}
          <div className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
            <FileText size={18} className="text-alqia-copper flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-white">{file?.name}</p>
              <p className="text-xs text-alqia-muted">{preview.totalRows.toLocaleString()} registros detectados · {preview.headers.length} columnas</p>
            </div>
            {preview.errors.length > 0 && (
              <div className="ml-auto flex items-center gap-1 text-xs text-alqia-warning">
                <AlertCircle size={12} />
                {preview.errors.length} advertencia{preview.errors.length > 1 ? 's' : ''}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
              <p className="text-xs text-alqia-muted mb-1">Unidad destino</p>
              <p className="text-sm text-white font-medium">{selectedCompany.name}</p>
              <p className="text-xs text-alqia-secondary">{selectedIndustry.name}</p>
            </div>
            <div className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
              <p className="text-xs text-alqia-muted mb-1">Vista previa</p>
              <p className="text-sm text-white font-medium">{Math.min(preview.previewRows.length, 20)} filas visibles</p>
              <p className="text-xs text-alqia-secondary">El procesamiento usará los {preview.totalRows.toLocaleString()} registros completos.</p>
            </div>
          </div>

          {/* Mapeo de columnas */}
          <GlassCard>
            <h3 className="text-sm font-medium text-white mb-4">Mapeo de columnas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {preview.headers.map(header => (
                <div key={header} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-alqia-muted truncate mb-1">{header}</p>
                    <p className="text-xs text-white truncate">
                      {preview.previewRows[0]?.[header] || <span className="text-alqia-muted/40 italic">vacío</span>}
                    </p>
                  </div>
                  <ArrowRight size={12} className="text-alqia-muted flex-shrink-0" />
                  <select
                    value={mapping[header] ?? 'skip'}
                    onChange={(e) => setMapping(m => ({ ...m, [header]: e.target.value }))}
                    className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-alqia-copper/40 appearance-none"
                  >
                    {DEST_OPTIONS.map(([val, label]) => (
                      <option key={val} value={val} className="bg-alqia-dark text-white">{label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Preview de primeras filas */}
          <GlassCard>
            <h3 className="text-sm font-medium text-white mb-3">Primeras 20 filas</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    {preview.headers.slice(0, 8).map(h => (
                      <th key={h} className="text-left text-alqia-muted font-normal pb-2 pr-4 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.previewRows.slice(0, 20).map((row, i) => (
                    <tr key={i} className="border-t border-white/[0.04]">
                      {preview.headers.slice(0, 8).map(h => (
                        <td key={h} className="py-1.5 pr-4 text-alqia-secondary truncate max-w-[120px]">
                          {row[h] || <span className="text-alqia-muted/30">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          <div className="flex items-center justify-between">
            <ActionButton variant="ghost" size="sm" icon={<ArrowLeft size={13} />} onClick={() => setStep('upload')}>
              Cambiar archivo
            </ActionButton>
            <ActionButton variant="copper" size="sm" icon={<Zap size={13} />} onClick={handleProcess}>
              Procesar {preview.totalRows.toLocaleString()} registros
            </ActionButton>
          </div>
        </div>
      )}

      {/* ── PASO 3: Procesando ────────────────────────────────────── */}
      {step === 'processing' && (
        <GlassCard className="text-center py-16">
          <Loader2 size={40} className="mx-auto text-alqia-copper animate-spin mb-4" />
          <p className="text-sm font-medium text-white">Limpiando y analizando registros...</p>
          <p className="text-xs text-alqia-muted mt-2">Normalizando emails y teléfonos · Detectando duplicados · Calculando Data Trust Score</p>
        </GlassCard>
      )}

      {/* ── PASO 4: Resultado ─────────────────────────────────────── */}
      {step === 'result' && result && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl text-center">
              <p className="text-2xl font-data font-bold text-white">{result.metrics.total.toLocaleString()}</p>
              <p className="text-xs text-alqia-muted mt-1">Total procesados</p>
            </div>
            <div className="p-4 bg-alqia-success/5 border border-alqia-success/20 rounded-xl text-center">
              <p className="text-2xl font-data font-bold text-alqia-success">{result.metrics.ready_for_cadence.toLocaleString()}</p>
              <p className="text-xs text-alqia-muted mt-1">Listos para cadencia</p>
            </div>
            <div className="p-4 bg-alqia-warning/5 border border-alqia-warning/20 rounded-xl text-center">
              <p className="text-2xl font-data font-bold text-alqia-warning">{result.metrics.needs_review.toLocaleString()}</p>
              <p className="text-xs text-alqia-muted mt-1">Requieren revisión</p>
            </div>
            <div className="p-4 bg-alqia-risk/5 border border-alqia-risk/20 rounded-xl text-center">
              <p className="text-2xl font-data font-bold text-alqia-risk">{result.metrics.duplicates.toLocaleString()}</p>
              <p className="text-xs text-alqia-muted mt-1">Duplicados detectados</p>
            </div>
          </div>

          {/* Canales */}
          <GlassCard>
            <h3 className="text-sm font-medium text-white mb-4">Canales de contacto detectados</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-alqia-success/10 flex items-center justify-center">
                  <Phone size={14} className="text-alqia-success" />
                </div>
                <div>
                  <p className="text-sm font-data font-semibold text-white">{result.metrics.whatsapp_contactable}</p>
                  <p className="text-xs text-alqia-muted">WhatsApp probable</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-alqia-info/10 flex items-center justify-center">
                  <Mail size={14} className="text-alqia-info" />
                </div>
                <div>
                  <p className="text-sm font-data font-semibold text-white">{result.metrics.email_contactable}</p>
                  <p className="text-xs text-alqia-muted">Email válido</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-alqia-copper/10 flex items-center justify-center">
                  <Users size={14} className="text-alqia-copper" />
                </div>
                <div>
                  <p className="text-sm font-data font-semibold text-white">{result.metrics.avg_trust_score}</p>
                  <p className="text-xs text-alqia-muted">Score promedio</p>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Top 10 leads */}
          <GlassCard>
            <h3 className="text-sm font-medium text-white mb-3">Muestra de registros procesados</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-alqia-muted">
                    <th className="text-left font-normal pb-2 pr-4">Nombre</th>
                    <th className="text-left font-normal pb-2 pr-4">Email</th>
                    <th className="text-left font-normal pb-2 pr-4">Teléfono E.164</th>
                    <th className="text-left font-normal pb-2 pr-4">Score</th>
                    <th className="text-left font-normal pb-2">Clasificación</th>
                  </tr>
                </thead>
                <tbody>
                  {result.leads.slice(0, 10).map((lead, i) => {
                    const c = lead.cleaned as Record<string, string>
                    return (
                      <tr key={i} className="border-t border-white/[0.04]">
                        <td className="py-1.5 pr-4 text-white truncate max-w-[120px]">{c.full_name || '—'}</td>
                        <td className="py-1.5 pr-4 text-alqia-secondary truncate max-w-[140px]">
                          {lead.trust.classification === 'invalid_email'
                            ? <span className="text-alqia-risk">{c.email_raw || '—'}</span>
                            : c.email_clean || '—'}
                        </td>
                        <td className="py-1.5 pr-4 text-alqia-secondary font-data">{c.phone_e164 || <span className="text-alqia-risk">{c.phone_raw || '—'}</span>}</td>
                        <td className="py-1.5 pr-4">
                          <span className={`font-data font-semibold ${lead.trust.score >= 70 ? 'text-alqia-success' : lead.trust.score >= 45 ? 'text-alqia-warning' : 'text-alqia-risk'}`}>
                            {lead.trust.score}
                          </span>
                        </td>
                        <td className={`py-1.5 ${CLASS_COLORS[lead.trust.classification] ?? 'text-alqia-muted'}`}>
                          {CLASS_LABELS[lead.trust.classification] ?? lead.trust.classification}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>

          <div className="flex items-center justify-between">
            <ActionButton variant="ghost" size="sm" onClick={() => { setStep('upload'); setFile(null); setPreview(null); setResult(null) }}>
              Nueva importación
            </ActionButton>
            <div className="flex gap-2">
              <ActionButton variant="ghost" size="sm" icon={<Copy size={13} />} onClick={() => logEvent('import.export_results')}>
                Exportar resultados
              </ActionButton>
              <ActionButton variant="copper" size="sm" icon={<CheckCircle size={13} />} onClick={() => navigate('/app/data-trust')}>
                Ver en Data Trust
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
