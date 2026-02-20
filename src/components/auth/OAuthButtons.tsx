'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { toast } from '@/components/ui/toaster'

/**
 * OAuth provider buttons for Google and GitHub.
 * Initiates OAuth flow by redirecting to provider's consent screen.
 */
export function OAuthButtons(): React.ReactElement {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isGitHubLoading, setIsGitHubLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })

      if (error) {
        console.error('Google OAuth error:', error.message)
        toast.error('Unable to sign in with Google. Please try again.')
        setIsGoogleLoading(false)
      }
    } catch (err) {
      console.error('Unexpected error during Google sign in:', err)
      toast.error('Unable to sign in with Google. Please try again.')
      setIsGoogleLoading(false)
    }
  }

  const handleGitHubSignIn = async () => {
    setIsGitHubLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })

      if (error) {
        console.error('GitHub OAuth error:', error.message)
        toast.error('Unable to sign in with GitHub. Please try again.')
        setIsGitHubLoading(false)
      }
    } catch (err) {
      console.error('Unexpected error during GitHub sign in:', err)
      toast.error('Unable to sign in with GitHub. Please try again.')
      setIsGitHubLoading(false)
    }
  }

  const isAnyLoading = isGoogleLoading || isGitHubLoading

  return (
    <div className="space-y-3">
      {/* Google OAuth button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isAnyLoading}
        className="w-full py-3 px-4 flex items-center justify-center gap-3 rounded-xl font-medium transition-all bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:hover:border-neutral-700 shadow-sm"
        aria-label="Continue with Google"
      >
        {isGoogleLoading ? <LoadingSpinner /> : <GoogleIcon />}
        <span>{isGoogleLoading ? 'Redirecting...' : 'Continue with Google'}</span>
      </button>

      {/* GitHub OAuth button */}
      <button
        type="button"
        onClick={handleGitHubSignIn}
        disabled={isAnyLoading}
        className="w-full py-3 px-4 flex items-center justify-center gap-3 rounded-xl font-medium transition-all bg-neutral-950 border border-neutral-950 text-white hover:bg-neutral-800 hover:border-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:border-white dark:text-black dark:hover:bg-neutral-200 dark:hover:border-neutral-200 shadow-sm"
        aria-label="Continue with GitHub"
      >
        {isGitHubLoading ? <LoadingSpinner /> : <GitHubIcon />}
        <span>{isGitHubLoading ? 'Redirecting...' : 'Continue with GitHub'}</span>
      </button>
    </div>
  )
}

/**
 * Loading spinner for OAuth buttons.
 */
function LoadingSpinner(): React.ReactElement {
  return (
    <svg
      className="animate-spin h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

/**
 * Google "G" icon following brand guidelines.
 * Uses the official multi-color Google logo.
 */
function GoogleIcon(): React.ReactElement {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

/**
 * GitHub Octocat icon.
 */
function GitHubIcon(): React.ReactElement {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  )
}
