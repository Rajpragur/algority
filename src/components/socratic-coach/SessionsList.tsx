'use client'

import { useState, useOptimistic, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import type { SessionWithProblem, Pattern } from '@/lib/types'
import { deleteCoachingSession, restartCoachingSession, submitAsGoldenCandidate } from '@/app/actions'
import { SessionCard } from './SessionCard'

interface SessionsListProps {
  sessions: SessionWithProblem[]
  patterns: Pattern[]
}

export function SessionsList({ sessions: initialSessions, patterns }: SessionsListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [optimisticSessions, setOptimisticSessions] = useOptimistic(
    initialSessions,
    (state, deletedId: string) => state.filter(s => s.id !== deletedId)
  )

  const handleDelete = async (sessionId: string) => {
    startTransition(async () => {
      setOptimisticSessions(sessionId)
      await deleteCoachingSession(sessionId)
    })
  }

  const handleRestart = async (problemId: number) => {
    // Server action generates messages then redirects
    await restartCoachingSession(problemId)
    // Note: redirect() in server action means we won't reach here on success
  }

  const handleSubmitAsExample = async (sessionId: string, notes?: string) => {
    const result = await submitAsGoldenCandidate(sessionId, notes)
    if (result.success) {
      router.refresh()
    }
    return result
  }

  if (optimisticSessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <BookOpen className="w-8 h-8 text-slate-400 dark:text-slate-500" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          No coaching sessions yet
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 text-center max-w-sm mb-6">
          Start practicing with AI-guided coaching to improve your problem-solving skills.
        </p>
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
        >
          Browse Problems
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {optimisticSessions.map(session => (
        <SessionCard
          key={session.id}
          session={session}
          patterns={patterns}
          onDelete={handleDelete}
          onRestart={handleRestart}
          onSubmitAsExample={handleSubmitAsExample}
        />
      ))}
    </div>
  )
}
