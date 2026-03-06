import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Public client using anon key — respects RLS policies (read-only for public data)
let anonClient: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!anonClient) {
    anonClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    )
  }
  return anonClient
}

// Service role client — bypasses RLS, used only in server-side API routes
// for operations that need write access (e.g. Strava token management)
let serviceClient: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (!serviceClient) {
    serviceClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return serviceClient
}
