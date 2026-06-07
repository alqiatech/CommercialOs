import { Router } from 'express'
import { supabaseAdmin } from '../services/supabaseAdmin'

// ─────────────────────────────────────────────────────────────────────────────
// Opportunities routes — /api/opportunities/
// ─────────────────────────────────────────────────────────────────────────────

const router = Router()

// GET /api/opportunities?company_id=&status=&stage_id=&owner_user_id=
router.get('/', async (req, res) => {
  const { company_id, status, stage_id, owner_user_id, page = '1', limit = '100' } = req.query as Record<string, string>
  if (!company_id) { res.status(400).json({ error: 'company_id requerido' }); return }

  const pageNum = Math.max(1, parseInt(page))
  const pageSize = Math.min(500, Math.max(1, parseInt(limit)))
  const from = (pageNum - 1) * pageSize

  let query = supabaseAdmin
    .from('opportunities')
    .select(`
      *,
      contact:contacts(id, full_name, email, phone, whatsapp_phone, data_trust_score),
      stage:pipeline_stages(id, name, order_index, stage_type, color, probability_default)
    `, { count: 'exact' })
    .eq('company_id', company_id)
    .order('updated_at', { ascending: false })
    .range(from, from + pageSize - 1)

  if (status) query = query.eq('status', status)
  if (stage_id) query = query.eq('stage_id', stage_id)
  if (owner_user_id) query = query.eq('owner_user_id', owner_user_id)

  const { data, error, count } = await query
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json({ data, count, page: pageNum, limit: pageSize })
})

// GET /api/opportunities/:id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('opportunities')
    .select(`
      *,
      contact:contacts(*),
      stage:pipeline_stages(*),
      interactions(id, channel, direction, summary, sentiment, occurred_at, agent_type),
      tasks(id, type, title, priority, status, due_at, assigned_to)
    `)
    .eq('id', req.params.id)
    .single()

  if (error) { res.status(404).json({ error: 'Oportunidad no encontrada' }); return }
  res.json(data)
})

// POST /api/opportunities
router.post('/', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('opportunities')
    .insert(req.body)
    .select()
    .single()

  if (error) { res.status(400).json({ error: error.message }); return }
  res.status(201).json(data)
})

// PATCH /api/opportunities/:id
router.patch('/:id', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('opportunities')
    .update({ ...req.body, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) { res.status(400).json({ error: error.message }); return }
  res.json(data)
})

// PATCH /api/opportunities/:id/stage — mover de etapa + registrar interacción
router.patch('/:id/stage', async (req, res) => {
  const { stage_id, user_id } = req.body
  if (!stage_id) { res.status(400).json({ error: 'stage_id requerido' }); return }

  const { data: opp, error: oppError } = await supabaseAdmin
    .from('opportunities')
    .update({ stage_id, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select('*, stage:pipeline_stages(name)')
    .single()

  if (oppError) { res.status(400).json({ error: oppError.message }); return }

  // Registrar la interacción de cambio de etapa
  await supabaseAdmin.from('interactions').insert({
    tenant_id: opp.tenant_id,
    company_id: opp.company_id,
    opportunity_id: opp.id,
    contact_id: opp.contact_id,
    user_id,
    agent_type: user_id ? 'user' : 'system',
    channel: 'system',
    direction: 'internal',
    summary: `Etapa cambiada a "${(opp as Record<string, { name?: string }>).stage?.name}"`,
    occurred_at: new Date().toISOString(),
  })

  res.json(opp)
})

// PATCH /api/opportunities/:id/status — marcar ganada/perdida
router.patch('/:id/status', async (req, res) => {
  const { status, lost_reason } = req.body
  if (!['won', 'lost', 'open', 'paused'].includes(status)) {
    res.status(400).json({ error: 'status inválido' }); return
  }

  const update: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (status === 'won') update.won_at = new Date().toISOString()
  if (status === 'lost') {
    update.lost_at = new Date().toISOString()
    update.lost_reason = lost_reason
  }

  const { data, error } = await supabaseAdmin
    .from('opportunities')
    .update(update)
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) { res.status(400).json({ error: error.message }); return }
  res.json(data)
})

export default router
