// ─────────────────────────────────────────────────────────────────────────────
// PLANTILLAS DE INDUSTRIA — Alqia Commercial OS
// Cada plantilla define el lenguaje, pipeline, cadencias, KPIs y lógica IA
// que se adapta a la industria del cliente activo.
// ─────────────────────────────────────────────────────────────────────────────

export type IndustryKey =
  | 'automotriz'
  | 'distribucion_industrial'
  | 'inmobiliaria'
  | 'servicios_profesionales'
  | 'saas_membresias'
  | 'clinicas_salud'
  | 'turismo_medico'
  | 'tequilera_exportacion'
  | 'seguros'
  | 'educacion_capacitacion'

export type SaleType = 'b2c' | 'b2b' | 'both'

export interface StageDef {
  key: string
  label: string
  description: string
  typical_duration_days: number
  conversion_rate_avg: number   // 0–1
  is_terminal?: boolean
}

export interface KpiDef {
  key: string
  label: string
  unit: string
  benchmark: string
}

export interface MessageTemplate {
  context: string       // etapa o situación
  channel: 'whatsapp' | 'email' | 'phone'
  tone: 'warm' | 'consultative' | 'urgent' | 'formal'
  template: string
}

export interface ScriptTemplate {
  context: string
  opening: string
  key_questions: string[]
  objection_handlers: Record<string, string>
  closing: string
}

export interface CadenceTemplateDef {
  name: string
  trigger: string
  steps: Array<{ day: number; channel: 'whatsapp' | 'email' | 'phone' | 'task'; action: string }>
}

export interface ScoringRule {
  signal: string
  weight: number        // 1–10
  description: string
}

export interface IndustryVocabulary {
  contact_label: string        // "Cliente" | "Importador" | "Paciente" | "Alumno"
  opportunity_label: string    // "Oportunidad" | "Negociación" | "Consulta" | "Prospecto"
  product_label: string        // "Modelo" | "SKU" | "Propiedad" | "Servicio" | "Plan"
  close_label: string          // "Venta" | "Contrato" | "Matrícula" | "Pedido"
  pipeline_label: string       // "Embudo" | "Proceso de venta" | "Cartera"
  stage_label: string          // "Etapa" | "Fase" | "Estado"
  key_action: string           // "Test ride" | "Demo técnica" | "Visita" | "Diagnóstico"
}

export interface IndustryTemplate {
  industry_key: IndustryKey
  name: string
  commercial_description: string
  sale_type: SaleType
  avg_cycle_days: number
  avg_ticket: string
  pipeline_name: string
  stages: StageDef[]
  kpis: KpiDef[]
  example_products: string[]
  common_objections: string[]
  message_templates: MessageTemplate[]
  script_templates: ScriptTemplate[]
  cadence_templates: CadenceTemplateDef[]
  scoring_rules: ScoringRule[]
  ai_recommended_actions: string[]
  vocabulary: IndustryVocabulary
}

// ─────────────────────────────────────────────────────────────────────────────
// PLANTILLAS
// ─────────────────────────────────────────────────────────────────────────────

