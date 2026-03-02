import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Generic database type to avoid 'never' inference without generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDatabase = any

let client: SupabaseClient<AnyDatabase> | null = null

export function getSupabase(): SupabaseClient<AnyDatabase> {
  if (!client) {
    client = createClient<AnyDatabase>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
  }
  return client
}
