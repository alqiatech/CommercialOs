import { z } from 'zod'

// ─────────────────────────────────────────────────────────────────────────────
// Schemas para el importador
// ─────────────────────────────────────────────────────────────────────────────

export const DESTINATION_FIELDS = [
  'full_name', 'first_name', 'last_name',
  'email', 'phone', 'whatsapp_phone', 'city', 'state', 'country', 'company',
  'product_interest', 'source', 'campaign', 'created_at',
  'owner', 'comments', 'consent_status', 'estimated_value', 'skip',
] as const

export type DestinationField = typeof DESTINATION_FIELDS[number]

export const DESTINATION_FIELD_LABELS: Record<DestinationField, string> = {
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
  comments: 'Comentarios / Notas',
  consent_status: 'Consentimiento',
  estimated_value: 'Valor estimado',
  skip: '— Ignorar columna —',
}

export const ColumnMappingSchema = z.record(z.enum(DESTINATION_FIELDS))

export const ProcessImportInput = z.object({
  rows: z.array(z.record(z.string())).max(5000),
  mapping: ColumnMappingSchema,
  company_id: z.string().min(1),
  industry_template: z.string().default('automotriz'),
  filename: z.string().optional(),
  user_id: z.string().optional(),
})

export type ProcessImportInput = z.infer<typeof ProcessImportInput>
