import { Router } from 'express'
import {
  ClassifyLeadInput, RadarInput, GenerateMessageInput,
  SummarizeOpportunityInput, NextBestActionInput,
} from '../schemas/ai.schemas'
import { aiLeadClassifier } from '../services/aiLeadClassifier'
import { aiRadarService } from '../services/aiRadarService'
import { aiMessageGenerator } from '../services/aiMessageGenerator'
import { aiOpportunitySummary, aiNextBestAction } from '../services/aiOpportunitySummary'
import { supabaseAdmin } from '../services/supabaseAdmin'

// ─────────────────────────────────────────────────────────────────────────────
// Rutas IA — todos los endpoints bajo /api/ai/
// ─────────────────────────────────────────────────────────────────────────────

const router = Router()

// GET /api/ai/findings?company_id=
router.get('/findings', async (req, res) => {
  try {
    const { company_id, limit = '20' } = req.query as Record<string, string>
    if (!company_id) {
      res.status(400).json({ error: 'company_id requerido' })
      return
    }

    const pageSize = Math.min(100, Math.max(1, parseInt(limit)))
    const { data, error } = await supabaseAdmin
      .from('ai_findings')
      .select('*')
      .eq('company_id', company_id)
      .order('created_at', { ascending: false })
      .limit(pageSize)

    if (error) throw error

    res.json({ data: data ?? [] })
  } catch (err) {
    res.status(500).json({ error: 'Error al cargar hallazgos IA', details: String(err) })
  }
})

// POST /api/ai/classify-lead
router.post('/classify-lead', async (req, res) => {
  const parsed = ClassifyLeadInput.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten() })
    return
  }
  try {
    const result = await aiLeadClassifier(parsed.data)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'Error al clasificar prospecto', details: String(err) })
  }
})

// POST /api/ai/radar
router.post('/radar', async (req, res) => {
  const parsed = RadarInput.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten() })
    return
  }
  try {
    const result = await aiRadarService(parsed.data)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'Error al analizar radar', details: String(err) })
  }
})

// POST /api/ai/generate-message
router.post('/generate-message', async (req, res) => {
  const parsed = GenerateMessageInput.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten() })
    return
  }
  try {
    const result = await aiMessageGenerator(parsed.data)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'Error al generar mensaje', details: String(err) })
  }
})

// POST /api/ai/summarize-opportunity
router.post('/summarize-opportunity', async (req, res) => {
  const parsed = SummarizeOpportunityInput.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten() })
    return
  }
  try {
    const result = await aiOpportunitySummary(parsed.data)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'Error al analizar oportunidad', details: String(err) })
  }
})

// POST /api/ai/next-best-action
router.post('/next-best-action', async (req, res) => {
  const parsed = NextBestActionInput.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten() })
    return
  }
  try {
    const result = await aiNextBestAction(parsed.data)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'Error al calcular siguiente acción', details: String(err) })
  }
})

export default router
