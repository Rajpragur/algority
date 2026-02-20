'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { toast } from '@/components/ui/toaster'

/**
 * Magic link (passwordless) authentication form.
 * Sends a sign-in link to the user's email address.
 */
export function MagicLinkForm(): React.ReactElement {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })

      if (otpError) {
        console.error('Magic link error:', otpError.message)
        setError('Unable to send magic link. Please try again.')
        return
      }

      setIsEmailSent(true)
      toast.success('Check your email for the magic link!')
    } catch (err) {
      console.error('Unexpected error sending magic link:', err)
      setError('Unable to send magic link. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Show success state after email is sent
  if (isEmailSent) {
    return (
      <div className="text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
          <svg
            className="w-8 h-8 text-emerald-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-light tracking-wide text-neutral-900 dark:text-white uppercase">
            Check your email
          </h3>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 font-light">
            We sent a magic link to <span className="font-medium text-emerald-600 dark:text-emerald-400">{email}</span>
          </p>
        </div>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 font-light">
          Click the link in the email to sign in. The link expires in 1 hour.
        </p>
        <button
          type="button"
          onClick={() => {
            setIsEmailSent(false)
            setEmail('')
          }}
          className="text-emerald-600 hover:text-emerald-500 dark:text-emerald-500 dark:hover:text-emerald-400 text-sm font-medium focus:outline-none transition-colors"
        >
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-neutral-500 dark:text-neutral-400 font-light text-center leading-relaxed">
        Enter your email and we&apos;ll send you a magic link to sign in instantly.
      </p>

      {/* Email field */}
      <div className="space-y-1.5">
        <label
          htmlFor="magic-link-email"
          className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider"
        >
          Email
        </label>
        <input
          id="magic-link-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          aria-describedby={error ? 'magic-link-error' : undefined}
          className="w-full px-4 py-3 rounded-xl bg-neutral-50 border-transparent focus:bg-white border focus:border-emerald-500/50 text-neutral-900 focus:ring-0 transition-all dark:bg-neutral-900 dark:focus:bg-black dark:text-white dark:focus:border-emerald-500/50 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 font-light"
          placeholder="you@example.com"
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
        disabled={isLoading}
        className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] transition-all duration-200"
      >
        {isLoading ? (
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
            Sending...
          </span>
        ) : (
          'Send Magic Link'
        )}
      </button>
    </form>
  )
}
