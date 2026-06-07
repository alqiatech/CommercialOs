// ─────────────────────────────────────────────────────────────────────────────
// dedupeEngine.ts — Alqia Commercial OS / Data Spine
// Detecta duplicados usando 7 estrategias de comparación.
// No modifica el store — solo reporta candidatos y sugiere merge.
// ─────────────────────────────────────────────────────────────────────────────

import type { Contact } from '@/types'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type DedupeStrategy =
  | 'exact_email'          // email normalizado idéntico
  | 'exact_phone'          // teléfono normalizado idéntico
  | 'exact_name_city'      // nombre normalizado + ciudad
  | 'fuzzy_name_phone'     // nombre similar + prefijo de teléfono coincide
  | 'email_domain_name'    // mismo dominio de email + nombre similar
  | 'phone_prefix_name'    // prefijo de teléfono + nombre similar
  | 'normalized_slug'      // slug de nombre+ciudad coincide

export interface DuplicatePair {
  contactIdA: string
  contactIdB: string
  strategy: DedupeStrategy
  confidence: number          // 0-1
  suggestedMerge: MergeSuggestion
}

export interface MergeSuggestion {
  keepId: string              // ID a conservar (el más completo)
  discardId: string           // ID a descartar
  mergedFields: Partial<Contact>
  reason: string
}

