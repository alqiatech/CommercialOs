import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../services/supabaseAdmin'

const router = Router()

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

    // Crear usuario en tabla users (vinculado al auth user)
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUserId,
        tenant_id: tenant.id,
        email,
        name,
        role: 'owner',
        status: 'active',
      })
      .select()
      .single()

    if (userError) throw userError

    // Actualizar owner_user_id en tenant
    await supabaseAdmin
      .from('tenants')
      .update({ owner_user_id: authUserId })
      .eq('id', tenant.id)

    res.status(201).json({
      message: 'Cuenta creada exitosamente',
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
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
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('*, tenants(id, name, slug, plan, ai_enabled, automation_enabled)')
      .eq('id', data.user.id)
      .single()

    res.json({
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
      user: userData,
    })
  } catch (err: any) {
    console.error('[auth] POST /login', err)
    res.status(500).json({ error: err.message ?? 'Error al iniciar sesión' })
  }
})

// POST /api/auth/logout
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (token) {
      // Obtener user para luego invalidar su sesión
      const { data: { user } } = await supabaseAdmin.auth.getUser(token)
      if (user) {
        await supabaseAdmin.auth.admin.deleteSession(token)
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

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('*, tenants(id, name, slug, plan, ai_enabled, automation_enabled, branding)')
      .eq('id', user.id)
      .single()

    res.json({ user: userData })
  } catch (err: any) {
    console.error('[auth] GET /me', err)
    res.status(500).json({ error: err.message ?? 'Error interno' })
  }
})

export default router
