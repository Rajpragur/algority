import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase'

/**
 * Middleware for route protection.
 * Only runs on routes defined in config.matcher below.
 * Unauthenticated users are redirected to home with ?auth_required=true
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { supabase, response } = createMiddlewareClient(request)

  // Validate the user's session (more secure than getSession)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect unauthenticated users (matcher ensures we only check protected routes)
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('auth_required', 'true')
    return NextResponse.redirect(url)
  }

  // Return response with refreshed session cookies
  return response
}

/**
 * Matcher configuration - only run middleware on these routes.
 * This improves performance by skipping middleware for public routes.
 */
export const config = {
  matcher: [
    '/coach/:path*',
    '/editor/:path*',
    '/progress/:path*',
    '/settings/:path*',
  ],
}