export interface DedupeReport {
  totalChecked: number
  duplicatesFound: number
  pairs: DuplicatePair[]
  processingTimeMs: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeForCompare(s: string): string {
  return (s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // quitar acentos
    .replace(/[^a-z0-9]/g, '')         // solo alfanumérico
    .trim()
}

function computeNameSlug(contact: Contact): string {
  return normalizeForCompare(`${contact.first_name}${contact.last_name}${contact.city ?? ''}`)
}

function jaroWinklerSimilarity(a: string, b: string): number {
  if (a === b) return 1
  if (!a || !b) return 0
  const maxDist = Math.floor(Math.max(a.length, b.length) / 2) - 1
  const aMatches = new Array(a.length).fill(false)
  const bMatches = new Array(b.length).fill(false)
  let matches = 0
  let transpositions = 0

  for (let i = 0; i < a.length; i++) {
    const start = Math.max(0, i - maxDist)
    const end = Math.min(i + maxDist + 1, b.length)
    for (let j = start; j < end; j++) {
      if (bMatches[j] || a[i] !== b[j]) continue
      aMatches[i] = bMatches[j] = true
      matches++
      break
    }
  }

  if (matches === 0) return 0

  let k = 0
  for (let i = 0; i < a.length; i++) {
    if (!aMatches[i]) continue
    while (!bMatches[k]) k++
    if (a[i] !== b[k]) transpositions++
    k++
  }

  const jaro = (matches / a.length + matches / b.length + (matches - transpositions / 2) / matches) / 3
  const prefixLen = Math.min(4, [...a].findIndex((c, i) => c !== b[i]) === -1 ? Math.min(a.length, b.length) : [...a].findIndex((c, i) => c !== b[i]))
  return jaro + prefixLen * 0.1 * (1 - jaro)
}

// ─── Estrategias de detección ─────────────────────────────────────────────────

function detectExactEmail(a: Contact, b: Contact): DuplicatePair | null {
  if (!a.normalized_email || !b.normalized_email) return null
  if (a.normalized_email !== b.normalized_email) return null
  return buildPair(a, b, 'exact_email', 0.99)
}

function detectExactPhone(a: Contact, b: Contact): DuplicatePair | null {
  if (!a.normalized_phone || !b.normalized_phone) return null
  if (a.normalized_phone !== b.normalized_phone) return null
  return buildPair(a, b, 'exact_phone', 0.97)
}

function detectExactNameCity(a: Contact, b: Contact): DuplicatePair | null {
  const nameA = normalizeForCompare(a.full_name ?? '')
  const nameB = normalizeForCompare(b.full_name ?? '')
  const cityA = normalizeForCompare(a.city ?? '')
  const cityB = normalizeForCompare(b.city ?? '')
  if (!nameA || !cityA) return null
  if (nameA !== nameB || cityA !== cityB) return null
  return buildPair(a, b, 'exact_name_city', 0.90)
}

function detectFuzzyNamePhone(a: Contact, b: Contact): DuplicatePair | null {
  const nameA = normalizeForCompare(a.full_name ?? '')
  const nameB = normalizeForCompare(b.full_name ?? '')
  const sim = jaroWinklerSimilarity(nameA, nameB)
  if (sim < 0.88) return null
  // Mismo prefijo de teléfono (primeros 8 dígitos)
  const phoneA = (a.normalized_phone ?? '').replace(/\D/g, '').slice(0, 8)
  const phoneB = (b.normalized_phone ?? '').replace(/\D/g, '').slice(0, 8)
  if (phoneA.length < 6 || phoneA !== phoneB) return null
  return buildPair(a, b, 'fuzzy_name_phone', sim * 0.9)
}

function detectEmailDomainName(a: Contact, b: Contact): DuplicatePair | null {
  const getEmailDomain = (c: Contact) => (c.normalized_email ?? '').split('@')[1] ?? ''
  const domainA = getEmailDomain(a)
  const domainB = getEmailDomain(b)
  if (!domainA || domainA !== domainB) return null
  const nameA = normalizeForCompare(a.full_name ?? '')
  const nameB = normalizeForCompare(b.full_name ?? '')
  const sim = jaroWinklerSimilarity(nameA, nameB)
  if (sim < 0.85) return null
  return buildPair(a, b, 'email_domain_name', sim * 0.85)
}

function detectNormalizedSlug(a: Contact, b: Contact): DuplicatePair | null {
  const slugA = computeNameSlug(a)
  const slugB = computeNameSlug(b)
  if (slugA.length < 8 || slugA !== slugB) return null
  return buildPair(a, b, 'normalized_slug', 0.88)
}

// ─── Merge suggestion ─────────────────────────────────────────────────────────

function buildPair(a: Contact, b: Contact, strategy: DedupeStrategy, confidence: number): DuplicatePair {
  // Conservar el registro más completo (más campos con valor)
  const scoreA = countFilledFields(a)
  const scoreB = countFilledFields(b)
  const keepId = scoreA >= scoreB ? a.id : b.id
  const discardId = keepId === a.id ? b.id : a.id
  const keepContact = keepId === a.id ? a : b
  const discardContact = keepId === a.id ? b : a

  const mergedFields: Partial<Contact> = {}
  if (!keepContact.email && discardContact.email) mergedFields.email = discardContact.email
  if (!keepContact.phone && discardContact.phone) mergedFields.phone = discardContact.phone
  if (!keepContact.city && discardContact.city) mergedFields.city = discardContact.city
  if (!keepContact.state && discardContact.state) mergedFields.state = discardContact.state

  return {
    contactIdA: a.id,
    contactIdB: b.id,
    strategy,
    confidence,
    suggestedMerge: {
      keepId,
      discardId,
      mergedFields,
      reason: `Duplicado detectado por estrategia: ${strategy} (confianza ${Math.round(confidence * 100)}%)`,
    },
  }
}

function countFilledFields(c: Contact): number {
  const fields: (keyof Contact)[] = ['email', 'phone', 'city', 'state', 'first_name', 'last_name']
  return fields.filter(f => !!c[f]).length
}

// ─── Motor de deduplicación ───────────────────────────────────────────────────

const STRATEGIES = [
  detectExactEmail,
  detectExactPhone,
  detectExactNameCity,
  detectFuzzyNamePhone,
  detectEmailDomainName,
  detectNormalizedSlug,
]

export function runDedupeEngine(contacts: Contact[]): DedupeReport {
  const start = performance.now()
  const pairs: DuplicatePair[] = []
  const seenPairs = new Set<string>()

  for (let i = 0; i < contacts.length; i++) {
    for (let j = i + 1; j < contacts.length; j++) {
      const a = contacts[i]
      const b = contacts[j]
      const pairKey = [a.id, b.id].sort().join('|')
      if (seenPairs.has(pairKey)) continue

      for (const detect of STRATEGIES) {
        const result = detect(a, b)
        if (result) {
          pairs.push(result)
          seenPairs.add(pairKey)
          break // solo reportar una vez por par
        }
      }
    }
  }

  return {
    totalChecked: contacts.length,
    duplicatesFound: pairs.length,
    pairs,
    processingTimeMs: Math.round(performance.now() - start),
  }
}

/**
 * Verifica si un nuevo contacto es duplicado de alguno en la lista existente.
 * Retorna el primer match encontrado o null.
 */
export function checkForDuplicate(
  candidate: Contact,
  existingContacts: Contact[],
): DuplicatePair | null {
  for (const existing of existingContacts) {
    for (const detect of STRATEGIES) {
      const result = detect(candidate, existing)
      if (result) return result
    }
  }
  return null
}
