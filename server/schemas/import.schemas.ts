import { z } from 'zod'

// ─────────────────────────────────────────────────────────────────────────────
// Schemas para el importador
// ─────────────────────────────────────────────────────────────────────────────

export const DESTINATION_FIELDS = [
  'full_name', 'first_name', 'last_name',
  'email', 'phone', 'city', 'state', 'company',
  'product_interest', 'source', 'created_at',
  'owner', 'comments', 'consent_status', 'skip',
] as const

export type DestinationField = typeof DESTINATION_FIELDS[number]

export const DESTINATION_FIELD_LABELS: Record<DestinationField, string> = {
  full_name: 'Nombre completo',
  first_name: 'Nombre',
  last_name: 'Apellido',
  email: 'Correo electrónico',
  phone: 'Teléfono',
  city: 'Ciudad',
  state: 'Estado',
  company: 'Empresa',
  product_interest: 'Producto / Interés',
  source: 'Fuente',
  created_at: 'Fecha de captura',
  owner: 'Responsable',
  comments: 'Comentarios / Notas',
  consent_status: 'Consentimiento',
  skip: '— Ignorar columna —',
}

export const ColumnMappingSchema = z.record(z.enum(DESTINATION_FIELDS))

export const ProcessImportInput = z.object({
  rows: z.array(z.record(z.string())).max(5000),
  mapping: ColumnMappingSchema,
  company_id: z.string().default('cmp_001'),
  industry_template: z.string().default('automotriz'),
})

export type ProcessImportInput = z.infer<typeof ProcessImportInput>
