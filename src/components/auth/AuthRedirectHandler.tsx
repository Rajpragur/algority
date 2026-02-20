'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from './AuthProvider'

/**
 * Handles auth redirect feedback by detecting query params and showing
 * appropriate toast notifications. Also auto-opens the auth modal when
 * user is redirected from a protected route.
 *
 * Supported params:
 * - `auth_required=true` - User was redirected from a protected route (opens modal)
 * - `auth_error=true` - OAuth sign-in failed
 *
 * Usage:
 *   <Suspense fallback={null}>
 *     <AuthRedirectHandler />
 *   </Suspense>
 */
export function AuthRedirectHandler(): null {
  const searchParams = useSearchParams()
  const { openAuthModal } = useAuth()

  useEffect(() => {
    const authRequired = searchParams.get('auth_required')
    const authError = searchParams.get('auth_error')

    // Show appropriate toast and open modal for auth_required
    if (authRequired === 'true') {
      toast.info('Please sign in to access that page', { id: 'auth-required' })
      openAuthModal('login')
    }

    if (authError === 'true') {
      toast.error('Unable to sign in. Please try again.', { id: 'auth-error' })
    }

    // Clear query params from URL without triggering navigation
    if (authRequired || authError) {
      const url = new URL(window.location.href)
      url.searchParams.delete('auth_required')
      url.searchParams.delete('auth_error')
      window.history.replaceState({}, '', url.pathname + url.search)
    }
  }, [searchParams, openAuthModal])

  return null
}
