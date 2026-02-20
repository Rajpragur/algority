'use client'

import { useState, useTransition } from 'react'
import { Lightbulb, MessageSquare, Loader2 } from 'lucide-react'
import { checkIncompleteSession, createFreshSession } from '@/app/actions'

interface EmptyInsightsProps {
  problemId: number
}

export function EmptyInsights({ problemId }: EmptyInsightsProps) {
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(false)

  const handleStartCoaching = async () => {
    setIsLoading(true)
    startTransition(async () => {
      // Check for existing incomplete session
      const result = await checkIncompleteSession(problemId)

      if (result.hasIncomplete && result.sessionId) {
        // Resume existing session
        window.location.href = `/coach/${result.sessionId}`
      } else {
        // Create new session (redirect happens in server action)
        await createFreshSession(problemId)
      }
      setIsLoading(false)
    })
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-6">
        <Lightbulb className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
      </div>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
        No Insights Yet
      </h3>

      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs mb-6">
        Complete a coaching session to unlock personalized insights and your
        step-by-step approach to reference while coding.
      </p>

      <button
        onClick={handleStartCoaching}
        disabled={isLoading || isPending}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 rounded-lg transition-colors"
      >
        {isLoading || isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <MessageSquare className="w-4 h-4" />
        )}
        <span>Start Coaching</span>
      </button>

      <p className="text-xs text-slate-500 dark:text-slate-500 mt-4 max-w-xs">
        Our AI coach guides you through the problem with Socratic questions,
        helping you discover the solution yourself.
      </p>
    </div>
  )
}
