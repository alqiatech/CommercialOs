import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../services/supabaseAdmin'

const router = Router()

function mapSession(session: { access_token: string; refresh_token: string; expires_at?: number | null }) {
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at ?? undefined,
  }
}

async function loadUserProfileByAuthUserId(authUserId: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select(`
      *,
      tenants(id, name, slug, plan, ai_enabled, automation_enabled, branding),
      user_company_access(
        company_id,
        branch_id,
        access_level,
        companies(id, name, slug, industry_key, city, country, status, settings)
      )
    `)
    .eq('auth_user_id', authUserId)
    .single()

  if (error) throw error
  return data
}

// POST /api/auth/register
// Crea un tenant + usuario owner usando Supabase Auth
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, company_name, company_slug } = req.body

    if (!email || !password || !name || !company_name) {
      return res.status(400).json({ error: 'email, password, name y company_name son requeridos' })
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email inválido' })
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' })
    }

    // Generar slug del tenant
    const slug = company_slug ?? company_name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Verificar que el slug no exista
    const { data: existing } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (existing) {
      return res.status(409).json({ error: 'El nombre de empresa ya está registrado' })
    }

    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    })

    if (authError) throw authError

    const authUserId = authData.user.id

    // Crear tenant
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({
        name: company_name,
        slug,
        status: 'active',
        plan: 'starter',
        billing_email: email,
        ai_enabled: true,
        automation_enabled: false,
      })
      .select()
      .single()

    if (tenantError) throw tenantError

    // Crear unidad comercial principal
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert({
        tenant_id: tenant.id,
        name: company_name,
        slug,
        industry: 'General',
        industry_template: 'automotriz',
        industry_key: 'automotriz',
        country: 'MX',
        timezone: 'America/Mexico_City',
        settings: {},
        status: 'active',
      })
      .select()
      .single()

    if (companyError) throw companyError

    // Crear usuario en tabla users (vinculado al auth user)
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        auth_user_id: authUserId,
        tenant_id: tenant.id,
        full_name: name,
        email,
        role_type: 'owner',
        company_ids: [company.id],
        status: 'active',
      })
      .select()
      .single()

    if (userError) throw userError

    const { error: accessError } = await supabaseAdmin
      .from('user_company_access')
      .insert({
        user_id: user.id,
        company_id: company.id,
        access_level: 'owner',
      })

    if (accessError) throw accessError

    // Actualizar owner_user_id en tenant con el user.id interno
    await supabaseAdmin
      .from('tenants')
      .update({ owner_user_id: user.id })
      .eq('id', tenant.id)

    res.status(201).json({
      message: 'Cuenta creada exitosamente',
      user: {
        id: user.id,
        auth_user_id: user.auth_user_id,
        email: user.email,
        full_name: user.full_name,
        role_type: user.role_type,
      },
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
      company: { id: company.id, name: company.name, slug: company.slug },
    })
  } catch (err: any) {
    console.error('[auth] POST /register', err)
    res.status(500).json({ error: err.message ?? 'Error al crear la cuenta' })
  }
})

// POST /api/auth/login
// Autentica con Supabase Auth y devuelve session
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'email y password son requeridos' })
    }

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password })

    if (error) {
      return res.status(401).json({ error: 'Credenciales incorrectas' })
    }

    // Obtener datos del usuario desde la tabla users
    const userData = await loadUserProfileByAuthUserId(data.user.id)

    res.json({
      session: mapSession(data.session),
      user: userData,
    })
  } catch (err: any) {
    console.error('[auth] POST /login', err)
    res.status(500).json({ error: err.message ?? 'Error al iniciar sesión' })
  }
})

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body as { refresh_token?: string }

    if (!refresh_token) {
      return res.status(400).json({ error: 'refresh_token requerido' })
    }

    const authClient = supabaseAdmin.auth as unknown as {
      refreshSession?: (currentSession: { refresh_token: string }) => Promise<{
        data: { session: { access_token: string; refresh_token: string; expires_at?: number | null } | null; user?: { id: string } | null }
        error: { message?: string } | null
      }>
    }

    if (!authClient.refreshSession) {
      return res.status(501).json({ error: 'Refresh de sesión no disponible en este entorno' })
    }

    const { data, error } = await authClient.refreshSession({ refresh_token })

    if (error || !data.session || !data.user?.id) {
      return res.status(401).json({ error: error?.message ?? 'No se pudo refrescar la sesión' })
    }

    const userData = await loadUserProfileByAuthUserId(data.user.id)

    res.json({
      session: mapSession(data.session),
      user: userData,
    })
  } catch (err: any) {
    console.error('[auth] POST /refresh', err)
    res.status(500).json({ error: err.message ?? 'Error al refrescar la sesión' })
  }
})

// POST /api/auth/logout
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (token) {
      const authAdmin = supabaseAdmin.auth.admin as unknown as {
        signOut?: (jwt: string, scope?: 'global' | 'local' | 'others') => Promise<{ error?: { message?: string } | null }>
      }

      if (authAdmin.signOut) {
        const { error } = await authAdmin.signOut(token, 'global')
        if (error) {
          console.warn('[auth] POST /logout signOut warning', error.message)
        }
      }
    }

    res.status(204).send()
  } catch {
    // En logout, silenciar errores — el cliente limpia el token de todas formas
    res.status(204).send()
  }
})

// GET /api/auth/me
// Verifica token y devuelve datos del usuario actual
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Token requerido' })

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !user) return res.status(401).json({ error: 'Token inválido o expirado' })

    const userData = await loadUserProfileByAuthUserId(user.id)

    res.json({ user: userData })
  } catch (err: any) {
    console.error('[auth] GET /me', err)
    res.status(500).json({ error: err.message ?? 'Error interno' })
  }
})

export default router
