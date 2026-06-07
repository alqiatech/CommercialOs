import { useState, useEffect } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { PageHeader } from '@/components/layout/PageHeader'
import { ActionButton } from '@/components/ui/ActionButton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { mockUsers } from '@/data'
import { useAppStore } from '@/store/appStore'
import { checkHealth } from '@/lib/apiClient'
import {
  Settings, Users, Building2, MessageSquare, Bot, Phone, Mail,
  Shield, ChevronRight, Check, Lock, AlertTriangle, Sliders, Zap,
} from 'lucide-react'
import { logEvent, cn } from '@/lib/utils'

// ─── Tab Empresa ─────────────────────────────────────────────────────────────
function EmpresaTab() {
  const { activeCompany } = useAppStore()
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    logEvent('settings.empresa.saved', { company_id: activeCompany.id })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="flex flex-col gap-4">
      <GlassCard>
        <div className="flex items-center gap-2 mb-5">
          <Building2 size={15} className="text-alqia-copper" />
          <h3 className="text-sm font-medium text-white">Información de la empresa</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Nombre comercial', value: activeCompany.name },
            { label: 'Ciudad', value: activeCompany.city },
            { label: 'País', value: activeCompany.country },
            { label: 'Industria', value: activeCompany.industry_label },
          ].map(field => (
            <div key={field.label}>
              <label className="text-[10px] text-alqia-muted uppercase tracking-wider block mb-1.5">{field.label}</label>
              <input
                defaultValue={field.value}
                className="w-full bg-white/[0.04] border border-white/8 rounded-xl px-3 py-2 text-sm text-white placeholder-alqia-muted focus:outline-none focus:border-alqia-copper/40 transition-colors"
              />
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-alqia-copper text-white text-xs font-medium hover:bg-alqia-copper-hover transition-all"
          >
            {saved ? <><Check size={12} /> Guardado</> : 'Guardar cambios'}
          </button>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-alqia-copper" />
            <h3 className="text-sm font-medium text-white">Equipo</h3>
          </div>
          <button
            onClick={() => logEvent('settings.invite_user_clicked', {})}
            className="text-[11px] text-alqia-copper hover:text-white flex items-center gap-1 transition-colors"
          >
            Invitar usuario <ChevronRight size={10} />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {mockUsers.slice(0, 4).map(user => (
            <div key={user.id} className="flex items-center gap-3 py-1">
              <div className="w-7 h-7 rounded-full bg-alqia-copper/15 border border-alqia-copper/20 flex items-center justify-center text-alqia-copper text-[10px] font-medium">
                {user.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white truncate">{user.full_name}</p>
                <p className="text-[10px] text-alqia-muted truncate">{user.email}</p>
              </div>
              <StatusBadge variant="neutral" size="sm">
                {user.role_type === 'owner' || user.role_type === 'admin' || user.role_type === 'super_admin_alqia' ? 'Director' :
                 user.role_type === 'sales_director' || user.role_type === 'sales_manager' ? 'Gerente' :
                 user.role_type === 'sales_rep' ? 'Asesor' : 'Vista'}
              </StatusBadge>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}

// ─── Tab IA Comercial ─────────────────────────────────────────────────────────
function IATab() {
  const [aiHealth, setAiHealth] = useState<{ status: string; ai_mode: string; model: string } | null>(null)
  const [checking, setChecking] = useState(false)

  const checkAiStatus = async () => {
    setChecking(true)
    try {
      const h = await checkHealth()
      setAiHealth(h)
    } catch {
      setAiHealth(null)
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => { checkAiStatus() }, [])

  const modules = [
    {
      icon: Bot,
      name: 'Motor de análisis de señales',
      description: 'Identifica automáticamente oportunidades de riesgo y potencial en tu pipeline.',
      status: 'activo',
      variant: 'success' as const,
    },
    {
      icon: MessageSquare,
      name: 'Generador de mensajes',
      description: 'Redacta mensajes de seguimiento en el tono y canal correcto para cada cliente.',
      status: 'activo',
      variant: 'success' as const,
    },
    {
      icon: Sliders,
      name: 'Clasificador de prospectos',
      description: 'Evalúa la calidad y probabilidad de cierre de cada contacto al importar.',
      status: 'activo',
      variant: 'success' as const,
    },
    {
      icon: Phone,
      name: 'Llamadas de calificación',
      description: 'Llamadas de calificación y reactivación con voz IA.',
      status: 'próximamente',
      variant: 'neutral' as const,
    },
  ]

  const isActive = aiHealth?.status === 'ok'
  const isRealMode = aiHealth?.ai_mode === 'real'

  return (
    <div className="flex flex-col gap-3">
      {/* Estado del motor IA */}
      <GlassCard className="mb-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-alqia-success animate-pulse' : 'bg-alqia-muted'}`} />
            <div>
              <p className="text-sm font-medium text-white">
                {checking ? 'Verificando motor IA...' : isActive ? 'Motor IA activo' : 'Motor IA no detectado'}
              </p>
              {aiHealth && (
                <p className="text-[10px] text-alqia-muted mt-0.5">
                  {isRealMode ? `Modo real · Modelo ${aiHealth.model}` : 'Modo demo — procesando localmente'}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {aiHealth && (
              <StatusBadge variant={isRealMode ? 'success' : 'warning'} size="sm" dot>
                {isRealMode ? 'IA activa' : 'Modo demo'}
              </StatusBadge>
            )}
            <button
              onClick={checkAiStatus}
              className="text-[10px] text-alqia-copper hover:text-white flex items-center gap-1 transition-colors"
            >
              <Zap size={10} /> Verificar
            </button>
          </div>
        </div>
      </GlassCard>

      <div className="px-4 py-3 rounded-xl border border-alqia-info/15 bg-alqia-info/5 mb-2">
        <p className="text-xs text-alqia-secondary leading-relaxed">
          La inteligencia artificial de Alqia Commercial OS procesa tus datos de forma privada.
          Nunca comparte tu información con terceros ni usa tus datos para entrenamiento.
        </p>
      </div>
      {modules.map(mod => {
        const Icon = mod.icon
        return (
          <div key={mod.name} className="flex items-start gap-3 p-4 rounded-2xl border border-white/8 bg-white/[0.025] hover:bg-white/[0.04] transition-colors">
            <div className="w-9 h-9 rounded-xl bg-alqia-info/8 border border-alqia-info/15 flex items-center justify-center flex-shrink-0">
              <Icon size={14} className="text-alqia-info" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{mod.name}</p>
              <p className="text-[11px] text-alqia-muted leading-relaxed mt-0.5">{mod.description}</p>
            </div>
            <StatusBadge variant={mod.variant} size="sm" dot>{mod.status}</StatusBadge>
          </div>
        )
      })}
    </div>
  )
}

// ─── Tab Comunicación ─────────────────────────────────────────────────────────
function ComunicacionTab() {
  const channels = [
    { icon: MessageSquare, name: 'Canal WhatsApp', description: 'Envía y recibe mensajes de seguimiento de forma automatizada.', status: 'pendiente', variant: 'neutral' as const },
    { icon: Phone, name: 'Llamadas comerciales', description: 'Llamadas de calificación y reactivación con voz IA.', status: 'pendiente', variant: 'neutral' as const },
    { icon: Mail, name: 'Correo comercial', description: 'Secuencias de emails automatizadas con tu marca.', status: 'pendiente', variant: 'neutral' as const },
  ]

  return (
    <div className="flex flex-col gap-3">
      <div className="px-4 py-3 rounded-xl border border-alqia-warning/15 bg-alqia-warning/5 mb-2">
        <p className="text-xs text-alqia-secondary leading-relaxed">
          Los canales de comunicación se activan durante la configuración inicial.
          Contacta a tu representante de Alqia Tech para habilitar cada canal.
        </p>
      </div>
      {channels.map(ch => {
        const Icon = ch.icon
        return (
          <div key={ch.name} className="flex items-start gap-3 p-4 rounded-2xl border border-white/8 bg-white/[0.025]">
            <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/8 flex items-center justify-center flex-shrink-0">
              <Icon size={14} className="text-alqia-muted" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{ch.name}</p>
              <p className="text-[11px] text-alqia-muted leading-relaxed mt-0.5">{ch.description}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge variant={ch.variant} size="sm">{ch.status}</StatusBadge>
              <button
                className="text-[10px] text-alqia-copper hover:text-white flex items-center gap-0.5 transition-colors"
                onClick={() => logEvent('settings.channel_activate_clicked', { channel: ch.name })}
              >
                Activar <ChevronRight size={9} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Tab Técnico (solo Super Admin) ──────────────────────────────────────────
function TecnicoTab() {
  const providers = [
    { name: 'Supabase', category: 'Base de datos', key_env: 'SUPABASE_URL', status: 'pendiente' },
    { name: 'OpenAI', category: 'Motor IA', key_env: 'OPENAI_API_KEY', status: 'pendiente' },
    { name: 'Twilio Voice', category: 'Llamadas IA', key_env: 'TWILIO_ACCOUNT_SID', status: 'pendiente' },
    { name: 'WhatsApp Cloud API', category: 'Mensajería', key_env: 'WA_PHONE_NUMBER_ID', status: 'pendiente' },
    { name: 'Resend', category: 'Email transaccional', key_env: 'RESEND_API_KEY', status: 'pendiente' },
    { name: 'Twilio Lookup', category: 'Validación de datos', key_env: 'TWILIO_LOOKUP_SID', status: 'pendiente' },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-alqia-risk/20 bg-alqia-risk/5">
        <Lock size={13} className="text-alqia-risk flex-shrink-0" />
        <p className="text-xs text-alqia-secondary leading-relaxed">
          Esta sección es exclusiva del equipo técnico de Alqia. 
          Credenciales y llaves de producción se configuran en el servidor, nunca en el cliente.
        </p>
      </div>

      <GlassCard>
        <h4 className="text-xs font-medium text-alqia-muted uppercase tracking-widest mb-4">Proveedores</h4>
        <div className="flex flex-col gap-3">
          {providers.map(p => (
            <div key={p.name} className="flex items-center gap-3 py-1">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-white">{p.name}</p>
                  <p className="text-[10px] text-alqia-muted">{p.category}</p>
                </div>
                <code className="text-[10px] text-alqia-muted/60 font-mono">{p.key_env}</code>
              </div>
              <StatusBadge variant="neutral" size="sm">{p.status}</StatusBadge>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <h4 className="text-xs font-medium text-alqia-muted uppercase tracking-widest mb-3">Variables de entorno activas</h4>
        <div className="flex flex-col gap-2">
          {[
            ['VITE_USE_MOCK', import.meta.env.VITE_USE_MOCK ?? 'true'],
            ['VITE_APP_ENV', import.meta.env.VITE_APP_ENV ?? 'development'],
            ['VITE_API_BASE_URL', import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001'],
          ].map(([key, val]) => (
            <div key={key} className="flex items-center gap-3 text-[10px] font-mono">
              <span className="text-alqia-info">{key}</span>
              <span className="text-alqia-muted">=</span>
              <span className="text-alqia-secondary">{val}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-alqia-warning/15 bg-alqia-warning/5">
        <AlertTriangle size={12} className="text-alqia-warning flex-shrink-0" />
        <p className="text-[11px] text-alqia-secondary">
          Jamás uses el prefijo <code className="text-alqia-warning font-mono">VITE_</code> para almacenar claves de API de producción — esas variables quedan expuestas al navegador.
        </p>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function SettingsPage() {
  const { currentUser } = useAppStore()
  const isSuperAdmin = currentUser.role_type === 'owner' ||
    currentUser.role_type === 'admin' ||
    currentUser.role_type === 'super_admin_alqia'

  const tabs = [
    { id: 'empresa', label: 'Empresa', icon: Building2 },
    { id: 'ia', label: 'IA Comercial', icon: Bot },
    { id: 'comunicacion', label: 'Comunicación', icon: MessageSquare },
    ...(isSuperAdmin ? [{ id: 'tecnico', label: 'Técnico', icon: Lock }] : []),
  ]

  const [activeTab, setActiveTab] = useState('empresa')

  return (
    <div className="p-6 max-w-[900px] mx-auto">
      <PageHeader
        title="Configuración"
        description="Empresa, usuarios, canales y motor de análisis."
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-white/6 pb-0">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-all border-b-2 -mb-px',
                activeTab === tab.id
                  ? 'text-white border-alqia-copper'
                  : 'text-alqia-muted border-transparent hover:text-alqia-secondary',
                tab.id === 'tecnico' && 'text-alqia-risk/70',
              )}
            >
              <Icon size={12} />
              {tab.label}
              {tab.id === 'tecnico' && <Lock size={9} className="text-alqia-risk/50" />}
            </button>
          )
        })}
      </div>

      {activeTab === 'empresa' && <EmpresaTab />}
      {activeTab === 'ia' && <IATab />}
      {activeTab === 'comunicacion' && <ComunicacionTab />}
      {activeTab === 'tecnico' && isSuperAdmin && <TecnicoTab />}
    </div>
  )
}

