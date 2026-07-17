import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

// Cliente admin (só no backend/API routes) — bypass RLS
// NUNCA importar este arquivo em código que roda no browser
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)
