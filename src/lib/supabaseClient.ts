import { createClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────────────────────
// Supabase Client — Frontend (navegador)
// Usa ANON KEY: pública por diseño. RLS protege los datos.
// ─────────────────────────────────────────────────────────────────────────────

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || supabaseUrl.includes('TU_PROYECTO')) {
  console.warn('[Supabase] VITE_SUPABASE_URL no configurada — modo offline')
}

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)

export const isSupabaseConfigured =
  !!supabaseUrl &&
  !supabaseUrl.includes('TU_PROYECTO') &&
  !!supabaseAnonKey &&
  !supabaseAnonKey.includes('TU_ANON_KEY')
