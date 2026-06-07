// ─────────────────────────────────────────────────────────────────────────────
// DEMO DATA — Alqia Commercial OS
// Dataset completo por empresa. Al cambiar de empresa en el selector, TODOS
// los datos (contactos, oportunidades, hallazgos IA, interacciones, pipeline)
// cambian para reflejar esa industria. Cero datos de motos en inmobiliaria.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Contact, Opportunity, AiFinding, Interaction,
  Pipeline, PipelineStage,
} from '@/types'

export interface CompanyDataset {
  pipeline: Pipeline
  stages: PipelineStage[]
  contacts: Contact[]
  opportunities: Opportunity[]
  aiFindings: AiFinding[]
  interactions: Interaction[]
}

const T = 'ten_001'
const NOW = '2026-06-06T10:00:00Z'

// ─── Helpers ─────────────────────────────────────────────────────────────────
const contact = (
  id: string, cid: string, fn: string, ln: string,
  phone: string, email: string, city: string, dts: number,
  tags: string[] = [], country = 'México',
): Contact => ({
  id, tenant_id: T, company_id: cid,
  first_name: fn, last_name: ln,
  full_name: `${fn} ${ln}`, normalized_name: `${fn} ${ln}`.toLowerCase(),
  email, normalized_email: email.toLowerCase(),
  phone, normalized_phone: phone, whatsapp_phone: phone,
  city, country,
  preferred_channel: 'whatsapp', consent_status: 'granted',
  data_trust_score: dts, identity_verification_status: 'unverified',
  tags, metadata: {}, status: 'active',
  created_at: '2026-01-10T10:00:00Z', updated_at: '2026-06-01T10:00:00Z',
})

const stage = (
  id: string, pid: string, name: string, i: number,
  prob: number, type: PipelineStage['stage_type'], color: string,
): PipelineStage => ({
  id, tenant_id: T, pipeline_id: pid, name,
  order_index: i, probability_default: prob, stage_type: type,
  color, rules: {}, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z',
})

const opp = (
  id: string, cid: string, pid: string, sid: string, cntid: string, uid: string,
  title: string, product: string, value: number, prob: number,
  intent: number, dts: number, urgency: number,
  last: string, next: string, summary: string,
  currency = 'MXN',
): Opportunity => ({
  id, tenant_id: T, company_id: cid,
  pipeline_id: pid, stage_id: sid, contact_id: cntid,
  owner_user_id: uid,
  title, product_interest: product, estimated_value: value, currency,
  probability: prob, lead_intent_score: intent, data_trust_score: dts, urgency_score: urgency,
  status: 'open',
  last_contact_at: last, next_action_at: next, ai_summary: summary,
  created_at: '2026-04-01T09:00:00Z', updated_at: last,
})

const finding = (
  id: string, cid: string,
  type: AiFinding['finding_type'], sev: AiFinding['severity'],
  title: string, desc: string, count: number,
  metrics: Record<string, number | string>, action: string, conf: number,
): AiFinding => ({
  id, tenant_id: T, company_id: cid,
  finding_type: type, severity: sev, title, description: desc,
  evidence: { count, metrics, explanation: 'Análisis automático Alqia IA.' },
  recommended_action: action, confidence: conf, status: 'new', created_at: NOW,
})

const interaction = (
  id: string, cid: string, oppid: string, cntid: string, uid: string,
  channel: Interaction['channel'], dir: Interaction['direction'],
  summary: string, sentiment: Interaction['sentiment'], occurred: string,
): Interaction => ({
  id, tenant_id: T, company_id: cid,
  opportunity_id: oppid, contact_id: cntid, user_id: uid,
  agent_type: 'user', channel, direction: dir,
  summary, sentiment, metadata: {}, occurred_at: occurred, created_at: occurred,
})

