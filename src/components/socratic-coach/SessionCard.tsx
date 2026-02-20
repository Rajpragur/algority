'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Clock, RotateCcw, Trash2, Play, Gift, Check } from 'lucide-react'
import type { SessionWithProblem, Pattern, Difficulty } from '@/lib/types'

interface SessionCardProps {
  session: SessionWithProblem
  patterns: Pattern[]
  onDelete: (sessionId: string) => Promise<void>
  onRestart: (problemId: number) => Promise<void>
  onSubmitAsExample: (sessionId: string, notes?: string) => Promise<{ success: boolean; alreadySubmitted?: boolean }>
}

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  Easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
  Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
  Hard: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
}

export function SessionCard({ session, patterns, onDelete, onRestart, onSubmitAsExample }: SessionCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isRestarting, setIsRestarting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSubmitForm, setShowSubmitForm] = useState(false)
  const [submitNotes, setSubmitNotes] = useState('')

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const patternNames = session.problem.patterns
    .map(patternId => patterns.find(p => p.id === patternId)?.name)
    .filter(Boolean)
    .slice(0, 2)

  const isCompleted = session.completedAt !== null
  const progressPercent = (session.phasesCompleted / 3) * 100
  const isAlreadySubmitted = session.isGoldenCandidate && session.submittedAsGoldenAt

  const handleResume = () => {
    router.push(`/coach/${session.id}`)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(session.id)
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleRestart = async () => {
    if (isRestarting) return
    setIsRestarting(true)
    try {
      await onRestart(session.problemId)
    } finally {
      setIsRestarting(false)
    }
  }

  const handleSubmitAsExample = async () => {
    setIsSubmitting(true)
    try {
      await onSubmitAsExample(session.id, submitNotes || undefined)
      setShowSubmitForm(false)
      setSubmitNotes('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-6 transition-all hover:border-emerald-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-700 overflow-hidden">
      {/* Header: Difficulty + Actions */}
      <div className="flex items-start justify-between mb-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${DIFFICULTY_COLORS[session.problem.difficulty]}`}>
          {session.problem.difficulty}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleRestart}
            disabled={isRestarting}
            className={`p-1 rounded transition-colors ${isRestarting
              ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            title="Start new session"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRestarting ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors"
            title="Delete session"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-xl font-medium text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors mb-3 line-clamp-2 leading-relaxed">
        {session.problem.title}
      </h3>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-slate-500 dark:text-slate-400">
            {isCompleted ? 'Completed' : `Phase ${session.phasesCompleted + 1}/3`}
          </span>
          <span className="text-slate-400 dark:text-slate-500">
            {session.phasesCompleted}/3
          </span>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Meta info */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{formatTime(session.elapsedSeconds)}</span>
        </div>
        <span className="text-slate-300 dark:text-slate-600">|</span>
        <span>{formatRelativeTime(session.updatedAt)}</span>
      </div>

      {/* Patterns */}
      {patternNames.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {patternNames.map((name, i) => (
            <span
              key={i}
              className="px-1.5 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded"
            >
              {name}
            </span>
          ))}
          {session.problem.patterns.length > 2 && (
            <span className="px-1.5 py-0.5 text-xs text-slate-400 dark:text-slate-500">
              +{session.problem.patterns.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-auto pt-2">
        {showSubmitForm ? (
          <div className="space-y-2">
            <textarea
              value={submitNotes}
              onChange={(e) => setSubmitNotes(e.target.value)}
              placeholder="Why is this a good example? (optional)"
              className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-1 focus:ring-emerald-500 focus:border-transparent resize-none"
              rows={2}
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setShowSubmitForm(false); setSubmitNotes('') }}
                className="flex-1 px-2 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAsExample}
                disabled={isSubmitting}
                className="flex-1 px-2 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        ) : showDeleteConfirm ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 dark:text-slate-400 flex-1">Delete?</span>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              No
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 disabled:opacity-50"
            >
              {isDeleting ? '...' : 'Yes'}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href={`/coach/${session.id}`}
              prefetch={true}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              {isCompleted ? 'Review' : 'Resume'}
            </Link>
            {isCompleted && (
              isAlreadySubmitted ? (
                <div
                  className="p-2 text-emerald-600 dark:text-emerald-400"
                  title="Submitted as example"
                >
                  <Check className="w-4 h-4" />
                </div>
              ) : (
                <button
                  onClick={() => setShowSubmitForm(true)}
                  className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  title="Submit as example"
                >
                  <Gift className="w-4 h-4" />
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}
