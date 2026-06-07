import type { ImportBatch, Cadence, CadenceStep } from '@/types'

export const mockImportBatches: ImportBatch[] = [
  {
    id: 'imp_001', tenant_id: 'ten_001', company_id: 'cmp_001',
    file_name: 'leads_facebook_mayo_2026.csv',
    file_url: '/mock/files/leads_facebook_mayo_2026.csv',
    source_type: 'csv', imported_by: 'usr_002',
    total_rows: 312, processed_rows: 312,
    valid_rows: 247, invalid_rows: 43, duplicate_rows: 22,
    status: 'completed',
    mapping: {
      'Nombre': 'first_name', 'Apellido': 'last_name',
      'Celular': 'phone', 'Correo': 'email',
      'Ciudad': 'city', 'Modelo': 'product_interest',
      'Fecha': 'created_at', 'Fuente': 'source_name',
    },
    summary: {
      contacts_created: 225, contacts_updated: 22,
      opportunities_created: 247, avg_data_trust_score: 68,
      ready_for_cadence: 189,
    },
    created_at: '2026-06-01T09:00:00Z', completed_at: '2026-06-01T09:03:42Z',
  },
  {
    id: 'imp_002', tenant_id: 'ten_001', company_id: 'cmp_001',
    file_name: 'base_historica_2024.xlsx',
    file_url: '/mock/files/base_historica_2024.xlsx',
    source_type: 'excel', imported_by: 'usr_002',
    total_rows: 1840, processed_rows: 1840,
    valid_rows: 1102, invalid_rows: 521, duplicate_rows: 217,
    status: 'completed',
    mapping: {
      'nombre_completo': 'full_name',
      'telefono': 'phone', 'email': 'email',
      'ciudad': 'city', 'moto_interes': 'product_interest',
      'fecha_registro': 'created_at',
    },
    summary: {
      contacts_created: 1085, contacts_updated: 17,
      opportunities_created: 1102, avg_data_trust_score: 52,
      ready_for_cadence: 634,
    },
    created_at: '2026-05-15T14:00:00Z', completed_at: '2026-05-15T14:08:20Z',
  },
]

const cadenceStepsMoto: CadenceStep[] = [
  {
    id: 'stp_001', tenant_id: 'ten_001', cadence_id: 'cad_001',
    order_index: 0, delay_amount: 0, delay_unit: 'hours',
    channel: 'whatsapp', action_type: 'send_message',
    template_id: 'tpl_whatsapp_bienvenida_moto',
    requires_approval: false, stop_on_reply: true, stop_on_conversion: true,
    rules: {}, created_at: '2026-05-01T10:00:00Z', updated_at: '2026-05-01T10:00:00Z',
  },
  {
    id: 'stp_002', tenant_id: 'ten_001', cadence_id: 'cad_001',
    order_index: 1, delay_amount: 1, delay_unit: 'days',
    channel: 'phone', action_type: 'make_call',
    requires_approval: false, stop_on_reply: true, stop_on_conversion: true,
    rules: {}, created_at: '2026-05-01T10:00:00Z', updated_at: '2026-05-01T10:00:00Z',
  },
  {
    id: 'stp_003', tenant_id: 'ten_001', cadence_id: 'cad_001',
    order_index: 2, delay_amount: 3, delay_unit: 'days',
    channel: 'whatsapp', action_type: 'send_message',
    template_id: 'tpl_whatsapp_propuesta_moto',
    requires_approval: false, stop_on_reply: true, stop_on_conversion: true,
    rules: {}, created_at: '2026-05-01T10:00:00Z', updated_at: '2026-05-01T10:00:00Z',
  },
  {
    id: 'stp_004', tenant_id: 'ten_001', cadence_id: 'cad_001',
    order_index: 3, delay_amount: 5, delay_unit: 'days',
    channel: 'phone', action_type: 'create_task',
    requires_approval: false, stop_on_reply: true, stop_on_conversion: true,
    rules: {}, created_at: '2026-05-01T10:00:00Z', updated_at: '2026-05-01T10:00:00Z',
  },
  {
    id: 'stp_005', tenant_id: 'ten_001', cadence_id: 'cad_001',
    order_index: 4, delay_amount: 7, delay_unit: 'days',
    channel: 'email', action_type: 'send_email',
    template_id: 'tpl_email_seguimiento_moto',
    requires_approval: false, stop_on_reply: true, stop_on_conversion: true,
    rules: {}, created_at: '2026-05-01T10:00:00Z', updated_at: '2026-05-01T10:00:00Z',
  },
]

export const mockCadences: Cadence[] = [
  {
    id: 'cad_001', tenant_id: 'ten_001', company_id: 'cmp_001',
    name: 'Bienvenida Lead Nuevo — Motocicletas',
    industry_template: 'automotive_b2c',
    description: 'Cadencia de 5 pasos para leads nuevos de motocicletas. WhatsApp → Llamada IA → WhatsApp propuesta → Llamada humana → Email.',
    trigger_type: 'import_batch', target_type: 'opportunity',
    status: 'active',
    rules: {
      no_weekends: true, allowed_hours_start: 9, allowed_hours_end: 20,
      max_attempts_per_week: 3, pause_on_reply: true, pause_on_conversion: true,
      exclude_do_not_contact: true,
    },
    created_by: 'usr_002',
    enrollment_count: 189, reply_rate: 0.34, conversion_rate: 0.12,
    created_at: '2026-05-01T10:00:00Z', updated_at: '2026-06-01T08:00:00Z',
    steps: cadenceStepsMoto,
  },
  {
    id: 'cad_002', tenant_id: 'ten_001', company_id: 'cmp_001',
    name: 'Reactivación Base Histórica',
    industry_template: 'automotive_b2c',
    description: 'Cadencia para leads con más de 90 días sin contacto y datos válidos.',
    trigger_type: 'ai_recommendation', target_type: 'opportunity',
    status: 'paused',
    rules: {
      no_weekends: true, allowed_hours_start: 10, allowed_hours_end: 18,
      max_attempts_per_week: 2, pause_on_reply: true, pause_on_conversion: true,
      exclude_do_not_contact: true,
    },
    created_by: 'usr_002',
    enrollment_count: 0, reply_rate: 0, conversion_rate: 0,
    created_at: '2026-06-05T10:00:00Z', updated_at: '2026-06-05T10:00:00Z',
    steps: [],
  },
]
