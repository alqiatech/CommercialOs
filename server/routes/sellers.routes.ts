import { Router } from 'express'
import { supabaseAdmin } from '../services/supabaseAdmin'

const router = Router()

const SELLER_ROLE_TYPES = ['owner', 'admin', 'sales_director', 'sales_manager', 'sales_rep'] as const

// GET /api/sellers?company_id=
router.get('/', async (req, res) => {
  try {
    const { company_id } = req.query as Record<string, string>
    if (!company_id) {
      res.status(400).json({ error: 'company_id requerido' })
      return
    }

    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        tenant_id,
        full_name,
        email,
        phone,
        role_type,
        status,
        created_at,
        updated_at,
        user_company_access!inner(company_id, branch_id, access_level)
      `)
      .eq('user_company_access.company_id', company_id)
      .in('role_type', [...SELLER_ROLE_TYPES])
      .eq('status', 'active')
      .order('full_name', { ascending: true })

    if (usersError) throw usersError

    const userIds = (users ?? []).map(user => user.id)

    const { data: opportunities, error: oppsError } = userIds.length > 0
      ? await supabaseAdmin
          .from('opportunities')
          .select('id, owner_user_id, status, estimated_value, won_at, updated_at')
          .eq('company_id', company_id)
          .in('owner_user_id', userIds)
      : { data: [], error: null }

    if (oppsError) throw oppsError

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const data = (users ?? []).map(user => {
      const access = Array.isArray(user.user_company_access) ? user.user_company_access[0] : user.user_company_access
      const userOpps = (opportunities ?? []).filter(opportunity => opportunity.owner_user_id === user.id)
      const openOpps = userOpps.filter(opportunity => opportunity.status === 'open')
      const wonLast30 = userOpps.filter(opportunity => opportunity.status === 'won' && (opportunity.won_at ?? '') >= thirtyDaysAgo).length
      const lostLast30 = userOpps.filter(opportunity => opportunity.status === 'lost' && (opportunity.updated_at ?? '') >= thirtyDaysAgo).length
      const closedLast30 = wonLast30 + lostLast30

      return {
        id: user.id,
        tenant_id: user.tenant_id,
        company_id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role_type: user.role_type,
        access_level: access?.access_level ?? 'member',
        branch_id: access?.branch_id ?? null,
        status: user.status,
        created_at: user.created_at,
        updated_at: user.updated_at,
        metrics: {
          open_opportunities: openOpps.length,
          won_last_30_days: wonLast30,
          lost_last_30_days: lostLast30,
          conversion_rate: closedLast30 > 0 ? wonLast30 / closedLast30 : 0,
          pipeline_value: openOpps.reduce((sum, opportunity) => sum + (opportunity.estimated_value ?? 0), 0),
        },
      }
    })

    res.json({ data })
  } catch (err: any) {
    console.error('[sellers] GET /', err)
    res.status(500).json({ error: err.message ?? 'Error al cargar vendedores' })
  }
})

export default router
