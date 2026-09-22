import { createClient } from '@supabase/supabase-js'

// يُستخدم فقط داخل route handlers على السيرفر — أبداً في مكوّنات الواجهة (client components)
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