// ─────────────────────────────────────────────────────────────────────────────
// CMP_001 — DEMO AUTOMOTRIZ
// ─────────────────────────────────────────────────────────────────────────────
const moto: CompanyDataset = {
  pipeline: {
    id: 'pip_001', tenant_id: T, company_id: 'cmp_001',
    name: 'Venta de Motocicletas', industry_template: 'automotriz',
    description: 'Pipeline principal Automotriz Demo', is_default: true,
    status: 'active', created_at: '2025-01-15T10:00:00Z', updated_at: NOW,
  },
  stages: [
    stage('s01_001', 'pip_001', 'Lead nuevo',    0,  5,  'intake',        '#718096'),
    stage('s01_002', 'pip_001', 'Validado',      1, 10,  'qualification', '#38BDF8'),
    stage('s01_003', 'pip_001', 'Contactado',    2, 20,  'contact',       '#A7B3C2'),
    stage('s01_004', 'pip_001', 'Interesado',    3, 35,  'qualification', '#FACC15'),
    stage('s01_005', 'pip_001', 'Cita / Test ride', 4, 55, 'proposal',    '#F98058'),
    stage('s01_006', 'pip_001', 'Cotización',    5, 65,  'proposal',      '#F98058'),
    stage('s01_007', 'pip_001', 'Financiamiento',6, 75,  'negotiation',   '#38BDF8'),
    stage('s01_008', 'pip_001', 'Cierre',        7, 90,  'closing',       '#4ADE80'),
    stage('s01_009', 'pip_001', 'Ganado',        8, 100, 'won',           '#4ADE80'),
    stage('s01_010', 'pip_001', 'Perdido',       9, 0,   'lost',          '#FB7185'),
    stage('s01_011', 'pip_001', 'Reactivación', 10, 15,  'reactivation',  '#38BDF8'),
  ],
  contacts: [
    contact('c01_001', 'cmp_001', 'Miguel',  'Torres',   '+5213312345678', 'miguel.torres@gmail.com',    'Guadalajara', 88, ['financiamiento', 'test_ride_completado']),
    contact('c01_002', 'cmp_001', 'Ana',     'Reyes',    '+5213387654321', 'ana.reyes@hotmail.com',      'Guadalajara', 72, ['interesada']),
    contact('c01_003', 'cmp_001', 'Roberto', 'Cruz',     '+5213311223344', 'roberto.cruz@gmail.com',     'Zapopan',     91, ['caliente']),
    contact('c01_004', 'cmp_001', 'Daniela', 'Morales',  '+5213355667788', 'daniela.morales@gmail.com',  'Guadalajara', 95, ['financiamiento', 'urgente']),
    contact('c01_005', 'cmp_001', 'Jorge',   'Salinas',  '+5213322334455', 'jorge.salinas@yahoo.com',    'Tlaquepaque', 65, ['reactivar']),
    contact('c01_006', 'cmp_001', 'Isabel',  'Vargas',   '+5213399887766', 'isabel.vargas@gmail.com',    'Guadalajara', 83, ['cotizacion_enviada']),
    contact('c01_007', 'cmp_001', 'Fernando','Rojas',    '+5213344556677', 'fernando.rojas@live.com',    'Zapopan',     78, ['sin_seguimiento']),
    contact('c01_008', 'cmp_001', 'Sofía',   'Medina',   '+5213366778899', 'sofia.medina@gmail.com',     'Guadalajara', 69, ['nuevo']),
  ],
  opportunities: [
    opp('o01_001','cmp_001','pip_001','s01_007','c01_004','usr_004','Contacto Demo 04 — Moto 650cc','Motocicleta 650cc',159900,75,91,95,88,'2026-06-05T18:00:00Z','2026-06-06T09:00:00Z','Test ride completado. Interés muy alto. Esperando aprobación de financiamiento. Oportunidad prioritaria.'),
    opp('o01_002','cmp_001','pip_001','s01_006','c01_006','usr_005','Contacto Demo 06 — Moto 350cc Clásica','Motocicleta 350cc Clásica',79900,65,76,83,68,'2026-06-04T16:00:00Z','2026-06-07T11:00:00Z','Cotización enviada hace 4 días sin respuesta. Seguimiento urgente vía WhatsApp hoy.'),
    opp('o01_003','cmp_001','pip_001','s01_005','c01_001','usr_004','Contacto Demo 01 — Moto 350cc Deportiva','Motocicleta 350cc Deportiva',89900,55,82,88,74,'2026-06-05T14:30:00Z','2026-06-07T10:00:00Z','Contacto caliente. Preguntó por financiamiento. Quiere agendar test ride.'),
    opp('o01_004','cmp_001','pip_001','s01_004','c01_002','usr_005','Contacto Demo 02 — Moto 350cc','Motocicleta 350cc',79900,20,58,72,45,'2026-06-01T10:00:00Z','2026-06-09T10:00:00Z','Interesada pero pidió tiempo para decidir. Seguimiento programado.'),
    opp('o01_005','cmp_001','pip_001','s01_002','c01_005','usr_004','Contacto Demo 05 — Moto Aventura 450','Moto Aventura 450cc',129900,10,44,65,28,'2026-04-28T09:00:00Z','2026-05-05T09:00:00Z','Sin seguimiento hace 39 días. Lead con WhatsApp válido. Candidato a reactivación.'),
    opp('o01_006','cmp_001','pip_001','s01_003','c01_003','usr_005','Contacto Demo 03 — Moto 350cc Retro','Moto 350cc Retro',74900,20,67,91,55,'2026-06-03T11:00:00Z','2026-06-08T10:00:00Z','Contacto hecho. Interés moderado. Necesita ver opciones de financiamiento.'),
    opp('o01_007','cmp_001','pip_001','s01_001','c01_008','usr_004','Contacto Demo 08 — Moto 350cc Deportiva','Moto 350cc Deportiva',89900,5,35,69,20,'2026-06-06T08:00:00Z','2026-06-07T08:00:00Z','Lead nuevo del día de hoy. Sin contacto previo. Asignar asesor.'),
  ],
  aiFindings: [
    finding('f01_001','cmp_001','follow_up_gap','critical','8 cotizaciones sin seguimiento en más de 5 días','Hay 8 oportunidades en etapa Cotización donde se envió propuesta hace >5 días sin ninguna interacción registrada. El tiempo óptimo post-cotización en automotriz es 48-72h.',8,{avg_days:7.3,value_at_risk:498000},'Crear tarea urgente por cada oportunidad o iniciar cadencia de cierre.',0.99),
    finding('f01_002','cmp_001','forgotten_leads','high','47 leads con datos válidos sin contacto en 60+ días','47 contactos con teléfono válido y WhatsApp probable sin ninguna interacción en más de 60 días. Provienen de campañas Facebook y Google.',47,{avg_data_trust:71,avg_days_sin_contacto:84,whatsapp_disponibles:38},'Activar cadencia de reactivación para los 38 con WhatsApp disponible.',0.94),
    finding('f01_003','cmp_001','conversion_signal','medium','Leads que preguntan por financiamiento cierran 2.4x más rápido','Análisis de 312 conversaciones cerradas: leads que preguntan por financiamiento en primer contacto tienen tasa de cierre 2.4x mayor y ciclo 38% más corto. 23 leads con esta señal sin cadencia activa.',23,{conversion_multiplier:2.4,cycle_reduction_pct:38},'Priorizar contacto humano para los 23 leads con señal de financiamiento.',0.87),
    finding('f01_004','cmp_001','data_quality','medium','134 registros con teléfono sin validar del último lote','Del último CSV importado, 134 registros tienen teléfono presente pero sin validación. 89 son potencialmente contactables por WhatsApp.',134,{whatsapp_potential:89,invalid_estimate:45},'Ejecutar validación de teléfonos para los 134 registros.',0.92),
  ],
  interactions: [
    interaction('i01_001','cmp_001','o01_001','c01_004','usr_004','whatsapp','outbound','IA envió mensaje con opciones de financiamiento. Entregado y leído.','positive','2026-06-05T18:00:00Z'),
    interaction('i01_002','cmp_001','o01_003','c01_001','usr_004','phone','outbound','Llamada de 8 min. El contacto confirmó interés en test ride el sábado.','positive','2026-06-05T14:30:00Z'),
    interaction('i01_003','cmp_001','o01_002','c01_006','usr_005','email','outbound','Cotización enviada con 3 opciones de financiamiento y plan de mensualidades.','neutral','2026-06-04T16:00:00Z'),
    interaction('i01_004','cmp_001','o01_006','c01_003','usr_005','phone','outbound','Primer contacto. El prospecto escuchó el pitch, pide que le envíen información por WhatsApp.','positive','2026-06-03T11:00:00Z'),
    interaction('i01_005','cmp_001','o01_004','c01_002','usr_005','whatsapp','outbound','El contacto respondió que sigue interesada pero quiere pensarlo más. Agenda seguimiento en 7 días.','neutral','2026-06-01T10:00:00Z'),
    interaction('i01_006','cmp_001','o01_001','c01_004','usr_004','system','internal','Oportunidad movida de "Interesado" a "Cita / Test ride" por sistema.','neutral','2026-06-02T09:15:00Z'),
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// CMP_002 — DEMO INDUSTRIAL
// ─────────────────────────────────────────────────────────────────────────────
const industrial: CompanyDataset = {
  pipeline: {
    id: 'pip_002', tenant_id: T, company_id: 'cmp_002',
    name: 'Proceso Comercial Industrial', industry_template: 'distribucion_industrial',
    description: 'Pipeline B2B para distribución de equipo y refacciones industriales.', is_default: true,
    status: 'active', created_at: '2025-02-01T00:00:00Z', updated_at: NOW,
  },
  stages: [
    stage('s02_001', 'pip_002', 'Prospecto',            0,  5,  'intake',        '#718096'),
    stage('s02_002', 'pip_002', 'Reunión de diagnóstico',1, 20,  'qualification', '#38BDF8'),
    stage('s02_003', 'pip_002', 'Requerimiento técnico', 2, 35,  'contact',       '#FACC15'),
    stage('s02_004', 'pip_002', 'Propuesta preliminar',  3, 50,  'proposal',      '#F98058'),
    stage('s02_005', 'pip_002', 'Cotización formal',     4, 60,  'proposal',      '#F98058'),
    stage('s02_006', 'pip_002', 'Revisión técnica',      5, 75,  'negotiation',   '#38BDF8'),
    stage('s02_007', 'pip_002', 'Orden de compra',       6, 95,  'closing',       '#4ADE80'),
    stage('s02_008', 'pip_002', 'Ganado',                7, 100, 'won',           '#4ADE80'),
    stage('s02_009', 'pip_002', 'Perdido',               8, 0,   'lost',          '#FB7185'),
  ],
  contacts: [
    contact('c02_001','cmp_002','Contacto', 'B2B 01',   '+5218110000001','gerente.compras01@industrial-demo.mx',  'Monterrey',   91, ['gerente_compras','b2b']),
    contact('c02_002','cmp_002','Contacto', 'B2B 02',   '+5218110000002','directora.ops02@industrial-demo.mx',    'Monterrey',   88, ['directora_operaciones','b2b']),
    contact('c02_003','cmp_002','Contacto', 'B2B 03',   '+5218110000003','jefe.mant03@industrial-demo.mx',        'Monterrey',   83, ['jefe_mantenimiento','b2b']),
    contact('c02_004','cmp_002','Contacto', 'B2B 04',   '+5218110000004','gerente.compras04@industrial-demo.mx',  'San Pedro',   79, ['gerente_compras','b2b']),
    contact('c02_005','cmp_002','Contacto', 'B2B 05',   '+5218110000005','director.planta05@industrial-demo.mx',  'Monterrey',   74, ['director_planta','b2b']),
    contact('c02_006','cmp_002','Contacto', 'B2B 06',   '+5218110000006','compras06@industrial-demo.mx',          'San Pedro',   87, ['compras','b2b']),
    contact('c02_007','cmp_002','Contacto', 'B2B 07',   '+5218110000007','nuevo.contacto07@industrial-demo.mx',   'Monterrey',   71, ['nuevo_contacto']),
  ],
  opportunities: [
    opp('o02_001','cmp_002','pip_002','s02_004','c02_001','usr_004','Planta Norte — Compresor Industrial','Compresor Industrial GA30',280000,50,78,91,82,'2026-06-03T10:00:00Z','2026-06-09T10:00:00Z','Propuesta preliminar presentada al gerente de compras. Área técnica aún no da visto bueno. Esperando revisión interna.'),
    opp('o02_002','cmp_002','pip_002','s02_006','c02_002','usr_005','Planta Vidrio — Banda Transportadora','Banda Transportadora Especial 800mm',95000,75,84,88,69,'2026-06-05T09:00:00Z','2026-06-07T09:00:00Z','En revisión técnica avanzada. El ing. de mantenimiento aprobó especificaciones. Decisión de compra esta semana.'),
    opp('o02_003','cmp_002','pip_002','s02_005','c02_003','usr_004','Planta Cemento Norte — Válvulas de Control','Válvulas de Control Industrial',185000,60,72,83,75,'2026-06-01T14:00:00Z','2026-06-08T14:00:00Z','Cotización formal enviada hace 5 días. Está en mesa de aprobación con dirección de planta. Presionar suavemente esta semana.'),
    opp('o02_004','cmp_002','pip_002','s02_002','c02_004','usr_005','Grupo Industrial Sur — Bombas Centrífugas','Bombas Centrífugas CM',340000,20,65,79,55,'2026-05-28T11:00:00Z','2026-06-10T11:00:00Z','Reunión de diagnóstico agendada. Necesidad urgente de reemplazo de sistema de bombeo en planta Saltillo.'),
    opp('o02_005','cmp_002','pip_002','s02_001','c02_005','usr_004','Planta Bebidas — Refacciones Motor','Refacciones Motor Eléctrico',67000,5,48,74,40,'2026-06-06T08:00:00Z','2026-06-09T08:00:00Z','Prospecto nuevo. Solicitó catálogo y precios de refacciones para motor instalado en planta. Primera llamada pendiente.'),
    opp('o02_006','cmp_002','pip_002','s02_006','c02_006','usr_005','Industria Alimentos — Sistema Filtración','Sistema de Filtración Industrial',520000,75,89,87,85,'2026-05-15T09:00:00Z','2026-06-06T09:00:00Z','En negociación avanzada. Presupuesto aprobado. Discutiendo plazo de entrega y condiciones de garantía.'),
  ],
  aiFindings: [
    finding('f02_001','cmp_002','follow_up_gap','critical','3 propuestas sin respuesta en más de 7 días hábiles','Las oportunidades de Planta Norte, Planta Cemento y Planta Vidrio llevan entre 5 y 9 días sin actividad registrada. En industrial B2B, el silencio prolongado suele indicar evaluación interna activa — el momento crítico para intervenir con valor diferencial.',3,{avg_days:7.3,value_at_risk:560000},'Enviar email con caso de éxito similar y llamar para confirmar estado de evaluación.',0.96),
    finding('f02_002','cmp_002','opportunity_risk','high','Contacto principal en industria alimentos podría cambiar de empresa','Señales de LinkedIn indican que el decisor actualizó su perfil a "Abierto a oportunidades". Si el contacto cambia, la negociación de $520K queda sin sponsor interno.',1,{deal_value:520000,days_in_stage:22},'Identificar contacto alterno de respaldo antes de que avance la negociación.',0.81),
    finding('f02_003','cmp_002','conversion_signal','medium','Clientes industriales abren plazo de compras Q3 en las próximas 2 semanas','Históricamente las plantas industriales liberan presupuesto de mantenimiento a finales de junio para ejecutar en Q3. Las oportunidades activas tienen alta probabilidad de cerrarse si se presentan antes del día 20.',2,{oportunidades_activas:2,valor_total:252000},'Acelerar proceso con Planta Cemento y Planta Vidrio para cerrar antes del 20 de junio.',0.88),
    finding('f02_004','cmp_002','forgotten_leads','medium','18 prospectos industriales sin contacto en 45+ días','Base de datos de contactos en plantas de Nuevo León con datos válidos de correo corporativo, sin ninguna interacción en más de 45 días.',18,{avg_data_trust:76,avg_days:61},'Enviar email consultivo con análisis de costos de mantenimiento reactivo vs preventivo.',0.83),
  ],
  interactions: [
    interaction('i02_001','cmp_002','o02_001','c02_001','usr_004','meeting','outbound','Reunión en planta industrial Monterrey. 90 min. Diagnóstico técnico completado. Requieren respuesta en propuesta antes del viernes.','positive','2026-06-03T10:00:00Z'),
    interaction('i02_002','cmp_002','o02_002','c02_002','usr_005','email','outbound','Enviada propuesta técnica con especificaciones Planta Vidrio. Adjunto fichas técnicas y plano de instalación.','neutral','2026-05-30T09:00:00Z'),
    interaction('i02_003','cmp_002','o02_006','c02_006','usr_005','phone','outbound','Llamada de seguimiento. Confirma presupuesto aprobado. Discutiendo entrega en 6 semanas vs 4 semanas con costo adicional.','positive','2026-06-05T09:00:00Z'),
    interaction('i02_004','cmp_002','o02_003','c02_003','usr_004','whatsapp','outbound','Seguimiento cotización Planta Cemento. El contacto responde que sigue en revisión. Pedirá respuesta para el jueves.','neutral','2026-06-04T14:00:00Z'),
    interaction('i02_005','cmp_002','o02_004','c02_004','usr_005','email','outbound','Enviado cuestionario de diagnóstico previo a reunión con Industria Sur. El contacto confirma disponibilidad para el miércoles.','positive','2026-05-28T11:00:00Z'),
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// CMP_003 — DEMO INMOBILIARIA
// ─────────────────────────────────────────────────────────────────────────────
const inmobiliaria: CompanyDataset = {
  pipeline: {
    id: 'pip_003', tenant_id: T, company_id: 'cmp_003',
    name: 'Proceso de Venta Inmobiliaria', industry_template: 'inmobiliaria',
    description: 'Pipeline para venta de propiedades residenciales y comerciales.', is_default: true,
    status: 'active', created_at: '2025-03-01T00:00:00Z', updated_at: NOW,
  },
  stages: [
    stage('s03_001', 'pip_003', 'Lead nuevo',          0,  5,  'intake',        '#718096'),
    stage('s03_002', 'pip_003', 'Calificado',          1, 15,  'qualification', '#38BDF8'),
    stage('s03_003', 'pip_003', 'Propiedad de interés',2, 30,  'contact',       '#FACC15'),
    stage('s03_004', 'pip_003', 'Visita',              3, 45,  'proposal',      '#F98058'),
    stage('s03_005', 'pip_003', 'Propuesta económica', 4, 55,  'proposal',      '#F98058'),
    stage('s03_006', 'pip_003', 'Crédito en proceso',  5, 70,  'negotiation',   '#38BDF8'),
    stage('s03_007', 'pip_003', 'Documentación',       6, 85,  'closing',       '#4ADE80'),
    stage('s03_008', 'pip_003', 'Escritura',           7, 100, 'won',           '#4ADE80'),
    stage('s03_009', 'pip_003', 'Perdido',             8, 0,   'lost',          '#FB7185'),
  ],
  contacts: [
    contact('c03_001','cmp_003','Carlos',     'Mendoza',  '+5213312345678','carlos.mendoza@gmail.com',   'Guadalajara', 89, ['preaprobacion','urgente']),
    contact('c03_002','cmp_003','Sofía',      'Hernández','+5218198765432','sofia.hdez@hotmail.com',     'Monterrey',   84, ['departamento','credito_activo']),
    contact('c03_003','cmp_003','Jorge',      'Pedraza',  '+5255512345678','j.pedraza@inversiones.mx',   'CDMX',        92, ['inversionista','local_comercial']),
    contact('c03_004','cmp_003','María Elena','Castro',   '+5213399887766','me.castro@gmail.com',        'Guadalajara', 76, ['preventa','primera_vivienda']),
    contact('c03_005','cmp_003','Contacto', 'Inmob 05', '+5218110000025','inmob.05@demo-contacto.mx',     'Monterrey',   94, ['preaprobacion_bancaria','listo_escriturar']),
    contact('c03_006','cmp_003','Valeria',    'Moreno',   '+5255598765432','valeria.moreno@gmail.com',   'CDMX',        71, ['departamento','nueva']),
    contact('c03_007','cmp_003','Andrés',     'Villanueva','+5213366778899','a.villanueva@empresa.mx',   'Guadalajara', 80, ['cambio_residencia']),
  ],
  opportunities: [
    opp('o03_001','cmp_003','pip_003','s03_007','c03_005','usr_004','Contacto Inmob 05 — Casa Valle Alto 4 rec','Casa Valle Alto 4 rec — $5,200,000',5200000,85,94,94,92,'2026-06-05T15:00:00Z','2026-06-07T09:00:00Z','Documentación completa. El comprador tiene preaprobación bancaria vigente. Escritura lista para la próxima semana. Oportunidad de cierre inmediato.'),
    opp('o03_002','cmp_003','pip_003','s03_006','c03_002','usr_005','Sofía Hernández — Depto Torre Mirador P12','Depto Torre Mirador Piso 12 — $4,800,000',4800000,70,84,84,78,'2026-06-04T11:00:00Z','2026-06-09T11:00:00Z','Crédito hipotecario en trámite con BBVA. Sofía está muy emocionada con la unidad. Riesgo si el banco rechaza; preparar alternativas de financiamiento.'),
    opp('o03_003','cmp_003','pip_003','s03_004','c03_001','usr_004','Carlos Mendoza — Casa Cumbres 3 rec','Casa Cumbres Residencial 3 rec — $3,250,000',3250000,45,89,89,84,'2026-06-03T10:00:00Z','2026-06-07T10:00:00Z','Visita realizada ayer. Carlos quedó muy interesado pero pide reconsiderar precio. Tiene preaprobación INFONAVIT+hipotecario. Urgente enviar contrapropuesta.'),
    opp('o03_004','cmp_003','pip_003','s03_005','c03_003','usr_005','Jorge Pedraza — Local Plaza Norte 45m²','Local Comercial Plaza Norte 45m² — $2,100,000',2100000,55,92,92,70,'2026-06-02T16:00:00Z','2026-06-08T16:00:00Z','Inversionista activo. Quiere estudio de ROI y nivel de afluencia de la plaza. Tiene capital líquido. Propuesta económica enviada con análisis de rentabilidad.'),
    opp('o03_005','cmp_003','pip_003','s03_002','c03_004','usr_004','María Elena Castro — Preventa Las Palmas','Casa Preventa Fracc Las Palmas — $2,650,000',2650000,15,66,76,42,'2026-05-20T09:00:00Z','2026-06-10T09:00:00Z','Calificada. Busca primera vivienda. Evaluando tres opciones en fraccionamientos distintos. Precio clave para su decisión.'),
    opp('o03_006','cmp_003','pip_003','s03_001','c03_006','usr_005','Valeria Moreno — Depto Sky 23','Departamento Sky 23 — $3,950,000',3950000,5,51,71,25,'2026-06-06T07:00:00Z','2026-06-08T07:00:00Z','Lead nuevo hoy. Formulario web desde Portales. Busca departamento en CDMX con 2 rec. Sin contacto previo.'),
  ],
  aiFindings: [
    finding('f03_001','cmp_003','follow_up_gap','critical','Torre Mirador: solo 4 unidades disponibles — riesgo de perder a Sofía','Sofía Hernández tiene crédito en proceso pero hay 3 compradores más consultando la misma unidad esta semana. Si el banco tarda, otra persona puede reservar antes.',1,{unidades_disponibles:4,compradores_activos_misma_unidad:3,dias_credito_en_proceso:12},'Solicitar reserva formal de la unidad y proponer letras de intención mientras el banco responde.',0.97),
    finding('f03_002','cmp_003','opportunity_risk','high','Comprador listo para escriturar — no dejar enfriar','El comprador tiene preaprobación vigente, documentación lista y dijo explícitamente que quiere cerrar "esta semana". Cada día de espera es riesgo.',1,{dias_sin_accion:2,valor:5200000},'Agendar firma de escritura ASAP — proponer miércoles o jueves esta semana.',0.99),
    finding('f03_003','cmp_003','forgotten_leads','high','11 prospectos sin visita después de 14 días de calificación','11 contactos calificados con capacidad de compra confirmada no han agendado visita. El 73% de ventas inmobiliarias se cierra después de la primera visita física.',11,{avg_days_sin_visita:19,tasa_cierre_post_visita:0.73},'Activar cadencia de agendamiento urgente con opciones de fecha esta semana.',0.91),
    finding('f03_004','cmp_003','conversion_signal','medium','Compradores que confirman en <48h post-visita tienen 3x más tasa de cierre','Los datos del CRM muestran que el 82% de ventas cerradas tuvieron seguimiento en las primeras 48h post-visita. Carlos Mendoza visitó ayer.',1,{horas_post_visita:22,tasa_cierre_seguimiento_rapido:0.82},'Contactar a Carlos Mendoza hoy con propuesta de contraoferta antes de que evalúe otras opciones.',0.93),
  ],
  interactions: [
    interaction('i03_001','cmp_003','o03_001','c03_005','usr_004','phone','outbound','Llamada con el comprador. Confirma que documentación está completa y está listo para escriturar. Sugiere miércoles.','positive','2026-06-05T15:00:00Z'),
    interaction('i03_002','cmp_003','o03_003','c03_001','usr_004','whatsapp','outbound','Carlos envió mensaje post-visita: "Me encantó la casa pero el precio está un poco alto. ¿Hay margen?"','neutral','2026-06-03T18:00:00Z'),
    interaction('i03_003','cmp_003','o03_002','c03_002','usr_005','email','outbound','Enviado simulador de crédito BBVA y tabla comparativa de mensualidades a Sofía. Confirma que aplicó.','positive','2026-06-04T11:00:00Z'),
    interaction('i03_004','cmp_003','o03_004','c03_003','usr_005','email','outbound','Enviado análisis de ROI del local comercial: ocupación 94%, afluencia 4,800 visitantes/día, rendimiento estimado 8.2% anual.','positive','2026-06-02T16:00:00Z'),
    interaction('i03_005','cmp_003','o03_003','c03_001','usr_004','meeting','outbound','Recorrido presencial. Carlos llegó con su esposa. Ambos interesados. Preguntan por el espacio del jardín y el clóset principal.','positive','2026-06-02T11:00:00Z'),
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// CMP_004 — DEMO SERVICIOS PROFESIONALES
// ─────────────────────────────────────────────────────────────────────────────
const serviciosPro: CompanyDataset = {
  pipeline: {
    id: 'pip_004', tenant_id: T, company_id: 'cmp_004',
    name: 'Pipeline de Proyectos', industry_template: 'servicios_profesionales',
    description: 'Venta consultiva de servicios de consultoría y capacitación.', is_default: true,
    status: 'active', created_at: '2025-01-01T00:00:00Z', updated_at: NOW,
  },
  stages: [
    stage('s04_001', 'pip_004', 'Prospecto',              0,  5,  'intake',        '#718096'),
    stage('s04_002', 'pip_004', 'Reunión de diagnóstico', 1, 25,  'qualification', '#38BDF8'),
    stage('s04_003', 'pip_004', 'Propuesta enviada',      2, 45,  'proposal',      '#F98058'),
    stage('s04_004', 'pip_004', 'Negociación',            3, 65,  'negotiation',   '#FACC15'),
    stage('s04_005', 'pip_004', 'Contrato firmado',       4, 95,  'closing',       '#4ADE80'),
    stage('s04_006', 'pip_004', 'Ganado',                 5, 100, 'won',           '#4ADE80'),
    stage('s04_007', 'pip_004', 'Perdido',                6, 0,   'lost',          '#FB7185'),
  ],
  contacts: [
    contact('c04_001','cmp_004','Contacto', 'Pro 01',   '+5218110000011','dir.rh01@empresapro.mx',         'San Pedro',   93, ['director_rh','nom035']),
    contact('c04_002','cmp_004','Contacto', 'Pro 02',   '+5218110000012','ceo02@empresapro.mx',             'Monterrey',   88, ['ceo','outplacement']),
    contact('c04_003','cmp_004','Contacto', 'Pro 03',   '+5218110000013','cap.humano03@empresapro.mx',      'Monterrey',   82, ['capital_humano','capacitacion']),
    contact('c04_004','cmp_004','Contacto', 'Pro 04',   '+5255510000014','coo04@empresapro.mx',             'CDMX',        79, ['coo','cultura_org']),
    contact('c04_005','cmp_004','Contacto', 'Pro 05',   '+5255510000015','vp.talento05@empresapro.mx',      'CDMX',        90, ['vp_talento','nom035']),
    contact('c04_006','cmp_004','Contacto', 'Pro 06',   '+5218110000016','dir.general06@empresapro.mx',    'Monterrey',   74, ['director_general','nuevo']),
  ],
  opportunities: [
    opp('o04_001','cmp_004','pip_004','s04_003','c04_005','usr_004','Empresa Digital — NOM-035 620 personas','NOM-035 Certificación y Diagnóstico 620 empleados',520000,45,90,90,88,'2026-05-27T09:00:00Z','2026-06-06T09:00:00Z','Propuesta enviada hace 10 días. El contacto confirmó recepción pero dice que está en revisión con su VP. Deadline fiscal en agosto. Urgente retomar.'),
    opp('o04_002','cmp_004','pip_004','s04_004','c04_002','usr_005','Grupo Empresarial — Outplacement 45 personas','Programa Outplacement 45 colaboradores',290000,65,88,88,79,'2026-06-01T10:00:00Z','2026-06-07T10:00:00Z','En negociación. El CEO quiere reducir 20% el precio y extender el plazo. Hay 2 consultoras más en evaluación. Diferenciador: metodología y testimoniales.'),
    opp('o04_003','cmp_004','pip_004','s04_003','c04_001','usr_004','Empresa Tecnología — NOM-035 + Plan Impl.','Diagnóstico NOM-035 + Plan de Implementación 1,800 empleados',185000,45,73,93,65,'2026-06-03T11:00:00Z','2026-06-09T11:00:00Z','Propuesta enviada. El contacto dice que le gustó la metodología pero necesita revisión de área legal. Cronograma presiona: capacitación debe completarse antes de agosto.'),
    opp('o04_004','cmp_004','pip_004','s04_002','c04_003','usr_005','Cadena Retail — Capacitación Líderes Q3','Programa Capacitación Líderes 80 gerentes — Q3 2026',145000,25,64,82,50,'2026-05-29T09:00:00Z','2026-06-11T09:00:00Z','Reunión de diagnóstico realizada. El contacto quiere propuesta formal con cronograma mensual. Presupuesto de RH para Q3 se define la próxima semana.'),
    opp('o04_005','cmp_004','pip_004','s04_002','c04_004','usr_004','Fintech MX — Consultoría Cultura Org.','Consultoría Cultura Organizacional y Employer Branding',380000,25,68,79,55,'2026-05-25T14:00:00Z','2026-06-08T14:00:00Z','Diagnóstico inicial en proceso. El COO está convencido pero necesita presentar al board. Empresa en rápido crecimiento: 140 empleados este año.'),
    opp('o04_006','cmp_004','pip_004','s04_001','c04_006','usr_005','Constructora Demo — Compensaciones','Plan de Compensaciones y Beneficios competitivo',95000,5,48,74,35,'2026-06-05T08:00:00Z','2026-06-09T08:00:00Z','Prospecto nuevo. El director general buscó en LinkedIn y escribió directo. Empresa constructora 180 personas. Primera reunión por agendar.'),
  ],
  aiFindings: [
    finding('f04_001','cmp_004','follow_up_gap','critical','Empresa Digital: propuesta enviada hace 10 días sin respuesta clara','NOM-035 es obligatorio en México. El deadline fiscal es agosto. Si el VP no firma en junio, el proyecto se mueve a 2027.',1,{dias_sin_respuesta:10,valor:520000,deadline_cliente:'agosto_2026'},'Llamar hoy al VP para preguntar el estado y ofrecer una reunión ejecutiva esta semana.',0.97),
    finding('f04_002','cmp_004','opportunity_risk','high','Outplacement Empresa: 3 consultoras compitiendo — diferenciarse ahora','El CEO mencionó que está evaluando 3 proveedores. La decisión se toma esta semana según su asistente. La negociación activa favorece a quien cierre primero.',1,{competidores:3,dias_para_decision:4,valor:290000},'Enviar testimonial de proyecto similar + carta de garantía de resultados. Diferenciarse en metodología, no en precio.',0.88),
    finding('f04_003','cmp_004','conversion_signal','medium','Clientes con deadline NOM-035 en agosto cierran con 85% de probabilidad en junio','El patrón histórico muestra que empresas con obligación legal cierran servicios NOM-035 2 meses antes del deadline. Empresa Digital y Empresa Tecnología están en este segmento.',2,{tasa_cierre_deadline:0.85,valor_total:705000},'Usar el argumento del deadline legal en las próximas llamadas. Es el driver de decisión más poderoso.',0.91),
    finding('f04_004','cmp_004','forgotten_leads','medium','12 prospectos del Q1 sin retomar después de propuesta enviada','Propuestas enviadas entre enero y marzo sin respuesta. La mayoría tiene nuevo ciclo presupuestal abierto en Q3.',12,{avg_months_sin_contacto:3.5,valor_estimado:890000},'Reactivar con email personalizado: "Su presupuesto Q3 está activo — ¿retomamos?"',0.82),
  ],
  interactions: [
    interaction('i04_001','cmp_004','o04_001','c04_005','usr_004','email','outbound','Propuesta enviada con desglose de fases, entregables, cronograma y ROI estimado.','neutral','2026-05-27T09:00:00Z'),
    interaction('i04_002','cmp_004','o04_002','c04_002','usr_005','phone','outbound','Llamada de negociación con el CEO. Dice que el precio es alto. Exploramos opciones de pago diferido. Quedamos en revisar propuesta ajustada.','neutral','2026-06-01T10:00:00Z'),
    interaction('i04_003','cmp_004','o04_003','c04_001','usr_004','meeting','outbound','Presentación ejecutiva en oficinas del cliente. El director de RH y su equipo asistieron. Mucho interés en la fase de comunicación interna.','positive','2026-06-03T11:00:00Z'),
    interaction('i04_004','cmp_004','o04_004','c04_003','usr_005','email','outbound','Enviado cuestionario de diagnóstico previo a propuesta. El contacto de RH responde que lo revisará con su equipo.','neutral','2026-05-29T09:00:00Z'),
    interaction('i04_005','cmp_004','o04_002','c04_002','usr_005','whatsapp','outbound','WhatsApp: "¿Ya tuviste tiempo de revisar la propuesta ajustada?" Sin respuesta en 2 días.','neutral','2026-06-04T10:00:00Z'),
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// CMP_005 — DEMO SAAS
// ─────────────────────────────────────────────────────────────────────────────
const saas: CompanyDataset = {
  pipeline: {
    id: 'pip_005', tenant_id: T, company_id: 'cmp_005',
    name: 'Funnel de Conversión SaaS', industry_template: 'saas_membresias',
    description: 'Conversión de trials a suscripciones pagadas y expansión de cuentas.', is_default: true,
    status: 'active', created_at: '2025-01-01T00:00:00Z', updated_at: NOW,
  },
  stages: [
    stage('s05_001', 'pip_005', 'Trial activo',         0, 10,  'intake',        '#718096'),
    stage('s05_002', 'pip_005', 'Activado',             1, 30,  'qualification', '#38BDF8'),
    stage('s05_003', 'pip_005', 'Engagement confirmado',2, 55,  'proposal',      '#FACC15'),
    stage('s05_004', 'pip_005', 'Demo ejecutiva',       3, 70,  'negotiation',   '#F98058'),
    stage('s05_005', 'pip_005', 'Suscripción activa',   4, 100, 'won',           '#4ADE80'),
    stage('s05_006', 'pip_005', 'Riesgo de baja',       5, 20,  'reactivation',  '#FB7185'),
    stage('s05_007', 'pip_005', 'Churned',              6, 0,   'lost',          '#FB7185'),
  ],
  contacts: [
    contact('c05_001','cmp_005','Andrés',  'Soto',      '+5255512345678','a.soto@logisticaexpress.mx',  'CDMX',        87, ['trial_activo','engagement_alto']),
    contact('c05_002','cmp_005','Camila',  'Torres',    '+5218198765432','c.torres@meditec.mx',         'Monterrey',   82, ['enterprise_prospect']),
    contact('c05_003','cmp_005','Ricardo', 'Fuentes',   '+5218133445566','r.fuentes@farmaciadigital.mx','Monterrey',   90, ['cto','expansion']),
    contact('c05_004','cmp_005','Laura',   'Vidal',     '+5255587654321','l.vidal@retailtech.mx',       'CDMX',        71, ['ops','soporte_activo']),
    contact('c05_005','cmp_005','Pablo',   'Montes',    '+5255566778899','p.montes@finansmart.mx',      'CDMX',        68, ['trial_vencido','riesgo_churn']),
    contact('c05_006','cmp_005','Diana',   'Espinosa',  '+5218144556677','d.espinosa@grupoalimentos.mx','Monterrey',   85, ['vp_tech','upsell']),
  ],
  opportunities: [
    opp('o05_001','cmp_005','pip_005','s05_003','c05_001','usr_004','Logística Express MX — Plan Pro → Enterprise','Plan Enterprise anual — $68,000/año',68000,55,88,87,82,'2026-06-05T16:00:00Z','2026-06-07T10:00:00Z','Trial día 8. Andrés está usando el sistema diariamente. Importó 3 bases de datos y ya activo 2 cadencias. Señales de conversión muy fuertes. Agendar demo ejecutiva.','MXN'),
    opp('o05_002','cmp_005','pip_005','s05_004','c05_002','usr_005','Meditec Solutions — Plan Enterprise','Plan Enterprise + Módulo IA — anual',96000,70,82,82,75,'2026-06-03T14:00:00Z','2026-06-08T14:00:00Z','Demo ejecutiva agendada para el lunes. Camila Torres involucró a su CEO. Decisión de compra tiene aprobación inminente.','MXN'),
    opp('o05_003','cmp_005','pip_005','s05_003','c05_003','usr_004','Farmacia Digital — Plan Growth + IA','Plan Growth + Add-on IA Comercial — mensual',8400,55,80,90,70,'2026-06-04T11:00:00Z','2026-06-07T11:00:00Z','Ricardo Fuentes quiere el add-on de IA comercial. Aprobación técnica lista. Pendiente aprobación de dirección para el gasto mensual recurrente.','MXN'),
    opp('o05_004','cmp_005','pip_005','s05_006','c05_005','usr_005','FinanSmart — Reactivación trial vencido','Plan Starter o Pro — rescate de trial',1200,20,42,68,65,'2026-06-03T09:00:00Z','2026-06-06T09:00:00Z','Trial venció hace 3 días. Pablo Montes activó el 30% de las funciones. No completó onboarding. Muy recuperable si se interviene hoy con demo personalizada.','MXN'),
    opp('o05_005','cmp_005','pip_005','s05_003','c05_006','usr_004','Grupo Alimentos — Add-on IA Comercial','Add-on IA Comercial sobre Plan Pro existente',2400,55,75,85,68,'2026-06-02T10:00:00Z','2026-06-09T10:00:00Z','Diana Espinosa ya es cliente Plan Pro. Interesada en activar el Add-on IA. Quiere ver caso de uso específico para su equipo de ventas de 40 personas.','MXN'),
    opp('o05_006','cmp_005','pip_005','s05_001','c05_004','usr_005','RetailTech MX — Plan Starter','Plan Starter mensual',1200,10,51,71,30,'2026-06-06T07:00:00Z','2026-06-08T07:00:00Z','Trial día 1. Laura Vidal se registró hoy desde el sitio web. Aún no activó ninguna funcionalidad. Iniciar onboarding check-in.','MXN'),
  ],
  aiFindings: [
    finding('f05_001','cmp_005','conversion_signal','critical','Andrés Soto (Logística Express): listo para convertir — actuar HOY','Andrés tiene el engagement más alto de todos los trials activos: 14 sesiones en 8 días, 3 bases importadas, 2 cadencias activas. Cada día sin conversión es riesgo de que "se acostumbre" al plan gratuito.',1,{sesiones_en_trial:14,features_usadas:8,dias_restantes_trial:6},'Llamar hoy a Andrés para ofrecer descuento de conversión del 20% si suscribe esta semana.',0.97),
    finding('f05_002','cmp_005','follow_up_gap','high','FinanSmart: trial vencido — ventana de rescate cerrándose en 48h','Pablo Montes no completó el onboarding. El 68% de trials que se rescatan en las primeras 72h post-vencimiento convierten. Llevan 72 horas.',1,{horas_post_vencimiento:72,tasa_rescate_72h:0.68},'Llamar ahora mismo a Pablo con demo personalizada para su caso de uso específico.',0.93),
    finding('f05_003','cmp_005','forgotten_leads','high','5 cuentas trial sin activar feature clave en primeros 3 días','Usuarios que no activan la primera cadencia en los primeros 3 días tienen 4x más probabilidad de abandonar. 5 trials actuales en este estado.',5,{avg_features_usadas:1.2,tasa_abandono_sin_activacion:0.78},'Activar secuencia de onboarding asistido para los 5 trials. Llamada corta de 15 min.',0.90),
    finding('f05_004','cmp_005','opportunity_risk','medium','Meditec: demo ejecutiva lunes — preparar caso de uso específico del CEO','El CEO de Meditec viene a la demo del lunes. Si no hay un caso de uso específico para su industria (salud), el deal puede caerse. Preparar con datos reales del sector.',1,{deal_value:96000,dias_para_demo:4},'Preparar deck con casos de uso de Alqia Commercial OS en clínicas y healthtech. Involucrar a director comercial en la demo.',0.88),
  ],
  interactions: [
    interaction('i05_001','cmp_005','o05_001','c05_001','usr_004','phone','outbound','Onboarding call con Andrés. 40 min. Está muy impresionado con el módulo de cadencias. Preguntó por el plan Enterprise.','positive','2026-06-02T10:00:00Z'),
    interaction('i05_002','cmp_005','o05_002','c05_002','usr_005','email','outbound','Confirmación de demo ejecutiva para el lunes 10am. Asistirán Camila Torres, su CEO y directora comercial.','positive','2026-06-03T14:00:00Z'),
    interaction('i05_003','cmp_005','o05_004','c05_005','usr_005','email','outbound','Email de reactivación post-vencimiento. "Pablo, notamos que no tuviste tiempo de explorar el módulo que más valor tiene para tu equipo. ¿15 minutos mañana?"','neutral','2026-06-03T09:00:00Z'),
    interaction('i05_004','cmp_005','o05_005','c05_006','usr_004','whatsapp','outbound','WhatsApp con caso de éxito de empresa similar que usa el Add-on IA. Diana responde interesada, pide datos de ROI.','positive','2026-06-04T11:00:00Z'),
    interaction('i05_005','cmp_005','o05_001','c05_001','usr_004','system','internal','Sistema: Andrés importó base de datos #3 (847 contactos) y activó cadencia de reactivación automáticamente.','positive','2026-06-05T16:00:00Z'),
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// CMP_006 — DEMO SALUD
// ─────────────────────────────────────────────────────────────────────────────
const clinica: CompanyDataset = {
  pipeline: {
    id: 'pip_006', tenant_id: T, company_id: 'cmp_006',
    name: 'Flujo de Pacientes', industry_template: 'clinicas_salud',
    description: 'Captación y conversión de pacientes para procedimientos estéticos y médicos.', is_default: true,
    status: 'active', created_at: '2025-01-01T00:00:00Z', updated_at: NOW,
  },
  stages: [
    stage('s06_001', 'pip_006', 'Solicitud de información',  0, 10,  'intake',        '#718096'),
    stage('s06_002', 'pip_006', 'Preconsulta',               1, 30,  'qualification', '#38BDF8'),
    stage('s06_003', 'pip_006', 'Cita de evaluación',        2, 50,  'contact',       '#FACC15'),
    stage('s06_004', 'pip_006', 'Presupuesto enviado',       3, 60,  'proposal',      '#F98058'),
    stage('s06_005', 'pip_006', 'Confirmación de procedimiento', 4, 90, 'closing',    '#4ADE80'),
    stage('s06_006', 'pip_006', 'Procedimiento realizado',   5, 100, 'won',           '#4ADE80'),
    stage('s06_007', 'pip_006', 'No continuó',               6, 0,   'lost',          '#FB7185'),
  ],
  contacts: [
    contact('c06_001','cmp_006','Valeria',   'Ortiz',   '+5266412345678','valeria.ortiz@gmail.com',   'Tijuana',     88, ['rinoplastia','cita_agendada']),
    contact('c06_002','cmp_006','Héctor',    'Romero',  '+5265598765432','hector.romero@hotmail.com', 'Mexicali',    81, ['liposuccion','presupuesto_enviado']),
    contact('c06_003','cmp_006','Carmen',    'López',   '+16195551234',  'carmen.lopez@gmail.com',   'San Diego',   93, ['dental','lista_confirmar']),
    contact('c06_004','cmp_006','Ana Paula', 'Garza',   '+5266433445566','anapaulagarza@gmail.com',  'Tijuana',     76, ['blefaroplastia','preconsulta']),
    contact('c06_005','cmp_006','Miguel',    'Bernal',  '+12135551234',  'miguel.bernal@yahoo.com',  'Los Angeles', 85, ['bariatrica','evaluacion_remota'], 'EE.UU.'),
    contact('c06_006','cmp_006','Sofía',     'Reyes',   '+5266466778899','sofia.reyes@gmail.com',    'Ensenada',    72, ['implantes','nueva']),
  ],
  opportunities: [
    opp('o06_001','cmp_006','pip_006','s06_004','c06_002','usr_004','Héctor Romero — Liposucción 3 zonas','Liposucción 3 zonas + Recuperación',48000,60,79,81,72,'2026-06-04T10:00:00Z','2026-06-07T10:00:00Z','Presupuesto enviado. Héctor dijo que le parece bien el precio pero quiere hablar con su esposa. Llamar mañana para resolver dudas en pareja.'),
    opp('o06_002','cmp_006','pip_006','s06_005','c06_003','usr_005','Carmen López — Carillas dentales 10 piezas','Carillas Dentales Emax 10 piezas',52000,90,93,93,88,'2026-06-05T14:00:00Z','2026-06-06T09:00:00Z','Carmen lista para confirmar. Lleva 5 días evaluando. Cruzó a Tijuana para consulta presencial. Tiene el dinero en efectivo. Solo necesita un último empujón.'),
    opp('o06_003','cmp_006','pip_006','s06_003','c06_001','usr_004','Valeria Ortiz — Rinoplastia completa','Rinoplastia + Septoplastia',65000,50,80,88,75,'2026-06-03T11:00:00Z','2026-06-07T11:00:00Z','Cita de evaluación con el cirujano ayer. Le gustó el resultado esperado. Esperando el presupuesto final con opciones de financiamiento.'),
    opp('o06_004','cmp_006','pip_006','s06_002','c06_004','usr_005','Ana Paula Garza — Blefaroplastia','Blefaroplastia Superior + Ptosis',22000,30,66,76,50,'2026-06-01T16:00:00Z','2026-06-08T16:00:00Z','Preconsulta por WhatsApp. Ana Paula tiene 2 fotos enviadas. Quiere ver antes/después de casos similares antes de agendar cita presencial.'),
    opp('o06_005','cmp_006','pip_006','s06_003','c06_005','usr_004','Miguel Bernal — Bypass gástrico','Bypass Gástrico + Estancia VIP 3 noches',185000,50,78,85,80,'2026-06-04T17:00:00Z','2026-06-07T17:00:00Z','Evaluación remota realizada. Cirujano aprobó candidatura. Miguel es de Los Ángeles, planea viajar en julio. Necesita presupuesto all-inclusive.','MXN'),
    opp('o06_006','cmp_006','pip_006','s06_001','c06_006','usr_005','Sofía Reyes — Implantes mamarios','Mamoplastia de Aumento + Anestesia',58000,10,52,72,30,'2026-06-06T08:00:00Z','2026-06-08T08:00:00Z','Nueva solicitud de esta mañana. Formulario web. Sofía es de Ensenada. Primera respuesta pendiente.'),
  ],
  aiFindings: [
    finding('f06_001','cmp_006','conversion_signal','critical','Carmen López lista para confirmar — actuar en las próximas 2 horas','Carmen cruzó la frontera para la consulta, tiene el dinero, evaluó opciones 5 días. Cada hora sin acción aumenta el riesgo de que regrese con otra clínica. Tasa de cierre de pacientes en este perfil: 89% si se contactan el mismo día de la consulta.',1,{horas_post_consulta:19,tasa_cierre_mismo_dia:0.89,valor:52000},'Llamar ahora a Carmen. Ofrecer fecha de procedimiento esta semana con descuento de 5% por pago inmediato.',0.98),
    finding('f06_002','cmp_006','follow_up_gap','high','6 presupuestos enviados esta semana sin respuesta confirmada','6 pacientes tienen presupuesto en mano pero no han respondido si confirman o no. El patrón muestra que el 70% de quienes no reciben seguimiento en 72h evalúan otras clínicas.',6,{avg_dias_sin_respuesta:4.2,value_at_risk:285000},'Activar llamada personalizada para cada paciente — priorizar Carmen, Héctor y Valeria.',0.94),
    finding('f06_003','cmp_006','conversion_signal','medium','Pacientes de San Diego/LA convierten 40% más si se les llama por la tarde','Análisis de 84 pacientes frontera norte: conversión 58% si se les contacta entre 3-6pm hora del Pacífico vs 34% en cualquier otro horario.',3,{tasa_conversion_tarde:0.58,pacientes_activos_frontera:3},'Programar llamadas a Carmen López y Miguel Bernal entre 3-6pm hora Pacífico.',0.86),
    finding('f06_004','cmp_006','data_quality','low','8 pacientes sin número WhatsApp validado en los últimos 30 días','Formularios web capturan el teléfono pero sin confirmación de WhatsApp. Canal de mayor conversión en esta industria.',8,{pacientes_sin_wa:8,tasa_conversion_whatsapp:0.61},'Activar mensaje de confirmación automático para validar WhatsApp al registrarse.',0.79),
  ],
  interactions: [
    interaction('i06_001','cmp_006','o06_002','c06_003','usr_005','phone','outbound','Carmen llamó ella misma para preguntar cuándo puede venir. Muy emocionada. Quiere hacerlo lo antes posible. Citando opciones de fecha.','positive','2026-06-05T14:00:00Z'),
    interaction('i06_002','cmp_006','o06_003','c06_001','usr_004','meeting','outbound','Consulta con el Dr. Martínez. Valeria llevó fotos de referencia. Quedó encantada con el plan quirúrgico propuesto.','positive','2026-06-03T11:00:00Z'),
    interaction('i06_003','cmp_006','o06_001','c06_002','usr_004','whatsapp','outbound','Enviado presupuesto detallado a Héctor con opciones de mensualidades. Respondió: "Gracias, lo reviso con mi esposa esta noche."','neutral','2026-06-04T10:00:00Z'),
    interaction('i06_004','cmp_006','o06_005','c06_005','usr_004','meeting','outbound','Video llamada de 45 min con Miguel Bernal y el cirujano. Miguel está en Los Ángeles. Candidatura aprobada.','positive','2026-06-04T17:00:00Z'),
    interaction('i06_005','cmp_006','o06_004','c06_004','usr_005','whatsapp','outbound','Ana Paula envió fotos de referencia por WhatsApp. Coordinadora respondió con galería de antes/después de blefaroplastia.','positive','2026-06-01T16:00:00Z'),
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// CMP_007 — DEMO TURISMO MÉDICO
// ─────────────────────────────────────────────────────────────────────────────
const turismoMedico: CompanyDataset = {
  pipeline: {
    id: 'pip_007', tenant_id: T, company_id: 'cmp_007',
    name: 'Pipeline Internacional', industry_template: 'turismo_medico',
    description: 'Captación de pacientes internacionales para procedimientos médicos en México.', is_default: true,
    status: 'active', created_at: '2025-01-01T00:00:00Z', updated_at: NOW,
  },
  stages: [
    stage('s07_001', 'pip_007', 'Solicitud de información', 0,  5,  'intake',        '#718096'),
    stage('s07_002', 'pip_007', 'Evaluación remota',        1, 25,  'qualification', '#38BDF8'),
    stage('s07_003', 'pip_007', 'Presupuesto all-inclusive',2, 45,  'proposal',      '#FACC15'),
    stage('s07_004', 'pip_007', 'Coordinación de viaje',    3, 70,  'negotiation',   '#F98058'),
    stage('s07_005', 'pip_007', 'Reserva confirmada',       4, 95,  'closing',       '#4ADE80'),
    stage('s07_006', 'pip_007', 'Procedimiento realizado',  5, 100, 'won',           '#4ADE80'),
    stage('s07_007', 'pip_007', 'No continuó',              6, 0,   'lost',          '#FB7185'),
  ],
  contacts: [
    contact('c07_001','cmp_007','Jennifer','Adams',    '+16025551234','jennifer.adams@gmail.com',  'Phoenix',     91, ['bariatrica','vuelo_reservado'], 'EE.UU.'),
    contact('c07_002','cmp_007','Robert',  'Mitchell', '+17135559876','r.mitchell@outlook.com',   'Houston',     86, ['cadera','presupuesto_revisado'], 'EE.UU.'),
    contact('c07_003','cmp_007','Sandra',  'Chen',     '+16045551234','sandra.chen@yahoo.ca',     'Vancouver',   89, ['dental_completo','estudios_enviados'], 'Canadá'),
    contact('c07_004','cmp_007','Michael', 'Torres',   '+13235551234','michael.torres@gmail.com', 'Los Angeles', 92, ['manga_gastrica','confirmado'], 'EE.UU.'),
    contact('c07_005','cmp_007','Patricia','Walsh',    '+13125551234','p.walsh@corporate.com',    'Chicago',     83, ['columna','evaluacion_pendiente'], 'EE.UU.'),
    contact('c07_006','cmp_007','David',   'Kim',      '+14085551234','david.kim@techco.com',     'San Jose',    77, ['fertilidad','informacion_inicial'], 'EE.UU.'),
  ],
  opportunities: [
    opp('o07_001','cmp_007','pip_007','s07_005','c07_004','usr_004','Michael Torres — Manga Gástrica Premium','Gastric Sleeve Premium + VIP Recovery',5900,95,92,92,95,'2026-06-05T13:00:00Z','2026-06-06T08:00:00Z','Reserva confirmada. Michael llegó a Monterrey el 4 de junio. Procedimiento mañana 7am. Todo coordinado.','USD'),
    opp('o07_002','cmp_007','pip_007','s07_004','c07_001','usr_005','Jennifer Adams — Cirugía Bariátrica','Bariatric Surgery Package All-Inclusive',6800,70,91,91,90,'2026-06-05T10:00:00Z','2026-06-06T10:00:00Z','Jennifer tiene vuelo reservado para el 15 de junio. URGENTE: confirmar fecha de cirugía hoy para que no cambie el vuelo. Cirujano disponible el 16.','USD'),
    opp('o07_003','cmp_007','pip_007','s07_003','c07_002','usr_004','Robert Mitchell — Reemplazo de Cadera','Hip Replacement + Rehab 5 días',9200,45,86,86,70,'2026-06-03T09:00:00Z','2026-06-08T09:00:00Z','Presupuesto all-inclusive enviado. Robert pregunta por la experiencia del cirujano ortopedista. Enviar credenciales y testimoniales de pacientes texanos.','USD'),
    opp('o07_004','cmp_007','pip_007','s07_002','c07_003','usr_005','Sandra Chen — Full Mouth Dental','Full Mouth Dental Reconstruction 20 piezas',8400,25,77,89,65,'2026-05-28T14:00:00Z','2026-06-09T14:00:00Z','Evaluación remota con el Dr. Soto. Sandra envió radiografías. Candidata ideal. Esperando plan de tratamiento detallado y fotos del laboratorio dental.','USD'),
    opp('o07_005','cmp_007','pip_007','s07_002','c07_005','usr_004','Patricia Walsh — Cirugía de Columna','Lumbar Spine Surgery L4-L5 + Rehab',11500,25,70,83,60,'2026-06-01T11:00:00Z','2026-06-09T11:00:00Z','Evaluación remota iniciada. Patricia envió MRI y estudios. Neurocirujano los está revisando. Alta complejidad — potencial cliente de alto valor si se maneja bien.','USD'),
    opp('o07_006','cmp_007','pip_007','s07_001','c07_006','usr_005','David Kim — Paquete FIV','IVF + Embryo Transfer Package',4200,10,55,77,35,'2026-06-06T07:00:00Z','2026-06-08T07:00:00Z','Solicitud de información hoy. David Kim de San Jose. Pareja busca FIV. Primera respuesta pendiente.','USD'),
  ],
  aiFindings: [
    finding('f07_001','cmp_007','follow_up_gap','critical','Jennifer Adams tiene vuelo el 15 de junio — confirmar cirugía HOY','Jennifer reservó vuelo hace 3 días pero la cirugía no está formalmente agendada en el quirófano. Si no se confirma hoy, puede cambiar de clínica.',1,{dias_para_vuelo:9,valor_usd:6800},'Llamar a Jennifer en los próximos 30 minutos. Confirmar fecha 16 de junio y enviar protocolo preoperatorio.',0.99),
    finding('f07_002','cmp_007','conversion_signal','high','Texas es el mercado de más rápido crecimiento — 34% vs año anterior','Los leads de Houston y Dallas convierten 28% más que el promedio. Robert Mitchell es el único activo de Texas actualmente. Campaña sugerida para el estado.',1,{crecimiento_texas:0.34,conversion_texas_vs_avg:0.28},'Activar campaña digital dirigida a Houston/Dallas. Usar testimonial de paciente texano si existe.',0.87),
    finding('f07_003','cmp_007','opportunity_risk','medium','Sandra Chen: 9 días sin avance en evaluación dental — paciencia limitada','Pacientes internacionales que no reciben plan de tratamiento en 10 días tienen 61% de probabilidad de buscar otra clínica.',1,{dias_sin_plan:9,valor_usd:8400},'Enviar plan de tratamiento completo con fotos del lab dental antes de este jueves.',0.89),
    finding('f07_004','cmp_007','forgotten_leads','medium','3 leads de Phoenix sin respuesta 48h post-evaluación remota','Mismo perfil demográfico que Jennifer Adams. Todos tienen estudio médico previo y capacidad de pago confirmada.',3,{ciudad:'Phoenix',horas_sin_respuesta:52},'Activar secuencia de seguimiento personalizada con testimoniales de pacientes de Arizona.',0.83),
  ],
  interactions: [
    interaction('i07_001','cmp_007','o07_001','c07_004','usr_004','phone','outbound','Michael confirmó llegada. Todo en orden. Procedimiento mañana 7am. Muy tranquilo y agradecido.','positive','2026-06-05T13:00:00Z'),
    interaction('i07_002','cmp_007','o07_002','c07_001','usr_005','email','outbound','Email a Jennifer con protocolo preoperatorio, lista de documentos para cruzar y opciones de fecha de cirugía.','positive','2026-06-05T10:00:00Z'),
    interaction('i07_003','cmp_007','o07_004','c07_003','usr_005','email','outbound','Sandra envió todas las radiografías por WeTransfer. Confirmación recibida. Pendiente revisión del Dr. Soto.','neutral','2026-05-28T14:00:00Z'),
    interaction('i07_004','cmp_007','o07_003','c07_002','usr_004','phone','outbound','Llamada con Robert. Preocupado por la experiencia del cirujano. Enviando credenciales del Dr. Navarro y 3 testimoniales de pacientes de Houston.','neutral','2026-06-03T09:00:00Z'),
    interaction('i07_005','cmp_007','o07_005','c07_005','usr_004','meeting','outbound','Video consulta con Patricia y el neurocirujano. 60 min. Caso complejo L4-L5. Patricia muy interesada si hay disponibilidad en julio.','positive','2026-06-01T11:00:00Z'),
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// CMP_008 — DEMO EXPORTACIÓN B2B
// ─────────────────────────────────────────────────────────────────────────────
const tequila: CompanyDataset = {
  pipeline: {
    id: 'pip_008', tenant_id: T, company_id: 'cmp_008',
    name: 'Pipeline de Exportación', industry_template: 'tequilera_exportacion',
    description: 'Negociación B2B con importadores y distribuidores internacionales.', is_default: true,
    status: 'active', created_at: '2025-01-01T00:00:00Z', updated_at: NOW,
  },
  stages: [
    stage('s08_001', 'pip_008', 'Importador prospecto',       0,  5,  'intake',        '#718096'),
    stage('s08_002', 'pip_008', 'Primer contacto',            1, 15,  'qualification', '#38BDF8'),
    stage('s08_003', 'pip_008', 'Muestra enviada',            2, 30,  'contact',       '#FACC15'),
    stage('s08_004', 'pip_008', 'Negociación de condiciones', 3, 55,  'negotiation',   '#F98058'),
    stage('s08_005', 'pip_008', 'Documentación exportación',  4, 75,  'closing',       '#38BDF8'),
    stage('s08_006', 'pip_008', 'Primera orden de compra',    5, 95,  'closing',       '#4ADE80'),
    stage('s08_007', 'pip_008', 'Cliente activo',             6, 100, 'won',           '#4ADE80'),
    stage('s08_008', 'pip_008', 'No continuó',                7, 0,   'lost',          '#FB7185'),
  ],
  contacts: [
    contact('c08_001','cmp_008','Takashi', 'Yamamoto', '+81335551234', 'yamamoto@spiritsimport.jp',    'Tokyo',     90, ['reposado','muestra_evaluada'], 'Japón'),
    contact('c08_002','cmp_008','Klaus',   'Weber',    '+493012345678','k.weber@weberdrinks.de',       'Berlin',    87, ['anejo_premium','negociacion'], 'Alemania'),
    contact('c08_003','cmp_008','James',   'O\'Brien', '+13125559876', 'jobrien@midwestliquors.com',   'Chicago',   93, ['private_label','documentacion'], 'EE.UU.'),
    contact('c08_004','cmp_008','Carlos',  'Reyes',    '+13055551234', 'creyes@latinspirits.us',       'Miami',     81, ['reposado_cristalino','nuevo'], 'EE.UU.'),
    contact('c08_005','cmp_008','Marie',   'Dubois',   '+33145551234', 'marie.dubois@vins-spirits.fr', 'Paris',     88, ['extra_anejo','cata_realizada'], 'Francia'),
    contact('c08_006','cmp_008','Peter',   'van der Berg','+31205551234','p.vdberg@dspirits.nl',     'Amsterdam', 79, ['portfolio_blanco','primer_contacto'], 'Países Bajos'),
  ],
  opportunities: [
    opp('o08_001','cmp_008','pip_008','s08_005','c08_003','usr_004','Midwest Liquors — Private Label Blanco','Tequila Blanco NOM Certified — Private Label 10,000 botellas',220000,75,93,93,85,'2026-06-04T15:00:00Z','2026-06-07T15:00:00Z','Documentación en trámite. O\'Brien tiene los permisos TTB casi listos. El único bloqueador es el certificado de análisis del CRT actualizado. Gestionar hoy.','USD'),
    opp('o08_002','cmp_008','pip_008','s08_004','c08_002','usr_005','Weber Drinks Berlin — Añejo Premium','Añejo Single Barrel 750ml — 2,400 botellas primera orden',145000,55,87,87,79,'2026-06-03T10:00:00Z','2026-06-08T10:00:00Z','En negociación. Klaus quiere precio CIF Hamburg y exclusividad regional Alemania/Austria por 18 meses. Analizar viabilidad de exclusividad antes de responder.','USD'),
    opp('o08_003','cmp_008','pip_008','s08_003','c08_001','usr_004','Spirits Import Japan — Reposado Gran Reserva','Reposado Gran Reserva 750ml — 1,200 botellas',58000,30,78,90,70,'2026-05-20T09:00:00Z','2026-06-06T09:00:00Z','Muestra enviada hace 17 días. Yamamoto mencionó que su equipo la está evaluando. Silencio preocupante. El mercado japonés es lento pero el feedback es crítico para avanzar.','USD'),
    opp('o08_004','cmp_008','pip_008','s08_003','c08_005','usr_005','Vins & Spirits París — Extra Añejo Reserva','Extra Añejo Reserva 10 años — 600 botellas',98000,30,78,88,65,'2026-05-15T14:00:00Z','2026-06-09T14:00:00Z','Cata virtual realizada con Marie Dubois. Quedó muy impresionada con el extra añejo. Enviando análisis del mercado premium francés para acelerar decisión.','USD'),
    opp('o08_005','cmp_008','pip_008','s08_001','c08_004','usr_004','Latin Spirits Miami — Reposado Cristalino','Reposado Cristalino 750ml + Reposado Clásico — mix 3,000 botellas',37000,5,59,81,40,'2026-06-05T08:00:00Z','2026-06-09T08:00:00Z','Prospecto nuevo. Carlos Reyes de Miami se contactó por LinkedIn. Especialista en el mercado hispano de EE.UU. Primera llamada por agendar.','USD'),
    opp('o08_006','cmp_008','pip_008','s08_002','c08_006','usr_005','Dutch Spirits Amsterdam — Portfolio Completo','House Blanco + Reposado Portfolio — 1,800 botellas',82000,15,62,79,48,'2026-05-28T11:00:00Z','2026-06-10T11:00:00Z','Primer contacto realizado. Peter van der Berg es importador establecido. Revisando el catálogo y las certificaciones NOM. Enviar dossier completo de exportación.','USD'),
  ],
  aiFindings: [
    finding('f08_001','cmp_008','follow_up_gap','critical','Yamamoto lleva 17 días evaluando muestra — el silencio en Japón no es rechazo','En la cultura de negocios japonesa, el silencio prolongado durante evaluación es normal, pero pasados los 20 días indica que necesitan más información o un nudge de cortesía.',1,{dias_sin_feedback:17,valor_usd:58000},'Enviar email en japonés (o con traducción) de seguimiento cortés preguntando por la evaluación y ofreciendo ficha técnica adicional.',0.88),
    finding('f08_002','cmp_008','opportunity_risk','high','O\'Brien bloqueado por certificado CRT — riesgo de perder el deal TTB','El permiso TTB de James O\'Brien tiene fecha límite. Si el certificado CRT no llega esta semana, el trámite se retrasa 60 días y el deal puede caerse.',1,{valor_usd:220000,dias_para_deadline_ttb:5},'Gestionar certificado de análisis CRT hoy como urgente. Llamar directamente a la agencia certificadora.',0.96),
    finding('f08_003','cmp_008','conversion_signal','medium','Q4 es temporada crítica de pedidos para importadores europeos — preparar ahora','Los importadores europeos cierran pedidos para las fiestas en agosto-septiembre para entrega en octubre. Weber y Dubois están en ventana de decisión crítica.',2,{meses_para_q4:3,importadores_europeos_activos:2,valor_potencial:243000},'Acelerar negociación con Weber y Dubois. Proponer incentivo de cierre en junio para garantizar entrega Q4.',0.91),
    finding('f08_004','cmp_008','forgotten_leads','medium','4 contactos de distribuidores USA sin seguimiento en 30+ días','Base de contactos de brokers y distribuidores en California y Texas sin actividad reciente. Mercado en crecimiento.', 4,{avg_days:38,mercado:'USA'},'Reactivar con newsletter de exportación + datos de tendencias del mercado de tequila premium en EE.UU.',0.80),
  ],
  interactions: [
    interaction('i08_001','cmp_008','o08_003','c08_001','usr_004','email','outbound','Enviado dossier de exportación a Yamamoto: certificaciones NOM, CRT, análisis de laboratorio, ficha técnica del Reposado Gran Reserva.','neutral','2026-05-20T09:00:00Z'),
    interaction('i08_002','cmp_008','o08_002','c08_002','usr_005','meeting','outbound','Video llamada de negociación con Klaus Weber. 75 min. Discutimos precio FOB vs CIF, MOQ y la posibilidad de exclusividad regional.','neutral','2026-06-03T10:00:00Z'),
    interaction('i08_003','cmp_008','o08_001','c08_003','usr_004','email','outbound','Email legal con instrucciones para trámite TTB y documento de autorización del productor NOM-1199.','neutral','2026-06-02T14:00:00Z'),
    interaction('i08_004','cmp_008','o08_004','c08_005','usr_005','meeting','outbound','Cata virtual Zoom. Marie y su sommelier evaluaron el Extra Añejo. Reacción entusiasta. "C\'est extraordinaire" — solicitó análisis del mercado premium francés.','positive','2026-05-15T14:00:00Z'),
    interaction('i08_005','cmp_008','o08_006','c08_006','usr_005','email','outbound','Primer contacto formal. Enviado catálogo de exportación, certificaciones y condiciones comerciales a Peter van der Berg.','neutral','2026-05-28T11:00:00Z'),
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// MAPA PRINCIPAL — lookup por company_id
// ─────────────────────────────────────────────────────────────────────────────
export const demoDatasets: Record<string, CompanyDataset> = {
  cmp_001: moto,
  cmp_002: industrial,
  cmp_003: inmobiliaria,
  cmp_004: serviciosPro,
  cmp_005: saas,
  cmp_006: clinica,
  cmp_007: turismoMedico,
  cmp_008: tequila,
}

export const getDataset = (companyId: string): CompanyDataset =>
  demoDatasets[companyId] ?? moto
