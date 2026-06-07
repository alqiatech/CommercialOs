import type { CleanedLead } from './dataCleaner'

// ─────────────────────────────────────────────────────────────────────────────
// dedupeEngine — Detección de duplicados sin borrar físicamente nada
// Reglas determinísticas por prioridad:
//   1. email exacto
//   2. teléfono E.164 exacto
//   3. nombre + teléfono últimos 6 dígitos
//   4. nombre + email
// ─────────────────────────────────────────────────────────────────────────────

export type DuplicateType =
  | 'email_exact'
  | 'phone_exact'
  | 'name_phone'
  | 'name_email'
  | 'none'

export interface DuplicateResult {
  is_duplicate: boolean
  type: DuplicateType
  duplicate_of_index?: number  // índice del registro original en el array
}

function normName(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]/g, '')
}

export function detectDuplicates(leads: CleanedLead[]): DuplicateResult[] {
  const results: DuplicateResult[] = leads.map(() => ({ is_duplicate: false, type: 'none' as DuplicateType }))

  // Índices de registros ya procesados para lookup
  const emailIndex = new Map<string, number>()
  const phoneIndex = new Map<string, number>()
  const namePhoneIndex = new Map<string, number>()
  const nameEmailIndex = new Map<string, number>()

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i]

    // 1. Email exacto
    if (lead.email_valid && lead.email_clean) {
      if (emailIndex.has(lead.email_clean)) {
        results[i] = { is_duplicate: true, type: 'email_exact', duplicate_of_index: emailIndex.get(lead.email_clean) }
        continue
      }
      emailIndex.set(lead.email_clean, i)
    }

    // 2. Teléfono E.164 exacto
    if (lead.phone_valid && lead.phone_e164) {
      if (phoneIndex.has(lead.phone_e164)) {
        results[i] = { is_duplicate: true, type: 'phone_exact', duplicate_of_index: phoneIndex.get(lead.phone_e164) }
        continue
      }
      phoneIndex.set(lead.phone_e164, i)
    }

    // 3. Nombre + últimos 6 dígitos del teléfono
    if (lead.has_name && lead.phone_clean.length >= 6) {
      const key = `${normName(lead.full_name)}:${lead.phone_clean.slice(-6)}`
      if (namePhoneIndex.has(key)) {
        results[i] = { is_duplicate: true, type: 'name_phone', duplicate_of_index: namePhoneIndex.get(key) }
        continue
      }
      namePhoneIndex.set(key, i)
    }

    // 4. Nombre + email (aunque el email sea inválido, si coinciden es sospechoso)
    if (lead.has_name && lead.email_raw.trim()) {
      const key = `${normName(lead.full_name)}:${lead.email_raw.toLowerCase().trim()}`
      if (nameEmailIndex.has(key)) {
        results[i] = { is_duplicate: true, type: 'name_email', duplicate_of_index: nameEmailIndex.get(key) }
        continue
      }
      nameEmailIndex.set(key, i)
    }
  }

  return results
}
