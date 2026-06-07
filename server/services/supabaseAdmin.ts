import { createClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────────────────────
// Supabase Admin Client — SOLO para el servidor
// Usa SERVICE_ROLE_KEY: acceso completo, ignora RLS
// NUNCA exponer este cliente al navegador
// ─────────────────────────────────────────────────────────────────────────────

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseUrl.startsWith('https://')) {
  throw new Error('SUPABASE_URL no está configurada en server/.env.local')
}
if (!serviceRoleKey || serviceRoleKey.includes('TU_SERVICE_ROLE_KEY')) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada en server/.env.local')
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Helper: verificar que la conexión funciona
export async function pingSupabase(): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.from('tenants').select('id').limit(1)
    return !error
  } catch {
    return false
  }
}
