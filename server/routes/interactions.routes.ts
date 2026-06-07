import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../services/supabaseAdmin'

const router = Router()

// GET /api/interactions
// Query params: contact_id, opportunity_id, company_id, channel, page, limit
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      contact_id,
      opportunity_id,
      company_id,
      channel,
      page = '1',
      limit = '50',
    } = req.query as Record<string, string>

    const pageNum = Math.max(1, parseInt(page))
    const limitNum = Math.min(200, Math.max(1, parseInt(limit)))
    const offset = (pageNum - 1) * limitNum

    let query = supabaseAdmin
      .from('interactions')
      .select('*', { count: 'exact' })
      .order('occurred_at', { ascending: false })
      .range(offset, offset + limitNum - 1)

    if (contact_id)     query = query.eq('contact_id', contact_id)
    if (opportunity_id) query = query.eq('opportunity_id', opportunity_id)
    if (company_id)     query = query.eq('company_id', company_id)
    if (channel)        query = query.eq('channel', channel)

    const { data, error, count } = await query
    if (error) throw error

    res.json({ data, total: count, page: pageNum, limit: limitNum })
  } catch (err: any) {
    console.error('[interactions] GET /', err)
    res.status(500).json({ error: err.message ?? 'Error interno' })
  }
})

// POST /api/interactions
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      tenant_id,
      company_id,
      contact_id,
      opportunity_id,
      channel,
      direction = 'outbound',
      subject,
      body,
      actor_type = 'user',
      actor_user_id,
      ai_generated = false,
      metadata = {},
      occurred_at,
    } = req.body

    if (!tenant_id || !company_id || !channel) {
      return res.status(400).json({ error: 'tenant_id, company_id y channel son requeridos' })
    }

    const { data, error } = await supabaseAdmin
      .from('interactions')
      .insert({
        tenant_id,
        company_id,
        contact_id,
        opportunity_id,
        channel,
        direction,
        subject,
        body,
        actor_type,
        actor_user_id,
        ai_generated,
        metadata,
        occurred_at: occurred_at ?? new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // Actualizar last_contact_at del contacto
    if (contact_id) {
      await supabaseAdmin
        .from('contacts')
        .update({ last_contact_at: occurred_at ?? new Date().toISOString() })
        .eq('id', contact_id)
    }

    res.status(201).json({ data })
  } catch (err: any) {
    console.error('[interactions] POST /', err)
    res.status(500).json({ error: err.message ?? 'Error interno' })
  }
})

// GET /api/interactions/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('interactions')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Interacción no encontrada' })

    res.json({ data })
  } catch (err: any) {
    console.error('[interactions] GET /:id', err)
    res.status(500).json({ error: err.message ?? 'Error interno' })
  }
})

export default router
