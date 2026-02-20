'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { signUp } from '@/app/actions'
import { useAuth } from './AuthProvider'
import { toast } from '@/components/ui/toaster'

/**
 * Email/password signup form with optional display name.
 * Handles form validation, submission, and error display.
 * Closes modal and shows success toast on successful signup.
 */
export function SignupForm(): React.ReactElement {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const { closeAuthModal, refreshUser } = useAuth()
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await signUp(formData)
      if (result.error) {
        setError(result.error)
      } else {
        toast.success('Account created')
        closeAuthModal()
        await refreshUser() // Re-sync client auth state with server session
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Email field */}
      <div className="space-y-1.5">
        <label
          htmlFor="signup-email"
          className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider"
        >
          Email
        </label>
        <input
          id="signup-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          disabled={isPending}
          aria-describedby={error ? 'signup-error' : undefined}
          className="w-full px-4 py-3 rounded-xl bg-neutral-50 border-transparent focus:bg-white border focus:border-emerald-500/50 text-neutral-900 focus:ring-0 transition-all dark:bg-neutral-900 dark:focus:bg-black dark:text-white dark:focus:border-emerald-500/50 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 font-light"
          placeholder="you@example.com"
        />
      </div>

      {/* Password field */}
      <div className="space-y-1.5">
        <label
          htmlFor="signup-password"
          className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider"
        >
          Password
        </label>
        <input
          id="signup-password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          disabled={isPending}
          aria-describedby={error ? 'signup-error' : undefined}
          className="w-full px-4 py-3 rounded-xl bg-neutral-50 border-transparent focus:bg-white border focus:border-emerald-500/50 text-neutral-900 focus:ring-0 transition-all dark:bg-neutral-900 dark:focus:bg-black dark:text-white dark:focus:border-emerald-500/50 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 font-light"
          placeholder="At least 6 characters"
        />
      </div>

      {/* Display name field (optional) */}
      <div className="space-y-1.5">
        <label
          htmlFor="signup-displayName"
          className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider"
        >
          Display Name
        </label>
        <input
          id="signup-displayName"
          name="displayName"
          type="text"
          autoComplete="name"
          disabled={isPending}
          className="w-full px-4 py-3 rounded-xl bg-neutral-50 border-transparent focus:bg-white border focus:border-emerald-500/50 text-neutral-900 focus:ring-0 transition-all dark:bg-neutral-900 dark:focus:bg-black dark:text-white dark:focus:border-emerald-500/50 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 font-light"
          placeholder="How you'd like to be called"
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] transition-all duration-200"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
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
            Creating account...
          </span>
        ) : (
          'Create Account'
        )}
      </button>
    </form>
  )
}
