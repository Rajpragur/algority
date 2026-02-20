'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'
import type { User } from '@supabase/supabase-js'

/** Tab options for the auth modal */
export type AuthModalTab = 'login' | 'signup' | 'magic-link'

/**
 * Auth context value shape.
 * Provides auth state, modal control, and auth actions.
 */
export interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isModalOpen: boolean
  modalTab: AuthModalTab
  openAuthModal: (tab?: AuthModalTab) => void
  closeAuthModal: () => void
  signOut: () => Promise<void>
  /** Manually refresh user state - call after server-side auth changes */
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

/**
 * AuthProvider wraps the app to provide auth state via React context.
 * Uses Supabase auth listeners to keep state in sync across tabs/windows.
 *
 * Usage:
 *   // In layout.tsx
 *   <AuthProvider>{children}</AuthProvider>
 *
 *   // In any component
 *   const { user, isLoading, signOut } = useAuth()
 */
export function AuthProvider({ children }: AuthProviderProps): React.ReactElement {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Modal state for auth modal visibility and active tab
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTab, setModalTab] = useState<AuthModalTab>('login')

  /**
   * Opens the auth modal to the specified tab (defaults to 'login').
   */
  const openAuthModal = useCallback((tab?: AuthModalTab) => {
    setModalTab(tab || 'login')
    setIsModalOpen(true)
  }, [])

  /**
   * Closes the auth modal.
   */
  const closeAuthModal = useCallback(() => {
    setIsModalOpen(false)
  }, [])

  useEffect(() => {
    const supabase = createClient()

    // Get initial user on mount
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setIsLoading(false)
    })

    // Subscribe to auth state changes (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)

      // Auto-close modal on successful sign in (safety net for edge cases)
      if (event === 'SIGNED_IN' && session) {
        setIsModalOpen(false)
      }
    })

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe()
  }, [])

  /**
   * Signs out the current user and clears local state.
   */
  const signOut = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
  }, [])

  /**
   * Manually refresh user state from cookies.
   * Call this after server-side auth changes (e.g., server action sign-in).
   */
  const refreshUser = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isModalOpen,
        modalTab,
        openAuthModal,
        closeAuthModal,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to access auth state and methods.
 * Must be used within an AuthProvider.
 *
 * @throws Error if used outside of AuthProvider
 *
 * Usage:
 *   const { user, isLoading, signOut } = useAuth()
 *   if (isLoading) return <Spinner />
 *   if (!user) return <SignInPrompt />
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
