import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

/**
 * OAuth callback handler for Google/GitHub authentication.
 *
 * This route receives the OAuth code from Supabase after the user
 * authenticates with an OAuth provider. It exchanges the code for
 * a session and redirects the user to the home page.
 *
 * Flow:
 * 1. User clicks "Sign in with Google/GitHub"
 * 2. Supabase redirects to OAuth provider
 * 3. User authorizes the app
 * 4. Provider redirects here with ?code=...
 * 5. We exchange code for session (sets HTTP-only cookie)
 * 6. User is redirected to home page with active session
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  // Handle OAuth error from provider (e.g., user denied access)
  if (error) {
    console.error('OAuth error:', error)
    return NextResponse.redirect(new URL('/?auth_error=true', request.url))
  }

  // Exchange authorization code for session
  if (code) {
    try {
      const supabase = await createServerSupabaseClient()
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('Session exchange error:', exchangeError.message)
        return NextResponse.redirect(new URL('/?auth_error=true', request.url))
      }
    } catch (err) {
      console.error('Unexpected error during OAuth callback:', err)
      return NextResponse.redirect(new URL('/?auth_error=true', request.url))
    }
  }

  // Redirect to home on success (or if no code provided)
  return NextResponse.redirect(new URL('/', request.url))
}