export const industryTemplates: Record<IndustryKey, IndustryTemplate> = {

  // ── 1. AUTOMOTRIZ / MOTOCICLETAS ──────────────────────────────────────────
  automotriz: {
    industry_key: 'automotriz',
    name: 'Automotriz',
    commercial_description: 'Venta consultiva de vehículos o motocicletas con financiamiento, test ride y seguimiento post visita.',
    sale_type: 'b2c',
    avg_cycle_days: 21,
    avg_ticket: '$85,000 – $350,000 MXN',
    pipeline_name: 'Embudo de ventas automotriz',
    stages: [
      { key: 'lead_nuevo', label: 'Lead nuevo', description: 'Contacto sin interacción previa', typical_duration_days: 1, conversion_rate_avg: 0.6 },
      { key: 'validado', label: 'Validado', description: 'Datos verificados y canal activo', typical_duration_days: 2, conversion_rate_avg: 0.55 },
      { key: 'contactado', label: 'Contactado', description: 'Primera comunicación establecida', typical_duration_days: 3, conversion_rate_avg: 0.5 },
      { key: 'interesado', label: 'Interesado', description: 'Confirmó interés en modelo específico', typical_duration_days: 5, conversion_rate_avg: 0.45 },
      { key: 'cita_test_ride', label: 'Cita / Test ride', description: 'Visita o prueba de manejo agendada', typical_duration_days: 4, conversion_rate_avg: 0.65 },
      { key: 'cotizacion', label: 'Cotización', description: 'Propuesta económica enviada', typical_duration_days: 5, conversion_rate_avg: 0.5 },
      { key: 'financiamiento', label: 'Financiamiento', description: 'En proceso de aprobación de crédito', typical_duration_days: 7, conversion_rate_avg: 0.7 },
      { key: 'cierre', label: 'Cierre', description: 'Documentación y entrega', typical_duration_days: 3, conversion_rate_avg: 0.9, is_terminal: true },
    ],
    kpis: [
      { key: 'pipeline_value', label: 'Pipeline total', unit: 'MXN', benchmark: '>$1M activo' },
      { key: 'test_rides', label: 'Test rides agendados', unit: 'unidades', benchmark: '>5 por semana' },
      { key: 'conversion_cotizacion', label: 'Cierres vs cotizaciones', unit: '%', benchmark: '25–40%' },
      { key: 'leads_reactivables', label: 'Leads reactivables', unit: 'contactos', benchmark: 'Base > 90 días' },
    ],
    example_products: ['Motocicleta urbana', 'Motocicleta de aventura', 'Naked 300cc', 'Cruiser 650cc', 'Trail 400cc'],
    common_objections: ['El precio está muy alto', 'Necesito pensarlo', 'Mi esposa/esposo no me deja', 'Primero junto para el enganche', 'Ya tengo carro'],
    message_templates: [
      {
        context: 'primer_contacto',
        channel: 'whatsapp',
        tone: 'warm',
        template: 'Hola {nombre}, soy {vendedor} de {empresa}. Vi que te interesa {modelo}. ¿Tienes 5 minutos para platicar sobre disponibilidad y opciones de financiamiento?',
      },
      {
        context: 'post_test_ride',
        channel: 'whatsapp',
        tone: 'warm',
        template: 'Hola {nombre}, fue un placer verte hoy. ¿Qué te pareció el {modelo}? Te mando la cotización con las opciones que comentamos.',
      },
      {
        context: 'cotizacion_enviada',
        channel: 'whatsapp',
        tone: 'consultative',
        template: 'Hola {nombre}, te comparto la cotización del {modelo}. Tenemos plan desde ${mensualidad}/mes con enganche accesible. ¿Te funciona que lo revisemos juntos?',
      },
      {
        context: 'reactivacion',
        channel: 'whatsapp',
        tone: 'warm',
        template: 'Hola {nombre}, hace tiempo que no hablamos sobre el {modelo} que te interesaba. Llegaron nuevas opciones y me gustaría compartírtelas.',
      },
    ],
    script_templates: [
      {
        context: 'primer_contacto_telefono',
        opening: 'Buenos días {nombre}, soy {vendedor} de {empresa}. Le llamo porque registré su interés en uno de nuestros modelos. ¿Es buen momento?',
        key_questions: ['¿Cuál modelo le llamó la atención?', '¿Para qué uso principal la usaría?', '¿Ha tenido experiencia con motos antes?', '¿Busca pago de contado o financiado?'],
        objection_handlers: {
          'precio alto': 'Entiendo. ¿Le cuento sobre nuestros planes de financiamiento? Desde $X al mes puede llevársela hoy.',
          'pensarlo': '¿Qué información le faltaría para tomar la decisión? Quiero asegurarme de que tenga todo claro.',
        },
        closing: '¿Qué le parece si agendamos una visita para que la conozca en persona? Le reservo unidad para test ride.',
      },
    ],
    cadence_templates: [
      {
        name: 'Bienvenida Lead Nuevo',
        trigger: 'lead_importado',
        steps: [
          { day: 0, channel: 'whatsapp', action: 'Enviar mensaje de presentación con modelo de interés' },
          { day: 1, channel: 'phone', action: 'Llamada de calificación — confirmar interés y agendar visita' },
          { day: 3, channel: 'whatsapp', action: 'Enviar ficha técnica del modelo y opciones de financiamiento' },
          { day: 7, channel: 'task', action: 'Asignar a vendedor si no respondió — seguimiento directo' },
          { day: 14, channel: 'whatsapp', action: 'Reactivación con nueva oferta o modelo similar' },
        ],
      },
      {
        name: 'Reactivación Base Histórica',
        trigger: 'sin_contacto_60_dias',
        steps: [
          { day: 0, channel: 'whatsapp', action: 'Mensaje de reactivación con novedades del catálogo' },
          { day: 2, channel: 'phone', action: 'Llamada IA de calificación de interés actual' },
          { day: 5, channel: 'whatsapp', action: 'Oferta especial limitada' },
          { day: 10, channel: 'task', action: 'Revisión manual — decidir si continúa en cadencia' },
        ],
      },
    ],
    scoring_rules: [
      { signal: 'Pregunta por financiamiento', weight: 9, description: 'Señal de intención alta — comprador que necesita facilidades avanza más rápido' },
      { signal: 'Agenda test ride', weight: 10, description: 'Máxima intención comercial' },
      { signal: 'Solicita cotización', weight: 8, description: 'Proceso de decisión activo' },
      { signal: 'Responde WhatsApp en menos de 1h', weight: 7, description: 'Alta disponibilidad e interés' },
      { signal: 'Menciona fecha de compra', weight: 9, description: 'Comprador con urgencia definida' },
      { signal: 'Sin respuesta en 7 días', weight: -5, description: 'Posible abandono — priorizar reactivación' },
    ],
    ai_recommended_actions: [
      'Activar cadencia de reactivación para leads >60 días sin contacto',
      'Priorizar llamada IA para leads que preguntaron financiamiento',
      'Enviar ficha técnica del modelo de mayor interés por WhatsApp',
      'Crear tarea urgente para cotizaciones sin seguimiento en 72h',
      'Reagendar test ride para leads con cita vencida',
    ],
    vocabulary: {
      contact_label: 'Cliente',
      opportunity_label: 'Oportunidad',
      product_label: 'Modelo',
      close_label: 'Venta',
      pipeline_label: 'Embudo de ventas',
      stage_label: 'Etapa',
      key_action: 'Test ride',
    },
  },

  // ── 2. DISTRIBUCIÓN INDUSTRIAL ────────────────────────────────────────────
  distribucion_industrial: {
    industry_key: 'distribucion_industrial',
    name: 'Distribución Industrial',
    commercial_description: 'Ventas B2B de equipos, refacciones o insumos industriales con ciclo largo, cotización técnica y aprobación en comité.',
    sale_type: 'b2b',
    avg_cycle_days: 45,
    avg_ticket: '$150,000 – $2,000,000 MXN',
    pipeline_name: 'Proceso comercial industrial',
    stages: [
      { key: 'prospecto', label: 'Prospecto', description: 'Empresa identificada como potencial', typical_duration_days: 3, conversion_rate_avg: 0.5 },
      { key: 'diagnostico', label: 'Diagnóstico', description: 'Reunión de levantamiento de necesidades', typical_duration_days: 7, conversion_rate_avg: 0.65 },
      { key: 'requerimiento', label: 'Requerimiento técnico', description: 'Especificaciones formalizadas por el cliente', typical_duration_days: 7, conversion_rate_avg: 0.7 },
      { key: 'propuesta', label: 'Propuesta preliminar', description: 'Solución técnica presentada', typical_duration_days: 10, conversion_rate_avg: 0.6 },
      { key: 'cotizacion_formal', label: 'Cotización formal', description: 'Cotización con precio y condiciones enviada', typical_duration_days: 7, conversion_rate_avg: 0.55 },
      { key: 'revision_tecnica', label: 'Revisión técnica', description: 'Aprobación del área técnica del cliente', typical_duration_days: 10, conversion_rate_avg: 0.75 },
      { key: 'orden_compra', label: 'Orden de compra', description: 'OC emitida por el cliente', typical_duration_days: 5, conversion_rate_avg: 0.95, is_terminal: true },
    ],
    kpis: [
      { key: 'pipeline_value', label: 'Pipeline en proceso', unit: 'MXN', benchmark: '>$5M activo' },
      { key: 'propuestas_activas', label: 'Propuestas activas', unit: 'cotizaciones', benchmark: '>8 simultáneas' },
      { key: 'ciclo_promedio', label: 'Ciclo de venta promedio', unit: 'días', benchmark: '<45 días' },
      { key: 'win_rate', label: 'Tasa de cierre', unit: '%', benchmark: '25–35%' },
    ],
    example_products: ['Maquinaria industrial', 'Refacciones especiales', 'Insumos de producción', 'Equipo de seguridad industrial', 'Servicios de mantenimiento'],
    common_objections: ['El presupuesto está congelado', 'Ya tenemos proveedor', 'Necesitamos aprobación del director', 'El precio está fuera de rango', 'Los tiempos de entrega no nos sirven'],
    message_templates: [
      {
        context: 'primer_contacto',
        channel: 'email',
        tone: 'formal',
        template: 'Estimado {nombre}, me permito presentarme como {vendedor} de {empresa}. Hemos trabajado con empresas del sector {industria_cliente} resolviendo {problema_comun}. ¿Le parece si agendamos 20 minutos para un diagnóstico sin costo?',
      },
      {
        context: 'post_diagnostico',
        channel: 'email',
        tone: 'consultative',
        template: 'Estimado {nombre}, siguiendo nuestra reunión del {fecha}, adjunto el resumen de requerimientos y la propuesta técnica para {solución}. Quedo a disposición para cualquier aclaración.',
      },
    ],
    script_templates: [
      {
        context: 'primer_contacto_telefono',
        opening: 'Buenos días, ¿podría comunicarme con el responsable de compras? — Mi nombre es {vendedor} de {empresa}, les llamamos porque trabajamos con empresas de {giro} como la suya.',
        key_questions: ['¿Cuál es su mayor reto operativo actualmente?', '¿Tienen proveedor actual para esta categoría?', '¿Cuál es el proceso de aprobación de compras?', '¿Manejan presupuesto abierto o tiene que aprobar dirección?'],
        objection_handlers: {
          'ya tenemos proveedor': '¿Podría contarme qué tan satisfechos están con los tiempos de entrega y soporte técnico? Muchos de nuestros clientes actuales venían de situaciones similares.',
          'presupuesto congelado': '¿Sabe aproximadamente cuándo podría reactivarse? Puedo enviarle nuestra información para que la tenga lista cuando se libere.',
        },
        closing: 'Me gustaría enviarle un caso de éxito similar al de su empresa. ¿A qué correo le puedo mandar la información?',
      },
    ],
    cadence_templates: [
      {
        name: 'Ciclo largo B2B',
        trigger: 'propuesta_enviada',
        steps: [
          { day: 3, channel: 'email', action: 'Confirmar recepción de propuesta y ofrecer reunión de aclaración' },
          { day: 7, channel: 'phone', action: 'Llamada de seguimiento — preguntar por proceso de evaluación' },
          { day: 14, channel: 'email', action: 'Enviar caso de éxito relevante a su industria' },
          { day: 21, channel: 'task', action: 'Escalar a director comercial si no hay respuesta' },
        ],
      },
    ],
    scoring_rules: [
      { signal: 'Solicita diagnóstico técnico', weight: 9, description: 'Alto nivel de interés real' },
      { signal: 'Comparte especificaciones técnicas', weight: 10, description: 'Avance en proceso de compra' },
      { signal: 'Menciona fecha de proyecto', weight: 8, description: 'Urgencia real definida' },
      { signal: 'Participan múltiples contactos de la empresa', weight: 7, description: 'Proceso de compra comité — señal positiva' },
    ],
    ai_recommended_actions: [
      'Priorizar seguimiento en propuestas con más de 7 días sin respuesta',
      'Identificar decisor económico cuando solo hay contacto técnico',
      'Enviar caso de éxito de industria similar para acelerar aprobación',
      'Alertar sobre fin de ciclo presupuestal del cliente',
    ],
    vocabulary: {
      contact_label: 'Comprador',
      opportunity_label: 'Negociación',
      product_label: 'Solución',
      close_label: 'Orden de compra',
      pipeline_label: 'Proceso comercial',
      stage_label: 'Fase',
      key_action: 'Demo técnica',
    },
  },

  // ── 3. INMOBILIARIA ───────────────────────────────────────────────────────
  inmobiliaria: {
    industry_key: 'inmobiliaria',
    name: 'Inmobiliaria',
    commercial_description: 'Venta o renta de propiedades residenciales o comerciales con visita, pre-aprobación de crédito y cierre notarial.',
    sale_type: 'b2c',
    avg_cycle_days: 90,
    avg_ticket: '$1,200,000 – $8,000,000 MXN',
    pipeline_name: 'Proceso de venta inmobiliaria',
    stages: [
      { key: 'lead_nuevo', label: 'Lead nuevo', description: 'Interesado sin calificación', typical_duration_days: 2, conversion_rate_avg: 0.4 },
      { key: 'calificado', label: 'Calificado', description: 'Capacidad de compra y zona confirmadas', typical_duration_days: 5, conversion_rate_avg: 0.6 },
      { key: 'propiedad_interes', label: 'Propiedad de interés', description: 'Propiedad específica identificada', typical_duration_days: 7, conversion_rate_avg: 0.65 },
      { key: 'visita', label: 'Visita', description: 'Recorrido presencial agendado o realizado', typical_duration_days: 7, conversion_rate_avg: 0.55 },
      { key: 'propuesta_economica', label: 'Propuesta económica', description: 'Condiciones de compra presentadas', typical_duration_days: 10, conversion_rate_avg: 0.5 },
      { key: 'credito', label: 'Crédito en proceso', description: 'Trámite hipotecario iniciado', typical_duration_days: 30, conversion_rate_avg: 0.75 },
      { key: 'documentacion', label: 'Documentación', description: 'Expediente completo en proceso', typical_duration_days: 15, conversion_rate_avg: 0.9 },
      { key: 'cierre', label: 'Cierre notarial', description: 'Escrituración y entrega de llaves', typical_duration_days: 5, conversion_rate_avg: 0.98, is_terminal: true },
    ],
    kpis: [
      { key: 'pipeline_value', label: 'Pipeline activo', unit: 'MXN', benchmark: '>$15M en proceso' },
      { key: 'visitas_semana', label: 'Visitas realizadas', unit: 'por semana', benchmark: '>10 visitas' },
      { key: 'tasa_cierre', label: 'Tasa de cierre', unit: '%', benchmark: '8–15%' },
      { key: 'tiempo_escritura', label: 'Tiempo promedio escritura', unit: 'días', benchmark: '<90 días' },
    ],
    example_products: ['Casa en fraccionamiento', 'Departamento torre', 'Local comercial', 'Terreno residencial', 'Casa en preventa'],
    common_objections: ['Está muy caro', 'Primero vendo mi casa actual', 'El banco no me aprueba el crédito', 'Quiero ver más opciones', 'No me convence la ubicación'],
    message_templates: [
      {
        context: 'primer_contacto',
        channel: 'whatsapp',
        tone: 'warm',
        template: 'Hola {nombre}, soy {vendedor} de {empresa}. Vi que te interesa una propiedad en {zona}. ¿Tienes disponibilidad esta semana para una visita? Tengo algo que creo que te puede gustar mucho.',
      },
    ],
    script_templates: [],
    cadence_templates: [
      {
        name: 'Calificación y visita',
        trigger: 'lead_nuevo',
        steps: [
          { day: 0, channel: 'phone', action: 'Llamada de calificación — zona, presupuesto, forma de pago' },
          { day: 1, channel: 'whatsapp', action: 'Enviar propiedades que corresponden al perfil' },
          { day: 3, channel: 'phone', action: 'Agendar visita' },
          { day: 7, channel: 'whatsapp', action: 'Recordatorio de visita + instrucciones de llegada' },
        ],
      },
    ],
    scoring_rules: [
      { signal: 'Tiene preaprobación bancaria', weight: 10, description: 'Comprador listo para cerrar' },
      { signal: 'Realiza visita', weight: 9, description: 'Alta intención de compra' },
      { signal: 'Menciona fecha de mudanza', weight: 8, description: 'Urgencia definida' },
      { signal: 'Solicita información de crédito', weight: 7, description: 'Interés genuino con intención de financiar' },
    ],
    ai_recommended_actions: [
      'Agendar visita virtual para leads de otras ciudades',
      'Enviar simulador de crédito hipotecario personalizado',
      'Detectar leads con capacidad de compra de contado para escalar',
      'Alertar sobre propiedades con oferta próxima a vencer',
    ],
    vocabulary: {
      contact_label: 'Comprador',
      opportunity_label: 'Prospecto',
      product_label: 'Propiedad',
      close_label: 'Escritura',
      pipeline_label: 'Cartera inmobiliaria',
      stage_label: 'Fase',
      key_action: 'Visita',
    },
  },

  // ── 4. SERVICIOS PROFESIONALES ────────────────────────────────────────────
  servicios_profesionales: {
    industry_key: 'servicios_profesionales',
    name: 'Servicios Profesionales',
    commercial_description: 'Venta consultiva de servicios especializados — consultoría, legal, contable, marketing, tecnología — con diagnóstico, propuesta y contrato.',
    sale_type: 'both',
    avg_cycle_days: 30,
    avg_ticket: '$25,000 – $500,000 MXN',
    pipeline_name: 'Pipeline de servicios',
    stages: [
      { key: 'prospecto', label: 'Prospecto', description: 'Contacto sin interacción previa', typical_duration_days: 2, conversion_rate_avg: 0.5 },
      { key: 'diagnostico', label: 'Reunión de diagnóstico', description: 'Entrevista para entender el problema', typical_duration_days: 5, conversion_rate_avg: 0.7 },
      { key: 'propuesta', label: 'Propuesta enviada', description: 'Alcance, precio y plazos presentados', typical_duration_days: 7, conversion_rate_avg: 0.55 },
      { key: 'negociacion', label: 'Negociación', description: 'Ajuste de condiciones y aprobación', typical_duration_days: 7, conversion_rate_avg: 0.7 },
      { key: 'contrato', label: 'Contrato', description: 'Firma de contrato y pago inicial', typical_duration_days: 3, conversion_rate_avg: 0.92, is_terminal: true },
    ],
    kpis: [
      { key: 'propuestas_activas', label: 'Propuestas activas', unit: 'propuestas', benchmark: '>5 simultáneas' },
      { key: 'tasa_conversion', label: 'Tasa propuesta → contrato', unit: '%', benchmark: '35–50%' },
      { key: 'ticket_promedio', label: 'Ticket promedio', unit: 'MXN', benchmark: 'Meta por servicio' },
      { key: 'nps_referidos', label: 'Clientes que refieren', unit: '%', benchmark: '>30% referidos' },
    ],
    example_products: ['Consultoría estratégica', 'Proyecto de tecnología', 'Auditoría', 'Capacitación empresarial', 'Servicio de marketing'],
    common_objections: ['Tenemos proveedor interno', 'Está fuera de presupuesto', 'Necesitamos aprobación del director', 'No es el momento', 'El resultado no está garantizado'],
    message_templates: [
      {
        context: 'primer_contacto',
        channel: 'email',
        tone: 'consultative',
        template: 'Hola {nombre}, soy {vendedor} de {empresa}. Trabajamos con empresas como {referencia} resolviendo {problema}. ¿Te interesaría una conversación de 20 minutos para explorar si podemos ayudarte?',
      },
    ],
    script_templates: [],
    cadence_templates: [
      {
        name: 'Seguimiento post propuesta',
        trigger: 'propuesta_enviada',
        steps: [
          { day: 2, channel: 'email', action: 'Confirmar recepción de propuesta y ofrecer resolver dudas' },
          { day: 5, channel: 'phone', action: 'Llamada de revisión de propuesta' },
          { day: 10, channel: 'email', action: 'Enviar caso de éxito relevante' },
          { day: 15, channel: 'task', action: 'Tarea manual — evaluar si continúa o se descarta' },
        ],
      },
    ],
    scoring_rules: [
      { signal: 'Comparte detalles del problema', weight: 9, description: 'Alta apertura y necesidad real' },
      { signal: 'Pide referencias de clientes', weight: 8, description: 'Proceso de evaluación avanzado' },
      { signal: 'Involucra a otros decisores', weight: 7, description: 'Oportunidad con peso organizacional' },
    ],
    ai_recommended_actions: [
      'Enviar propuesta personalizada basada en el diagnóstico',
      'Identificar el decisor económico cuando solo hay contacto técnico',
      'Compartir ROI estimado del servicio según su caso',
    ],
    vocabulary: {
      contact_label: 'Prospecto',
      opportunity_label: 'Proyecto',
      product_label: 'Servicio',
      close_label: 'Contrato',
      pipeline_label: 'Pipeline de proyectos',
      stage_label: 'Fase',
      key_action: 'Diagnóstico',
    },
  },

  // ── 5. SAAS / MEMBRESÍAS ──────────────────────────────────────────────────
  saas_membresias: {
    industry_key: 'saas_membresias',
    name: 'SaaS / Membresías',
    commercial_description: 'Captación y retención de suscriptores con ciclos cortos, pruebas gratuitas, upsell y prevención de churn.',
    sale_type: 'both',
    avg_cycle_days: 14,
    avg_ticket: '$800 – $15,000 MXN/mes',
    pipeline_name: 'Funnel de conversión',
    stages: [
      { key: 'registro', label: 'Registro / Trial', description: 'Usuario en período de prueba', typical_duration_days: 7, conversion_rate_avg: 0.35 },
      { key: 'activacion', label: 'Activación', description: 'Usuario completó onboarding y usó el producto', typical_duration_days: 3, conversion_rate_avg: 0.6 },
      { key: 'engagement', label: 'Engagement confirmado', description: 'Uso frecuente en trial', typical_duration_days: 7, conversion_rate_avg: 0.55 },
      { key: 'conversion', label: 'Conversión', description: 'Pasó a plan de pago', typical_duration_days: 2, conversion_rate_avg: 0.9, is_terminal: true },
      { key: 'riesgo_baja', label: 'Riesgo de baja', description: 'Señales de churn detectadas', typical_duration_days: 7, conversion_rate_avg: 0.4 },
    ],
    kpis: [
      { key: 'mrr', label: 'MRR', unit: 'MXN', benchmark: 'Crecimiento >10% mensual' },
      { key: 'trial_conversion', label: 'Trial → pago', unit: '%', benchmark: '>25%' },
      { key: 'churn_rate', label: 'Churn mensual', unit: '%', benchmark: '<3%' },
      { key: 'ltv', label: 'LTV promedio', unit: 'MXN', benchmark: '>12 meses de pago' },
    ],
    example_products: ['Plan Starter', 'Plan Pro', 'Plan Enterprise', 'Add-on IA', 'Asientos adicionales'],
    common_objections: ['Ya uso otra herramienta', 'No tengo tiempo para aprender algo nuevo', 'Es muy caro para mi tamaño', 'Prefiero algo on-premise'],
    message_templates: [
      {
        context: 'trial_inactivo',
        channel: 'email',
        tone: 'warm',
        template: 'Hola {nombre}, notamos que no has explorado la función {feature_clave} en tu prueba. Es la que más impacto tiene para {objetivo}. ¿Puedo ayudarte a configurarla en 10 minutos?',
      },
    ],
    script_templates: [],
    cadence_templates: [
      {
        name: 'Activación de trial',
        trigger: 'registro_trial',
        steps: [
          { day: 0, channel: 'email', action: 'Bienvenida + guía de primeros pasos' },
          { day: 2, channel: 'email', action: 'Primer check-in — ¿completaste el onboarding?' },
          { day: 5, channel: 'phone', action: 'Llamada de éxito — resolver dudas de setup' },
          { day: 7, channel: 'email', action: 'Recordatorio fin de trial + oferta de conversión' },
          { day: 10, channel: 'phone', action: 'Llamada de cierre — decisión de contratar' },
        ],
      },
    ],
    scoring_rules: [
      { signal: 'Usa el producto más de 3 veces por semana', weight: 10, description: 'Engagement alto — listo para conversión' },
      { signal: 'Invita a otros usuarios', weight: 9, description: 'Viral loop — alta intención de contratar' },
      { signal: 'No inicia sesión en 4+ días', weight: -6, description: 'Riesgo de abandono' },
    ],
    ai_recommended_actions: [
      'Enviar demo personalizado basado en industria del usuario',
      'Activar secuencia de retención para usuarios sin actividad 72h',
      'Identificar usuarios listos para conversión por engagement score',
    ],
    vocabulary: {
      contact_label: 'Usuario',
      opportunity_label: 'Cuenta',
      product_label: 'Plan',
      close_label: 'Suscripción',
      pipeline_label: 'Funnel de conversión',
      stage_label: 'Estado',
      key_action: 'Activación',
    },
  },

  // ── 6. CLÍNICAS / SALUD ───────────────────────────────────────────────────
  clinicas_salud: {
    industry_key: 'clinicas_salud',
    name: 'Clínicas y Salud',
    commercial_description: 'Captación de pacientes para procedimientos médicos, tratamientos o consultas con seguimiento de agendamiento y cierre de presupuesto.',
    sale_type: 'b2c',
    avg_cycle_days: 14,
    avg_ticket: '$8,000 – $120,000 MXN',
    pipeline_name: 'Flujo de pacientes',
    stages: [
      { key: 'consulta_info', label: 'Solicitud de información', description: 'Paciente solicitó información del procedimiento', typical_duration_days: 1, conversion_rate_avg: 0.65 },
      { key: 'preconsulta', label: 'Preconsulta', description: 'Evaluación inicial por teléfono o WhatsApp', typical_duration_days: 2, conversion_rate_avg: 0.7 },
      { key: 'cita_evaluacion', label: 'Cita de evaluación', description: 'Consulta médica de valoración agendada', typical_duration_days: 5, conversion_rate_avg: 0.75 },
      { key: 'presupuesto', label: 'Presupuesto enviado', description: 'Plan de tratamiento y costos presentados', typical_duration_days: 5, conversion_rate_avg: 0.55 },
      { key: 'cierre', label: 'Confirmación de procedimiento', description: 'Pago inicial y fecha confirmada', typical_duration_days: 3, conversion_rate_avg: 0.9, is_terminal: true },
    ],
    kpis: [
      { key: 'citas_semana', label: 'Citas generadas', unit: 'por semana', benchmark: '>20 citas' },
      { key: 'conversion_presupuesto', label: 'Presupuesto → procedimiento', unit: '%', benchmark: '>40%' },
      { key: 'ticket_promedio', label: 'Ticket promedio por paciente', unit: 'MXN', benchmark: 'Por especialidad' },
      { key: 'tasa_retencion', label: 'Pacientes que regresan', unit: '%', benchmark: '>50%' },
    ],
    example_products: ['Consulta especialista', 'Procedimiento estético', 'Tratamiento dental', 'Cirugía electiva', 'Chequeo integral'],
    common_objections: ['Es muy caro', 'Tengo miedo', 'Necesito pensarlo con mi familia', 'Primero busco más opciones', 'No tengo tiempo'],
    message_templates: [
      {
        context: 'primer_contacto',
        channel: 'whatsapp',
        tone: 'warm',
        template: 'Hola {nombre}, soy {coordinador} de {clinica}. Vi que preguntaste sobre {procedimiento}. Me da mucho gusto atenderte. ¿Tienes disponibilidad esta semana para una valoración sin costo?',
      },
    ],
    script_templates: [],
    cadence_templates: [
      {
        name: 'Seguimiento de cita',
        trigger: 'solicitud_informacion',
        steps: [
          { day: 0, channel: 'whatsapp', action: 'Respuesta inmediata con información del procedimiento' },
          { day: 1, channel: 'phone', action: 'Llamada de preconsulta — resolver dudas y agendar evaluación' },
          { day: 3, channel: 'whatsapp', action: 'Confirmación de cita + preparación' },
          { day: 7, channel: 'whatsapp', action: 'Reactivación si no agendó — nueva oferta de evaluación' },
        ],
      },
    ],
    scoring_rules: [
      { signal: 'Solicita precio específico', weight: 9, description: 'Intención de compra alta' },
      { signal: 'Pregunta disponibilidad de fechas', weight: 8, description: 'Urgencia definida' },
      { signal: 'Menciona que ya fue con otra clínica', weight: 7, description: 'Comparando — requiere diferenciación' },
    ],
    ai_recommended_actions: [
      'Enviar testimonio de paciente similar para reducir miedo',
      'Programar recordatorio de cita automático 24h antes',
      'Activar secuencia de reactivación para pacientes con presupuesto sin respuesta',
    ],
    vocabulary: {
      contact_label: 'Paciente',
      opportunity_label: 'Caso',
      product_label: 'Procedimiento',
      close_label: 'Confirmación',
      pipeline_label: 'Flujo de pacientes',
      stage_label: 'Fase',
      key_action: 'Cita de evaluación',
    },
  },

  // ── 7. TURISMO MÉDICO ─────────────────────────────────────────────────────
  turismo_medico: {
    industry_key: 'turismo_medico',
    name: 'Turismo Médico',
    commercial_description: 'Atracción de pacientes internacionales para procedimientos médicos con coordinación de traslado, hospedaje y recuperación.',
    sale_type: 'b2c',
    avg_cycle_days: 30,
    avg_ticket: '$3,000 – $25,000 USD',
    pipeline_name: 'Pipeline de paciente internacional',
    stages: [
      { key: 'consulta_info', label: 'Solicitud de información', description: 'Paciente internacional solicitó info del procedimiento', typical_duration_days: 1, conversion_rate_avg: 0.5 },
      { key: 'evaluacion_remota', label: 'Evaluación remota', description: 'Consulta por videollamada o análisis de estudios enviados', typical_duration_days: 5, conversion_rate_avg: 0.65 },
      { key: 'presupuesto', label: 'Presupuesto todo incluido', description: 'Paquete médico + logístico presentado', typical_duration_days: 5, conversion_rate_avg: 0.5 },
      { key: 'coordinacion', label: 'Coordinación de viaje', description: 'Vuelo, hospedaje y fecha de procedimiento definidos', typical_duration_days: 14, conversion_rate_avg: 0.8 },
      { key: 'cierre', label: 'Reserva confirmada', description: 'Anticipo pagado y todo coordinado', typical_duration_days: 3, conversion_rate_avg: 0.95, is_terminal: true },
    ],
    kpis: [
      { key: 'leads_internacionales', label: 'Leads internacionales activos', unit: 'contactos', benchmark: '>50 activos' },
      { key: 'conversion_paquete', label: 'Presupuesto → reserva', unit: '%', benchmark: '>30%' },
      { key: 'ticket_promedio_usd', label: 'Ingreso por paciente', unit: 'USD', benchmark: '>$8,000 USD' },
      { key: 'paises_activos', label: 'Países de origen activos', unit: 'países', benchmark: '>5 países' },
    ],
    example_products: ['Cirugía bariátrica', 'Tratamiento dental integral', 'Cirugía estética', 'Fertilidad y reproducción', 'Ortopedia / columna'],
    common_objections: ['No confío en hospitales fuera de mi país', 'Es muy lejos', 'El idioma es una barrera', 'No sé cómo coordinar el viaje', 'Necesito ver antes de decidir'],
    message_templates: [
      {
        context: 'primer_contacto',
        channel: 'email',
        tone: 'warm',
        template: 'Hello {name}, this is {coordinator} from {clinic}. Thank you for your interest in {procedure}. We have helped over {n} international patients achieve great results. Would you like to schedule a free remote evaluation this week?',
      },
    ],
    script_templates: [],
    cadence_templates: [],
    scoring_rules: [
      { signal: 'Comparte estudios médicos', weight: 10, description: 'Máxima intención — paciente comprometido con el proceso' },
      { signal: 'Pregunta por fechas disponibles', weight: 9, description: 'Listo para reservar' },
      { signal: 'Solicita información de vuelos/hospedaje', weight: 8, description: 'Planificando el viaje activamente' },
    ],
    ai_recommended_actions: [
      'Enviar paquete todo incluido personalizado por procedimiento',
      'Activar coordinador de viaje cuando confirme fecha',
      'Enviar testimoniales de pacientes del mismo país de origen',
    ],
    vocabulary: {
      contact_label: 'Paciente',
      opportunity_label: 'Caso internacional',
      product_label: 'Paquete médico',
      close_label: 'Reserva',
      pipeline_label: 'Pipeline internacional',
      stage_label: 'Fase',
      key_action: 'Evaluación remota',
    },
  },

  // ── 8. TEQUILERA / EXPORTACIÓN B2B ───────────────────────────────────────
  tequilera_exportacion: {
    industry_key: 'tequilera_exportacion',
    name: 'Tequilera / Exportación B2B',
    commercial_description: 'Negociación B2B con importadores, distribuidores y cadenas en el extranjero con ciclos de 3–12 meses, muestras y documentación de exportación.',
    sale_type: 'b2b',
    avg_cycle_days: 120,
    avg_ticket: '$50,000 – $2,000,000 USD',
    pipeline_name: 'Pipeline de exportación',
    stages: [
      { key: 'prospecto', label: 'Importador prospecto', description: 'Importador o distribuidor identificado', typical_duration_days: 5, conversion_rate_avg: 0.4 },
      { key: 'primer_contacto', label: 'Primer contacto', description: 'Comunicación inicial establecida', typical_duration_days: 7, conversion_rate_avg: 0.55 },
      { key: 'muestra_enviada', label: 'Muestra enviada', description: 'Producto físico enviado para evaluación', typical_duration_days: 21, conversion_rate_avg: 0.65 },
      { key: 'negociacion', label: 'Negociación de condiciones', description: 'Precio, volumen, exclusividad y tiempos', typical_duration_days: 30, conversion_rate_avg: 0.6 },
      { key: 'documentacion', label: 'Documentación de exportación', description: 'Permisos, certificaciones y logística', typical_duration_days: 21, conversion_rate_avg: 0.85 },
      { key: 'orden_compra', label: 'Primera orden de compra', description: 'OC de pedido inicial firmada', typical_duration_days: 7, conversion_rate_avg: 0.97, is_terminal: true },
    ],
    kpis: [
      { key: 'paises_activos', label: 'Países en negociación', unit: 'países', benchmark: '>8 activos' },
      { key: 'volumen_pipeline', label: 'Volumen en negociación', unit: 'USD', benchmark: '>$500K activo' },
      { key: 'muestras_enviadas', label: 'Muestras enviadas / mes', unit: 'envíos', benchmark: '>5/mes' },
      { key: 'tiempo_primer_pedido', label: 'Tiempo a primera OC', unit: 'días', benchmark: '<90 días' },
    ],
    example_products: ['Tequila Blanco Premium', 'Tequila Reposado Export', 'Añejo Single Barrel', 'Extra Añejo Reserva', 'Mezcal Artesanal'],
    common_objections: ['Ya tenemos proveedor en México', 'El precio está por encima de nuestro rango', 'Necesitamos verificar las certificaciones', 'Los tiempos de entrega son muy largos', 'Nuestro mercado ya está saturado de tequila'],
    message_templates: [
      {
        context: 'primer_contacto',
        channel: 'email',
        tone: 'formal',
        template: 'Dear {name}, I am reaching out from {company}, a certified Mexican spirits producer. We are currently expanding our distribution network in {country} and believe there could be a strategic fit with {company_prospect}. Would you be open to a brief call to explore this?',
      },
    ],
    script_templates: [],
    cadence_templates: [
      {
        name: 'Seguimiento post muestra',
        trigger: 'muestra_enviada',
        steps: [
          { day: 7, channel: 'email', action: 'Confirmar recepción de muestra y solicitar feedback' },
          { day: 14, channel: 'phone', action: 'Llamada de evaluación — impresión del producto' },
          { day: 21, channel: 'email', action: 'Enviar análisis de mercado del país destino' },
          { day: 30, channel: 'task', action: 'Tarea — iniciar negociación de condiciones si hay interés confirmado' },
        ],
      },
    ],
    scoring_rules: [
      { signal: 'Solicita certificaciones de exportación', weight: 10, description: 'Proceso de diligencia en marcha' },
      { signal: 'Pregunta por volumen mínimo de compra', weight: 9, description: 'Intención real de distribuir' },
      { signal: 'Menciona marca blanca / private label', weight: 8, description: 'Oportunidad de alto valor' },
    ],
    ai_recommended_actions: [
      'Enviar certificaciones vigentes y análisis del mercado destino',
      'Conectar prospecto con referencia de distribuidor del mismo país',
      'Priorizar negociaciones con países de tendencia creciente en consumo',
    ],
    vocabulary: {
      contact_label: 'Importador',
      opportunity_label: 'Negociación',
      product_label: 'SKU de exportación',
      close_label: 'Orden de compra',
      pipeline_label: 'Pipeline de exportación',
      stage_label: 'Fase',
      key_action: 'Muestra enviada',
    },
  },

  // ── 9. SEGUROS ────────────────────────────────────────────────────────────
  seguros: {
    industry_key: 'seguros',
    name: 'Seguros',
    commercial_description: 'Venta de pólizas de seguros de vida, auto, gastos médicos, empresarial o de daños con cotización rápida y cierre en una sesión.',
    sale_type: 'both',
    avg_cycle_days: 10,
    avg_ticket: '$4,000 – $80,000 MXN/año',
    pipeline_name: 'Embudo de cotizaciones',
    stages: [
      { key: 'lead_nuevo', label: 'Lead nuevo', description: 'Prospecto sin calificación', typical_duration_days: 1, conversion_rate_avg: 0.55 },
      { key: 'cotizacion', label: 'Cotización generada', description: 'Propuesta económica presentada', typical_duration_days: 2, conversion_rate_avg: 0.5 },
      { key: 'comparacion', label: 'En comparación', description: 'Evaluando opciones con otras aseguradoras', typical_duration_days: 5, conversion_rate_avg: 0.45 },
      { key: 'decision', label: 'En decisión', description: 'Confirmó interés — pendiente de pago', typical_duration_days: 3, conversion_rate_avg: 0.75 },
      { key: 'emision', label: 'Póliza emitida', description: 'Pago recibido y póliza activa', typical_duration_days: 1, conversion_rate_avg: 0.98, is_terminal: true },
    ],
    kpis: [
      { key: 'cotizaciones_semana', label: 'Cotizaciones por semana', unit: 'por agente', benchmark: '>15/semana' },
      { key: 'tasa_emision', label: 'Cotización → emisión', unit: '%', benchmark: '>30%' },
      { key: 'prima_promedio', label: 'Prima promedio anual', unit: 'MXN', benchmark: '>$12,000/póliza' },
      { key: 'renovacion', label: 'Tasa de renovación', unit: '%', benchmark: '>80%' },
    ],
    example_products: ['Seguro de vida', 'Gastos médicos mayores', 'Seguro de auto', 'Seguro empresarial', 'Seguro de daños'],
    common_objections: ['Ya tengo seguro con otra aseguradora', 'Es muy caro', 'No creo necesitarlo', 'Lo voy a pensar', 'Primero pregunto con mi banco'],
    message_templates: [
      {
        context: 'cotizacion_enviada',
        channel: 'whatsapp',
        tone: 'warm',
        template: 'Hola {nombre}, te envío tu cotización personalizada de {tipo_seguro}. La cobertura incluye {beneficio_principal}. La prima es de ${prima}/mes. ¿Tienes alguna duda que quieras resolver?',
      },
    ],
    script_templates: [],
    cadence_templates: [],
    scoring_rules: [
      { signal: 'Solicita cotización específica', weight: 9, description: 'Intención de compra alta' },
      { signal: 'Pregunta por exclusiones', weight: 7, description: 'Evaluación seria de la póliza' },
      { signal: 'Ya tiene seguro pero busca alternativa', weight: 8, description: 'Cambio activo — alta posibilidad de cierre' },
    ],
    ai_recommended_actions: [
      'Enviar comparativo de coberturas vs competencia',
      'Reactivar pólizas próximas a vencer con oferta de renovación',
      'Alertar sobre leads sin seguimiento a 48h de cotización',
    ],
    vocabulary: {
      contact_label: 'Asegurado',
      opportunity_label: 'Cotización',
      product_label: 'Póliza',
      close_label: 'Emisión',
      pipeline_label: 'Embudo de cotizaciones',
      stage_label: 'Estado',
      key_action: 'Cotización',
    },
  },

  // ── 10. EDUCACIÓN / CAPACITACIÓN ─────────────────────────────────────────
  educacion_capacitacion: {
    industry_key: 'educacion_capacitacion',
    name: 'Educación y Capacitación',
    commercial_description: 'Captación de alumnos o empresas para programas educativos, certificaciones o entrenamientos con inscripción y seguimiento de cohorte.',
    sale_type: 'both',
    avg_cycle_days: 21,
    avg_ticket: '$5,000 – $80,000 MXN',
    pipeline_name: 'Embudo de inscripciones',
    stages: [
      { key: 'interesado', label: 'Interesado', description: 'Solicitó información del programa', typical_duration_days: 1, conversion_rate_avg: 0.55 },
      { key: 'asesorado', label: 'Asesorado', description: 'Tuvo conversación con asesor educativo', typical_duration_days: 3, conversion_rate_avg: 0.65 },
      { key: 'propuesta', label: 'Propuesta enviada', description: 'Plan de pago y beneficios presentados', typical_duration_days: 5, conversion_rate_avg: 0.55 },
      { key: 'en_decision', label: 'En decisión', description: 'Evaluando opciones y consultando familia/empresa', typical_duration_days: 7, conversion_rate_avg: 0.6 },
      { key: 'inscrito', label: 'Inscrito', description: 'Pago inicial recibido e inscripción activa', typical_duration_days: 2, conversion_rate_avg: 0.95, is_terminal: true },
    ],
    kpis: [
      { key: 'leads_activos', label: 'Prospectos activos', unit: 'por cohorte', benchmark: '>80/cohorte' },
      { key: 'tasa_inscripcion', label: 'Asesoría → inscripción', unit: '%', benchmark: '>25%' },
      { key: 'ticket_promedio', label: 'Ingreso por alumno', unit: 'MXN', benchmark: 'Por programa' },
      { key: 'llenado_cohorte', label: 'Cohortes al 100%', unit: '%', benchmark: '>80% de cohortes llenas' },
    ],
    example_products: ['Diplomado ejecutivo', 'Certificación técnica', 'Curso en línea', 'Taller presencial', 'Programa NOM-035'],
    common_objections: ['No tengo tiempo', 'Es muy caro', 'Mi empresa no me paga la capacitación', 'Lo termino pagando yo', 'Ya tomé algo parecido antes'],
    message_templates: [
      {
        context: 'primer_contacto',
        channel: 'whatsapp',
        tone: 'warm',
        template: 'Hola {nombre}, soy {asesor} de {institución}. Te contacto porque mostraste interés en {programa}. La próxima cohorte inicia el {fecha} y quedan {lugares} lugares. ¿Te gustaría platicar sobre el plan de estudios?',
      },
    ],
    script_templates: [],
    cadence_templates: [
      {
        name: 'Urgencia de inscripción',
        trigger: 'fecha_inicio_proxima',
        steps: [
          { day: 0, channel: 'whatsapp', action: 'Recordatorio de fechas límite de inscripción' },
          { day: 2, channel: 'phone', action: 'Llamada de asesoría final — resolver últimas dudas' },
          { day: 4, channel: 'whatsapp', action: 'Oferta especial de cierre — beca parcial o facilidades de pago' },
        ],
      },
    ],
    scoring_rules: [
      { signal: 'Pregunta por fecha de inicio', weight: 8, description: 'Urgencia real de inscribirse' },
      { signal: 'Solicita temario completo', weight: 7, description: 'Evaluación seria del programa' },
      { signal: 'Menciona que su empresa lo patrocina', weight: 9, description: 'Conversión muy probable' },
    ],
    ai_recommended_actions: [
      'Enviar temario personalizado según perfil profesional',
      'Activar cadencia de urgencia 15 días antes del cierre de cohorte',
      'Identificar empresas con múltiples empleados interesados para oferta corporativa',
    ],
    vocabulary: {
      contact_label: 'Prospecto',
      opportunity_label: 'Inscripción',
      product_label: 'Programa',
      close_label: 'Matrícula',
      pipeline_label: 'Embudo de inscripciones',
      stage_label: 'Estado',
      key_action: 'Asesoría',
    },
  },
}

export const getTemplate = (key: IndustryKey): IndustryTemplate => industryTemplates[key]
