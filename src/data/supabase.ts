// Cloud backend for signed-in users: Postgres + Auth on Supabase's free
// tier. Only initialized when env vars are present, so the app still
// works in guest/local-only mode without any Supabase project configured.
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

export const supabase: SupabaseClient | null =
  url && publishableKey ? createClient(url, publishableKey) : null

export const isCloudConfigured = Boolean(supabase)
