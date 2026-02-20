import { createBrowserClient } from '@supabase/ssr'

/**
 * Browser-side Supabase client for use in Client Components.
 * This file is safe to import in 'use client' components.
 *
 * Usage:
 *   import { createClient } from '@/lib/supabase-browser'
 *   const supabase = createClient()
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
