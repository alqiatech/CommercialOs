import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../services/supabaseAdmin'

const router = Router()

// GET /api/tasks
// Query params: contact_id, opportunity_id, company_id, assigned_to, status, type, overdue, page, limit
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      contact_id,
      opportunity_id,
      company_id,
      assigned_to,
      status,
      type,
      overdue,
      page = '1',
      limit = '50',
    } = req.query as Record<string, string>

    const pageNum = Math.max(1, parseInt(page))
    const limitNum = Math.min(200, Math.max(1, parseInt(limit)))
    const offset = (pageNum - 1) * limitNum

    let query = supabaseAdmin
      .from('tasks')
      .select('*', { count: 'exact' })
      .order('due_at', { ascending: true, nullsFirst: false })
      .range(offset, offset + limitNum - 1)

    if (contact_id)     query = query.eq('contact_id', contact_id)
    if (opportunity_id) query = query.eq('opportunity_id', opportunity_id)
    if (company_id)     query = query.eq('company_id', company_id)
    if (assigned_to)    query = query.eq('assigned_to', assigned_to)
    if (status)         query = query.eq('status', status)
    if (type)           query = query.eq('type', type)
    if (overdue === 'true') {
      query = query.lt('due_at', new Date().toISOString()).in('status', ['pending', 'in_progress'])
    }

    const { data, error, count } = await query
    if (error) throw error

    res.json({ data, total: count, page: pageNum, limit: limitNum })
  } catch (err: any) {
    console.error('[tasks] GET /', err)
    res.status(500).json({ error: err.message ?? 'Error interno' })
  }
})

// POST /api/tasks
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      tenant_id,
      company_id,
      contact_id,
      opportunity_id,
      assigned_to,
      created_by,
      type = 'follow_up',
      priority = 'medium',
      title,
      description,
      due_at,
      ai_generated = false,
      metadata = {},
    } = req.body

    if (!tenant_id || !company_id || !title) {
      return res.status(400).json({ error: 'tenant_id, company_id y title son requeridos' })
    }

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .insert({
        tenant_id,
        company_id,
        contact_id,
        opportunity_id,
        assigned_to,
        created_by,
        type,
        priority,
        status: 'pending',
        title,
        description,
        due_at,
        ai_generated,
        metadata,
      })
      .select()
      .single()

    if (error) throw error
    res.status(201).json({ data })
  } catch (err: any) {
    console.error('[tasks] POST /', err)
    res.status(500).json({ error: err.message ?? 'Error interno' })
  }
})

// GET /api/tasks/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Tarea no encontrada' })

    res.json({ data })
  } catch (err: any) {
    console.error('[tasks] GET /:id', err)
    res.status(500).json({ error: err.message ?? 'Error interno' })
  }
})

// PATCH /api/tasks/:id
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const allowed = ['title', 'description', 'type', 'priority', 'status', 'due_at', 'assigned_to', 'metadata']
    const updates: Record<string, unknown> = {}
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key]
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Sin campos para actualizar' })
    }

    // Si se marca como completada, registrar timestamp
    if (updates.status === 'completed') {
      updates.completed_at = new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Tarea no encontrada' })

    res.json({ data })
  } catch (err: any) {
    console.error('[tasks] PATCH /:id', err)
    res.status(500).json({ error: err.message ?? 'Error interno' })
  }
})

// DELETE /api/tasks/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { error } = await supabaseAdmin
      .from('tasks')
      .update({ status: 'cancelled' })
      .eq('id', req.params.id)

    if (error) throw error
    res.status(204).send()
  } catch (err: any) {
    console.error('[tasks] DELETE /:id', err)
    res.status(500).json({ error: err.message ?? 'Error interno' })
  }
})

export default router
