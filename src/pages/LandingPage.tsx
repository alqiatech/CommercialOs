import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Zap, ArrowRight, Upload, Shield, Radar, GitBranch,
  MessageCircle, BarChart2, Menu, X, TrendingUp,
  Database, Sparkles, CheckCircle, ChevronRight,
  Phone, Mail, Users, Clock, Target, Activity,
} from 'lucide-react'

// ─── Mini componentes internos ─────────────────────────────────────────────

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium tracking-widest uppercase border border-alqia-copper/30 bg-alqia-copper/8 text-alqia-copper">
      <span className="w-1.5 h-1.5 rounded-full bg-alqia-copper animate-pulse-soft" />
      {children}
    </span>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium tracking-widest uppercase text-alqia-copper mb-3">
      {children}
    </p>
  )
}

// ─── Hero Dashboard Mockup ──────────────────────────────────────────────────

function HeroDashboard() {
  return (
    <div className="relative w-full max-w-[520px] select-none pointer-events-none">
      {/* Glow de fondo */}
      <div className="absolute inset-0 bg-alqia-copper/5 blur-3xl rounded-3xl" />

      {/* Contenedor principal */}
      <div className="relative rounded-2xl border border-white/10 bg-[rgba(24,33,45,0.85)] backdrop-blur-xl p-4 shadow-glass">

        {/* Header del mock */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] text-alqia-muted uppercase tracking-widest">Revenue Radar</p>
            <p className="text-xs text-white font-medium">Demo Automotriz · 6 jun</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-alqia-success animate-pulse-soft" />
            <span className="text-[10px] text-alqia-success">IA activa</span>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Pipeline', value: '$276K', trend: '+12%', color: 'text-alqia-success' },
            { label: 'Calientes', value: '3', trend: 'urgente', color: 'text-alqia-copper' },
            { label: 'Vencidos', value: '8', trend: 'hoy', color: 'text-alqia-risk' },
          ].map(kpi => (
            <div key={kpi.label} className="rounded-xl bg-white/[0.04] border border-white/8 p-2.5">
              <p className="text-[9px] text-alqia-muted uppercase tracking-wide mb-1">{kpi.label}</p>
              <p className="text-base font-data font-semibold text-white leading-none">{kpi.value}</p>
              <p className={`text-[9px] mt-1 ${kpi.color}`}>{kpi.trend}</p>
            </div>
          ))}
        </div>

        {/* Hallazgo IA */}
        <div className="rounded-xl border border-alqia-warning/20 bg-alqia-warning/5 p-3 mb-3">
          <div className="flex items-start gap-2">
            <Sparkles size={11} className="text-alqia-info mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-white font-medium leading-snug">
                47 leads con WhatsApp válido sin contacto en 60 días
              </p>
              <p className="text-[9px] text-alqia-muted mt-0.5">Confianza 94 · Detectado hace 12h</p>
            </div>
          </div>
          <div className="mt-2 h-6 rounded-lg bg-alqia-copper flex items-center justify-center">
            <p className="text-[9px] text-white font-medium">Activar cadencia de reactivación</p>
          </div>
        </div>

        {/* Mini oportunidades */}
        {[
          { name: 'Contacto Demo 01', product: 'Moto Deportiva 350', intent: 91, stage: 'Cita agendada' },
          { name: 'Contacto Demo 04', product: 'Moto 650cc', intent: 88, stage: 'Cotización' },
        ].map(opp => (
          <div key={opp.name} className="flex items-center gap-2 py-2 border-t border-white/5">
            <div className="w-6 h-6 rounded-full bg-alqia-copper/20 flex items-center justify-center text-alqia-copper text-[9px] font-medium flex-shrink-0">
              {opp.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-white truncate">{opp.name} · {opp.product}</p>
              <p className="text-[9px] text-alqia-muted">{opp.stage}</p>
            </div>
            <div className="w-7 h-7 rounded-full border-2 border-alqia-success/60 flex items-center justify-center flex-shrink-0">
              <span className="text-[9px] font-data text-alqia-success">{opp.intent}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Badge flotante izquierdo */}
      <div className="absolute -left-8 top-1/3 rounded-xl border border-white/10 bg-[rgba(24,33,45,0.92)] backdrop-blur-xl px-3 py-2 shadow-glass-hover">
        <div className="flex items-center gap-2">
          <Shield size={12} className="text-alqia-success" />
          <div>
            <p className="text-[9px] text-white font-medium">Data Trust</p>
            <p className="text-[8px] text-alqia-success">Score 87 · base limpia</p>
          </div>
        </div>
      </div>

      {/* Badge flotante derecho */}
      <div className="absolute -right-6 bottom-1/3 rounded-xl border border-white/10 bg-[rgba(24,33,45,0.92)] backdrop-blur-xl px-3 py-2 shadow-glass-hover">
        <div className="flex items-center gap-2">
          <Activity size={12} className="text-alqia-copper" />
          <div>
            <p className="text-[9px] text-white font-medium">IA llamando</p>
            <p className="text-[8px] text-alqia-muted">3 llamadas · ahora</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ───────────────────────────────────────────────────────

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[#111923] text-white font-sans overflow-x-hidden">

      {/* ─── NAV ──────────────────────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[rgba(17,25,35,0.92)] backdrop-blur-xl border-b border-white/8' : ''
      }`}>
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="w-32" />

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {['Producto', 'Módulos', 'Industrias', 'Sobre Alqia'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`}
                className="text-xs text-alqia-secondary hover:text-white transition-colors tracking-wide">
                {item}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login"
              className="text-xs text-alqia-secondary hover:text-white transition-colors">
              Acceder
            </Link>
            <a href="#contacto"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-alqia-copper text-white text-xs font-medium hover:bg-alqia-copper-hover transition-colors">
              Solicitar demo
              <ArrowRight size={12} />
            </a>
          </div>

          {/* Mobile menu */}
          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={18} className="text-alqia-secondary" /> : <Menu size={18} className="text-alqia-secondary" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-[rgba(17,25,35,0.98)] border-t border-white/8 px-6 py-4 flex flex-col gap-4">
            {['Producto', 'Módulos', 'Industrias', 'Sobre Alqia'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`}
                onClick={() => setMenuOpen(false)}
                className="text-sm text-alqia-secondary">
                {item}
              </a>
            ))}
            <Link to="/login" className="text-sm text-alqia-secondary">Acceder</Link>
            <a href="#contacto" className="btn-copper text-center rounded-xl py-2 text-sm">Solicitar demo</a>
          </div>
        )}
      </nav>

      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section className="min-h-screen flex items-center pt-20 px-6">
        {/* Partículas de fondo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-alqia-copper/4 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-alqia-deep/40 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-alqia-copper rounded-full opacity-60" style={{ boxShadow: '0 0 80px 40px rgba(249,128,88,0.06)' }} />
        </div>

        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center py-24">

          {/* Texto */}
          <div className="animate-fade-in">
            <img
              src="/Logoalqiacomosblanco.png"
              alt="Alqia Commercial OS"
              className="h-28 w-auto object-contain mb-10"
              style={{ filter: 'drop-shadow(0 4px 24px rgba(249,128,88,0.18)) drop-shadow(0 2px 8px rgba(0,0,0,0.45))' }}
            />
                        <h1 className="mt-6 text-5xl lg:text-6xl font-medium leading-[1.1] tracking-tight">
              Tu base de datos<br />
              <span className="text-gradient-copper">tiene oro</span><br />
              enterrado.
            </h1>

            <p className="mt-6 text-base text-alqia-secondary leading-relaxed max-w-md">
              Alqia Commercial OS transmuta contactos dormidos, leads olvidados y oportunidades dispersas
              en revenue medible y accionable — con IA, memoria comercial y automatización multicanal.
            </p>

            <p className="mt-4 text-sm text-alqia-muted italic">
              “No guarda leads. Los mueve hacia ingresos.”
            </p>

            <div className="mt-8 flex items-center gap-3 flex-wrap">
              <a href="#contacto"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-alqia-copper text-white text-sm font-medium hover:bg-alqia-copper-hover transition-all shadow-copper-glow">
                Solicitar demo
                <ArrowRight size={14} />
              </a>
              <Link to="/"
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/15 text-alqia-secondary text-sm hover:text-white hover:border-white/25 transition-all">
                Ver en vivo
                <ChevronRight size={14} />
              </Link>
            </div>

            <div className="mt-10 flex items-center gap-6 border-t border-white/8 pt-6">
              {[
                { value: '3 años', label: 'de leads recuperables' },
                { value: '94%', label: 'precisión de scoring IA' },
                { value: '< 48h', label: 'de setup a operación' },
              ].map(stat => (
                <div key={stat.label}>
                  <p className="text-lg font-data font-semibold text-white">{stat.value}</p>
                  <p className="text-[11px] text-alqia-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard mockup */}
          <div className="hidden lg:flex flex-col justify-center animate-slide-in-right">
            <div className="mb-5">
              <Pill>Applied Commercial Intelligence</Pill>
            </div>
            <HeroDashboard />
          </div>
        </div>
      </section>

      {/* ─── PROBLEMA ─────────────────────────────────────────────────────── */}
      <section id="producto" className="py-24 px-6 border-t border-white/6">
        <div className="max-w-6xl mx-auto">

          <div className="max-w-2xl mb-16">
            <SectionLabel>El problema real</SectionLabel>
            <h2 className="text-4xl font-medium leading-tight">
              El problema no es que no tengas CRM.<br />
              <span className="text-alqia-secondary">Es que tus datos no trabajan para ti.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/6 rounded-2xl overflow-hidden">
            {[
              { icon: Database, title: 'No saben qué lead contactar primero', desc: 'Bases acumuladas por años sin priorización. El vendedor elige por intuición, no por datos.' },
              { icon: Shield, title: 'No saben qué datos sirven', desc: 'Teléfonos inválidos, emails rebotados, duplicados triplicados. La base es un pantano, no un activo.' },
              { icon: Users, title: 'No saben quién sigue interesado', desc: 'Un lead de hace 8 meses puede estar listo hoy. Sin señales, se pierde en silencio.' },
              { icon: Clock, title: 'No saben si el vendedor dio seguimiento', desc: 'Promesas sin registro. Oportunidades que caen porque nadie supo que debía actuar.' },
              { icon: Target, title: 'No tienen IA accionando sobre el embudo', desc: 'La IA en la mayoría de herramientas es un chat decorativo. Aquí es el motor del sistema.' },
              { icon: TrendingUp, title: 'No miden lo que realmente importa', desc: 'Reportes que muestran actividad, no resultados. Datos que informan en lugar de dirigir.' },
            ].map(item => (
              <div key={item.title} className="bg-[#18212D] p-6 hover:bg-[rgba(32,45,61,0.8)] transition-colors">
                <item.icon size={18} className="text-alqia-copper mb-4" />
                <h3 className="text-sm font-medium text-white mb-2">{item.title}</h3>
                <p className="text-xs text-alqia-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TRANSMUTACIÓN (CÓMO FUNCIONA) ───────────────────────────────── */}
      <section className="py-24 px-6 border-t border-white/6">
        <div className="max-w-6xl mx-auto">

          <div className="max-w-xl mb-16">
            <SectionLabel>El proceso de transmutación</SectionLabel>
            <h2 className="text-4xl font-medium leading-tight">
              De materia bruta<br />
              <span className="text-gradient-copper">a revenue accionable.</span>
            </h2>
            <p className="mt-4 text-sm text-alqia-secondary leading-relaxed">
              Alqia Commercial OS toma lo que ya tienes — bases, historial, leads acumulados — y lo transforma
              en un activo comercial vivo mediante cuatro operaciones alquímicas.
            </p>
          </div>

          <div className="relative">
            {/* Línea conectora */}
            <div className="absolute left-[26px] top-8 bottom-8 w-px bg-gradient-to-b from-alqia-copper/0 via-alqia-copper/30 to-alqia-copper/0 hidden lg:block" />

            <div className="flex flex-col gap-6">
              {[
                {
                  step: '01',
                  icon: Upload,
                  title: 'Refinación — Importar',
                  subtitle: 'La materia bruta entra al sistema',
                  desc: 'Importa cualquier base en cualquier formato. CSV, Excel, exportación de Meta, Google Sheets, integración directa. Alqia Commercial OS acepta el caos y empieza a ordenarlo.',
                  tags: ['CSV · Excel · Meta Leads', 'Mapeo automático de columnas', 'Vista previa antes de procesar'],
                },
                {
                  step: '02',
                  icon: Shield,
                  title: 'Purificación — Data Trust',
                  subtitle: 'Separar el oro del ruido',
                  desc: 'Validación de teléfonos, detección de WhatsApp, verificación de emails, deduplicación inteligente y score de calidad por contacto. Cada registro sale limpio o marcado con su defecto exacto.',
                  tags: ['Score de calidad 0–100', 'Deduplicación por intención', 'Validación de canales en tiempo real'],
                },
                {
                  step: '03',
                  icon: Radar,
                  title: 'Destilación — Revenue Radar',
                  subtitle: 'Extraer las señales que importan',
                  desc: 'La IA analiza toda la base, detecta patrones de intención, identifica oportunidades dormidas, prioriza por urgencia y surfaca hallazgos accionables. Cada mañana, el Radar te dice qué mover hoy.',
                  tags: ['Scoring por intención y urgencia', 'Hallazgos IA con evidencia', 'Priorización automática del pipeline'],
                },
                {
                  step: '04',
                  icon: Sparkles,
                  title: 'Activación — Cadencias e IA',
                  subtitle: 'La reacción en cadena que genera revenue',
                  desc: 'WhatsApp, llamadas con voz IA, email, tareas al vendedor. Cadencias multicanal que se ejecutan sobre los contactos correctos en el momento correcto, con mensajes generados por IA y memoria comercial de cada conversación anterior.',
                  tags: ['WhatsApp · Llamada IA · Email', 'Cadencias multicanal preconfiguradas', 'Memoria de cada interacción'],
                },
              ].map((item, i) => (
                <div key={item.step} className="flex gap-8 items-start group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl border border-alqia-copper/25 bg-alqia-copper/8 flex items-center justify-center transition-all group-hover:border-alqia-copper/50 group-hover:bg-alqia-copper/15">
                    <item.icon size={18} className="text-alqia-copper" />
                  </div>
                  <div className="flex-1 rounded-2xl border border-white/8 bg-white/[0.025] p-5 hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <p className="text-[10px] text-alqia-muted tracking-widest uppercase">{item.subtitle}</p>
                        <h3 className="text-base font-medium text-white mt-0.5">{item.title}</h3>
                      </div>
                      <span className="text-[11px] font-data text-alqia-copper/40 font-medium">{item.step}</span>
                    </div>
                    <p className="text-sm text-alqia-secondary leading-relaxed mb-4">{item.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map(tag => (
                        <span key={tag} className="text-[10px] text-alqia-muted border border-white/8 px-2.5 py-1 rounded-full">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── MÓDULOS ──────────────────────────────────────────────────────── */}
      <section id="módulos" className="py-24 px-6 border-t border-white/6">
        <div className="max-w-6xl mx-auto">

          <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
            <div>
              <SectionLabel>Sistema modular</SectionLabel>
              <h2 className="text-4xl font-medium">Todo en un solo sistema operativo.</h2>
            </div>
            <p className="text-sm text-alqia-muted max-w-xs text-right leading-relaxed">
              No es una colección de herramientas. Es una arquitectura donde cada módulo alimenta al siguiente.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                icon: Upload,
                name: 'Importaciones',
                desc: 'Flujo de 7 pasos para procesar cualquier base comercial con validación, mapeo y resultado cuantificado.',
                badge: 'Core',
              },
              {
                icon: Shield,
                name: 'Data Trust',
                desc: 'Centro de calidad de datos con score por contacto, limpieza de duplicados y validación de canales.',
                badge: 'Core',
              },
              {
                icon: Radar,
                name: 'Revenue Radar',
                desc: 'Dashboard de inteligencia comercial con hallazgos IA, oportunidades urgentes y stream de actividad.',
                badge: 'Core',
              },
              {
                icon: Target,
                name: 'Oportunidades',
                desc: 'Pipeline con memoria comercial, scores de intención y datos, y detalle completo de cada trato.',
                badge: null,
              },
              {
                icon: GitBranch,
                name: 'Cadencias',
                desc: 'Secuencias multicanal automatizadas con pasos de WhatsApp, llamada IA, email y tarea al vendedor.',
                badge: null,
              },
              {
                icon: MessageCircle,
                name: 'Comunicaciones',
                desc: 'Bandeja unificada de WhatsApp, email y llamadas con historial, resúmenes IA y respuestas sugeridas.',
                badge: null,
              },
              {
                icon: CheckCircle,
                name: 'Tareas',
                desc: 'Seguimiento comercial pendiente organizado por prioridad, fecha y origen — manual o generado por IA.',
                badge: null,
              },
              {
                icon: BarChart2,
                name: 'Reportes',
                desc: 'Métricas de conversión, rendimiento por vendedor, fuentes, cadencias y ROI por canal.',
                badge: null,
              },
              {
                icon: Zap,
                name: 'Playbooks',
                desc: 'Biblioteca de estrategias comerciales por industria con pipeline, cadencias y scripts preconfigurados.',
                badge: null,
              },
            ].map(mod => (
              <div key={mod.name}
                className="group relative rounded-2xl border border-white/8 bg-white/[0.025] p-5 hover:border-alqia-copper/25 hover:bg-white/[0.04] transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-alqia-copper/8 border border-alqia-copper/20 flex items-center justify-center group-hover:bg-alqia-copper/15 transition-colors">
                    <mod.icon size={15} className="text-alqia-copper" />
                  </div>
                  {mod.badge && (
                    <span className="text-[9px] font-medium uppercase tracking-widest px-2 py-0.5 rounded-full border border-alqia-copper/30 text-alqia-copper bg-alqia-copper/8">
                      {mod.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-medium text-white mb-1.5">{mod.name}</h3>
                <p className="text-xs text-alqia-muted leading-relaxed">{mod.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── REVENUE RADAR FEATURE ────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-white/6">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-3xl border border-white/8 bg-gradient-to-br from-[rgba(32,45,61,0.6)] to-[rgba(17,25,35,0.4)] p-10 lg:p-14 overflow-hidden relative">

            <div className="absolute top-0 right-0 w-64 h-64 bg-alqia-copper/6 blur-3xl rounded-full" />

            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <SectionLabel>Revenue Radar</SectionLabel>
                <h2 className="text-3xl font-medium leading-tight mb-5">
                  Cada mañana, la respuesta a una sola pregunta:<br />
                  <span className="text-gradient-copper">¿Qué debo mover hoy?</span>
                </h2>
                <p className="text-sm text-alqia-secondary leading-relaxed mb-6">
                  El Radar analiza toda tu base durante la noche, identifica señales de intención,
                  detecta oportunidades vencidas, mide la urgencia de cada trato y te presenta
                  los hallazgos con una acción ejecutable en un clic.
                </p>
                <ul className="flex flex-col gap-3">
                  {[
                    'Hallazgos IA priorizados por impacto y confianza',
                    'Score de intención y urgencia por oportunidad',
                    'Leads recuperables detectados automáticamente',
                    'Actividad del equipo en tiempo real',
                    'KPIs de pipeline ponderado por probabilidad',
                  ].map(item => (
                    <li key={item} className="flex items-center gap-2.5 text-xs text-alqia-secondary">
                      <div className="w-1.5 h-1.5 rounded-full bg-alqia-copper flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mini radar visual */}
              <div className="flex justify-center">
                <div className="w-full max-w-[320px] rounded-2xl border border-white/10 bg-[rgba(24,33,45,0.8)] backdrop-blur-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] text-alqia-muted uppercase tracking-widest">Hallazgos activos</p>
                    <Sparkles size={11} className="text-alqia-info" />
                  </div>
                  {[
                    { title: '8 cotizaciones sin respuesta en 72h', sev: 'CRITICO', sevColor: 'text-alqia-risk border-alqia-risk/30' },
                    { title: '47 leads olvidados con WhatsApp válido', sev: 'ALTO', sevColor: 'text-alqia-warning border-alqia-warning/30' },
                    { title: 'Señal de compra en financiamiento', sev: 'MEDIO', sevColor: 'text-alqia-info border-alqia-info/30' },
                  ].map(f => (
                    <div key={f.title} className="flex items-start gap-2.5 py-3 border-t border-white/5">
                      <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded border flex-shrink-0 ${f.sevColor}`}>
                        {f.sev}
                      </span>
                      <p className="text-[10px] text-alqia-secondary leading-snug">{f.title}</p>
                    </div>
                  ))}
                  <div className="mt-3 h-7 rounded-lg bg-alqia-copper flex items-center justify-center">
                    <p className="text-[9px] text-white font-medium">Ejecutar acción recomendada</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── INDUSTRIAS ───────────────────────────────────────────────────── */}
      <section id="industrias" className="py-24 px-6 border-t border-white/6">
        <div className="max-w-6xl mx-auto text-center">
          <SectionLabel>Diseñado para cualquier vertical</SectionLabel>
          <h2 className="text-4xl font-medium mb-4">Una plataforma. Múltiples industrias.</h2>
          <p className="text-sm text-alqia-muted max-w-lg mx-auto mb-12">
            Alqia Commercial OS adapta su pipeline, cadencias y playbooks a cada tipo de venta consultiva o por seguimiento.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              'Automotriz', 'Inmobiliaria', 'Distribución Industrial',
              'Seguros', 'Equipamiento Médico', 'Servicios Profesionales',
              'Turismo Médico', 'SaaS', 'Franquicias', 'Educación',
              'Tequileras B2B', 'Membresías', 'NOM-035', 'Capacitación',
            ].map(ind => (
              <span key={ind}
                className="text-xs text-alqia-secondary border border-white/10 px-3 py-1.5 rounded-full hover:border-alqia-copper/30 hover:text-white transition-colors cursor-default">
                {ind}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── IA ───────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-white/6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            <div>
              <SectionLabel>Inteligencia aplicada</SectionLabel>
              <h2 className="text-4xl font-medium leading-tight mb-5">
                La IA no es un chat.<br />
                <span className="text-gradient-copper">Es el motor del sistema.</span>
              </h2>
              <p className="text-sm text-alqia-secondary leading-relaxed mb-8">
                En Alqia Commercial OS, la inteligencia artificial no vive en una burbuja lateral. Está embebida en
                cada operación: limpia, clasifica, prioriza, genera mensajes, resume llamadas,
                detecta intención y recomienda la siguiente acción con evidencia.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Database, text: 'Limpieza y clasificación de leads' },
                  { icon: MessageCircle, text: 'Generación de mensajes por contexto' },
                  { icon: Phone, text: 'Llamadas con voz IA (Twilio + OpenAI)' },
                  { icon: Activity, text: 'Detección de intención en conversaciones' },
                  { icon: Target, text: 'Scoring de intención y urgencia' },
                  { icon: Sparkles, text: 'Resumen automático de oportunidades' },
                ].map(item => (
                  <div key={item.text} className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.025] border border-white/6">
                    <item.icon size={13} className="text-alqia-info mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] text-alqia-secondary leading-snug">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {[
                {
                  from: 'Llamada de 3:24 min · Contacto Demo 01',
                  summary: 'Cliente mencionó interés en financiamiento. Objeción principal: precio. Solicita test ride el próximo sábado. Intención de compra: alta.',
                  action: 'Siguiente acción recomendada: agendar test ride + enviar opciones de financiamiento vía WhatsApp.',
                },
              ].map(item => (
                <div key={item.from} className="rounded-2xl border border-alqia-info/15 bg-alqia-info/4 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={12} className="text-alqia-info" />
                    <p className="text-[10px] text-alqia-info uppercase tracking-widest font-medium">Resumen IA — Llamada</p>
                  </div>
                  <p className="text-[10px] text-alqia-muted mb-2">{item.from}</p>
                  <p className="text-xs text-alqia-secondary leading-relaxed mb-3">{item.summary}</p>
                  <div className="border-t border-white/6 pt-3">
                    <p className="text-[10px] text-alqia-copper leading-relaxed">{item.action}</p>
                  </div>
                </div>
              ))}
              <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle size={12} className="text-alqia-success" />
                  <p className="text-[10px] text-alqia-muted uppercase tracking-widest">Mensaje generado por IA</p>
                </div>
                <p className="text-xs text-alqia-secondary leading-relaxed italic">
                  "Hola, te habla el asesor de Demo Automotriz. Quería retomar tu consulta sobre la moto que te interesó.
                  Tenemos planes de financiamiento desde $X al mes con enganche mínimo. ¿Te puedo mandar los detalles
                  ahora por aquí?"
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-[9px] text-alqia-muted">Basado en llamada del 15 may · contexto de 3 interacciones</p>
                  <span className="text-[9px] text-alqia-success border border-alqia-success/20 px-2 py-0.5 rounded-full">Listo para enviar</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ────────────────────────────────────────────────────── */}
      <section id="contacto" className="py-24 px-6 border-t border-white/6">
        <div className="max-w-3xl mx-auto text-center">
          <SectionLabel>Comenzar la transmutación</SectionLabel>
          <h2 className="text-5xl font-medium leading-tight mb-5">
            La base que tienes<br />
            vale más de lo que crees.
          </h2>
          <p className="text-sm text-alqia-secondary max-w-md mx-auto mb-10 leading-relaxed">
            En menos de 48 horas tu equipo puede tener el Revenue Radar activo sobre tu base real.
            Sin integraciones complejas. Sin semanas de onboarding.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a href="mailto:hola@alqia.tech"
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-alqia-copper text-white text-sm font-medium hover:bg-alqia-copper-hover transition-all shadow-copper-glow">
              <Mail size={14} />
              Solicitar demo privada
            </a>
            <Link to="/"
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl border border-white/15 text-alqia-secondary text-sm hover:text-white hover:border-white/25 transition-all">
              Explorar el sistema
              <ChevronRight size={14} />
            </Link>
          </div>
          <p className="mt-6 text-[11px] text-alqia-muted">
            Un producto de <a href="https://alqia.tech" target="_blank" rel="noopener noreferrer" className="text-alqia-secondary hover:text-white transition-colors">Alqia</a> · Applied Intelligence
          </p>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/6 px-6 py-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-6">
          <div className="flex items-center gap-3">
            <img
              src="/Logoalqiacomosblanco.png"
              alt="Alqia Commercial OS"
              className="h-12 w-auto object-contain opacity-90"
            />
            <p className="text-[9px] text-alqia-muted leading-none">Un producto de Alqia Tech · Marca registrada · Patente en trámite</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://alqia.tech" target="_blank" rel="noopener noreferrer" className="text-[11px] text-alqia-muted hover:text-white transition-colors">alqia.tech</a>
            <a href="mailto:hola@alqia.tech" className="text-[11px] text-alqia-muted hover:text-white transition-colors">hola@alqia.tech</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
