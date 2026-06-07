import { Router } from 'express'
import { cleanLead } from '../services/dataCleaner'
import { detectDuplicates } from '../services/dedupeEngine'
import { calculateTrustScore } from '../services/dataTrustEngine'

// ─────────────────────────────────────────────────────────────────────────────
// Rutas Data Trust — /api/data-trust/
// ─────────────────────────────────────────────────────────────────────────────

const router = Router()

// POST /api/data-trust/analyze — analiza un único lead
router.post('/analyze', (req, res) => {
  try {
    const cleaned = cleanLead(req.body)
    const trust = calculateTrustScore(cleaned, false)
    res.json({ cleaned, trust })
  } catch (err) {
    res.status(500).json({ error: 'Error al analizar registro', details: String(err) })
  }
})

// POST /api/data-trust/dedupe — detecta duplicados en un lote
router.post('/dedupe', (req, res) => {
  const { leads } = req.body
  if (!Array.isArray(leads)) {
    res.status(400).json({ error: 'Se esperaba un array "leads"' })
    return
  }
  try {
    const cleaned = leads.map((l: Record<string, string>) => cleanLead(l))
    const duplicates = detectDuplicates(cleaned)
    const results = cleaned.map((c, i) => ({
      index: i,
      cleaned: c,
      trust: calculateTrustScore(c, duplicates[i].is_duplicate),
      duplicate: duplicates[i],
    }))
    res.json({ results, total: leads.length, duplicates_found: duplicates.filter(d => d.is_duplicate).length })
  } catch (err) {
    res.status(500).json({ error: 'Error al detectar duplicados', details: String(err) })
  }
})

export default router
