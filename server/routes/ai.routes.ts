import { Router } from 'express'
import {
  ClassifyLeadInput, RadarInput, GenerateMessageInput,
  SummarizeOpportunityInput, NextBestActionInput,
} from '../schemas/ai.schemas'
import { aiLeadClassifier } from '../services/aiLeadClassifier'
import { aiRadarService } from '../services/aiRadarService'
import { aiMessageGenerator } from '../services/aiMessageGenerator'
import { aiOpportunitySummary, aiNextBestAction } from '../services/aiOpportunitySummary'

// ─────────────────────────────────────────────────────────────────────────────
// Rutas IA — todos los endpoints bajo /api/ai/
// ─────────────────────────────────────────────────────────────────────────────

const router = Router()

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
