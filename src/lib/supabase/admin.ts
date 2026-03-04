import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Supabase admin client using the service role key.
 * ONLY for server-side use (Server Components, Route Handlers).
 * NEVER import this in client components — the service role key bypasses RLS.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
