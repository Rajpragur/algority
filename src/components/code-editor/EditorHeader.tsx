'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, Loader2 } from 'lucide-react'
import { Problem } from '@/lib/types'
import { checkIncompleteSession, createFreshSession } from '@/app/actions'

interface EditorHeaderProps {
  problem: Problem
}

export function EditorHeader({ problem }: EditorHeaderProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const difficultyColors = {
    Easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    Hard: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
  }

  const handleStartCoaching = async () => {
    setIsLoading(true)
    setError(null)
    startTransition(async () => {
      try {
        // Check for existing incomplete session
        const result = await checkIncompleteSession(problem.id)

        if (result.hasIncomplete && result.sessionId) {
          // Resume existing session - use Next.js router for client-side navigation
          router.push(`/coach/${result.sessionId}`)
        } else {
          // Create new session (redirect happens in server action)
          await createFreshSession(problem.id)
        }
      } catch (err) {
        // Rethrow redirect errors - they're not actual failures
        // Next.js redirect() throws an error with digest starting with 'NEXT_REDIRECT'
        if (err instanceof Error && 'digest' in err && String(err.digest).startsWith('NEXT_REDIRECT')) {
          throw err
        }
        console.error('Failed to start coaching:', err)
        setError('Failed to start coaching. Please try again.')
      } finally {
        setIsLoading(false)
      }
    })
  }

  return (
    <header className="h-14 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4 bg-white dark:bg-black z-10 relative">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Problems</span>
        </Link>

        <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800" />

        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-neutral-900 dark:text-white tracking-tight">{problem.title}</h1>
          <span
            className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md border ${problem.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' :
                problem.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' :
                  'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800'
              }`}
          >
            {problem.difficulty}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {error && (
          <span className="text-xs font-medium text-red-600 dark:text-red-400 animate-pulse">{error}</span>
        )}
        <button
          onClick={handleStartCoaching}
          disabled={isLoading || isPending}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-all shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30"
          title="Start or continue coaching for this problem"
        >
          {isLoading || isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <MessageSquare className="w-3.5 h-3.5" />
          )}
          <span>Coach</span>
        </button>
      </div>
    </header>
  )
}
