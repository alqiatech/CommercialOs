import type { DestinationField } from '../schemas/import.schemas'

// ─────────────────────────────────────────────────────────────────────────────
// columnMapper — Detecta automáticamente el mapeo probable de columnas
// Sin IA: solo reglas determinísticas de similitud textual
// ─────────────────────────────────────────────────────────────────────────────

type MatchRule = { patterns: string[]; destination: DestinationField }

const RULES: MatchRule[] = [
  { patterns: ['nombre completo', 'full_name', 'fullname', 'nombre y apellido'], destination: 'full_name' },
  { patterns: ['nombre', 'first_name', 'firstname', 'first name', 'name'], destination: 'first_name' },
  { patterns: ['apellido', 'last_name', 'lastname', 'last name', 'surname'], destination: 'last_name' },
  { patterns: ['correo', 'email', 'e-mail', 'mail', 'correo electronico', 'email address'], destination: 'email' },
  { patterns: ['telefono', 'teléfono', 'phone', 'cel', 'celular', 'movil', 'móvil', 'whatsapp', 'tel', 'phone number'], destination: 'phone' },
  { patterns: ['ciudad', 'city', 'municipio'], destination: 'city' },
  { patterns: ['estado', 'state', 'provincia', 'region', 'región'], destination: 'state' },
  { patterns: ['empresa', 'company', 'compania', 'compañia', 'negocio', 'razon social', 'razón social'], destination: 'company' },
  { patterns: ['producto', 'product', 'interes', 'interés', 'interest', 'modelo', 'servicio', 'product_interest'], destination: 'product_interest' },
  { patterns: ['fuente', 'source', 'origen', 'canal', 'procedencia', 'lead_source'], destination: 'source' },
  { patterns: ['fecha', 'date', 'created', 'fecha de captura', 'fecha_registro', 'fecha registro', 'created_at'], destination: 'created_at' },
  { patterns: ['responsable', 'owner', 'vendedor', 'asesor', 'agente', 'assigned_to'], destination: 'owner' },
  { patterns: ['comentario', 'comment', 'nota', 'notes', 'observacion', 'observación', 'notas'], destination: 'comments' },
  { patterns: ['consentimiento', 'consent', 'autoriza', 'gdpr', 'consent_status', 'acepta'], destination: 'consent_status' },
]

function normalize(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/\p{M}/gu, '')  // quitar acentos
    .replace(/[^a-z0-9\s_]/g, '')
    .trim()
}

export function detectColumnMapping(headers: string[]): Record<string, DestinationField> {
  const mapping: Record<string, DestinationField> = {}
  const used = new Set<DestinationField>()

  for (const header of headers) {
    const norm = normalize(header)
    let matched: DestinationField | null = null

    for (const rule of RULES) {
      if (used.has(rule.destination)) continue
      for (const pattern of rule.patterns) {
        if (norm === normalize(pattern) || norm.includes(normalize(pattern))) {
          matched = rule.destination
          break
        }
      }
      if (matched) break
    }

    if (matched) {
      mapping[header] = matched
      used.add(matched)
    } else {
      mapping[header] = 'skip'
    }
  }

  return mapping
}
