'use client'

import { useMemo, useOptimistic, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Play, CheckCircle2, BookOpen } from 'lucide-react'
import type { SessionWithProblem, Pattern } from '@/lib/types'
import { deleteCoachingSession, restartCoachingSession, submitAsGoldenCandidate } from '@/app/actions'
import { SessionCard } from './SessionCard'

interface SessionsDashboardProps {
  sessions: SessionWithProblem[]
  patterns: Pattern[]
}

export function SessionsDashboard({ sessions: initialSessions, patterns }: SessionsDashboardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [optimisticSessions, setOptimisticSessions] = useOptimistic(
    initialSessions,
    (state, deletedId: string) => state.filter(s => s.id !== deletedId)
  )

  // Separate sessions into in-progress and completed
  const { inProgressSessions, completedSessions } = useMemo(() => {
    const inProgress: SessionWithProblem[] = []
    const completed: SessionWithProblem[] = []

    for (const session of optimisticSessions) {
      if (session.completedAt) {
        completed.push(session)
      } else {
        inProgress.push(session)
      }
    }

    return { inProgressSessions: inProgress, completedSessions: completed }
  }, [optimisticSessions])

  const handleDelete = async (sessionId: string) => {
    startTransition(async () => {
      setOptimisticSessions(sessionId)
      await deleteCoachingSession(sessionId)
    })
  }

  const handleRestart = async (problemId: number) => {
    await restartCoachingSession(problemId)
  }

  const handleSubmitAsExample = async (sessionId: string, notes?: string) => {
    const result = await submitAsGoldenCandidate(sessionId, notes)
    if (result.success) {
      router.refresh()
    }
    return result
  }

  const hasInProgress = inProgressSessions.length > 0
  const hasCompleted = completedSessions.length > 0
  const showEmptyState = !hasInProgress && !hasCompleted

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-6 border-dashed">
          <h1 className="text-3xl font-light tracking-widest uppercase text-slate-900 dark:text-white">
            Coaching Sessions
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 font-light tracking-wide">
            Resume your practice sessions or review completed ones.
          </p>
        </div>

        {/* Empty State */}
        {showEmptyState && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <BookOpen className="h-8 w-8 text-slate-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No coaching sessions yet
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Start practicing with AI-guided coaching to improve your problem-solving skills
            </p>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
            >
              Browse Problems
            </button>
          </div>
        )}

        {/* In Progress Sessions */}
        {hasInProgress && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-6">
              <Play className="h-5 w-5 text-emerald-500" />
              <h2 className="text-lg font-light tracking-widest uppercase text-slate-900 dark:text-white">
                In Progress
              </h2>
              <span className="text-sm text-slate-500 dark:text-slate-400 font-light">
                ({inProgressSessions.length})
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {inProgressSessions.map((session) => (
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
          </section>
        )}

        {/* Completed Sessions */}
        {hasCompleted && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle2 className="h-5 w-5 text-slate-400" />
              <h2 className="text-lg font-light tracking-widest uppercase text-slate-900 dark:text-white">
                Completed
              </h2>
              <span className="text-sm text-slate-500 dark:text-slate-400 font-light">
                ({completedSessions.length})
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {completedSessions.map((session) => (
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
          </section>
        )}
      </div>
    </div>
  )
}
