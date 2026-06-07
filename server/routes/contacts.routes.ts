import { Router } from 'express'
import { supabaseAdmin } from '../services/supabaseAdmin'

// ─────────────────────────────────────────────────────────────────────────────
// Contacts routes — /api/contacts/
// ─────────────────────────────────────────────────────────────────────────────

const router = Router()

// GET /api/contacts?company_id=&page=&limit=&q=&status=
router.get('/', async (req, res) => {
  const { company_id, page = '1', limit = '50', q, status } = req.query as Record<string, string>
  if (!company_id) { res.status(400).json({ error: 'company_id requerido' }); return }

  const pageNum = Math.max(1, parseInt(page))
  const pageSize = Math.min(200, Math.max(1, parseInt(limit)))
  const from = (pageNum - 1) * pageSize

  let query = supabaseAdmin
    .from('contacts')
    .select('*', { count: 'exact' })
    .eq('company_id', company_id)
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1)

  if (status) query = query.eq('status', status)
  if (q) query = query.ilike('full_name', `%${q}%`)

  const { data, error, count } = await query
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json({ data, count, page: pageNum, limit: pageSize })
})

// GET /api/contacts/:id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('contacts')
    .select('*')
    .eq('id', req.params.id)
    .single()

  if (error) { res.status(404).json({ error: 'Contacto no encontrado' }); return }
  res.json(data)
})

// PATCH /api/contacts/:id
router.patch('/:id', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('contacts')
    .update({ ...req.body, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) { res.status(400).json({ error: error.message }); return }
  res.json(data)
})

// DELETE /api/contacts/:id — soft delete
router.delete('/:id', async (req, res) => {
  const { error } = await supabaseAdmin
    .from('contacts')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', req.params.id)

  if (error) { res.status(400).json({ error: error.message }); return }
  res.json({ ok: true })
})

export default router
