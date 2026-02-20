'use client'

import { X, CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react'
import type { CodeEvaluation, EvaluationIssueType } from '@/lib/types'

interface EvaluationBubbleProps {
  evaluation?: CodeEvaluation | null
  error?: string | null
  onDismiss: () => void
  onRetry?: () => void
}

const issueTypeConfig: Record<EvaluationIssueType, { label: string; className: string }> = {
  syntax: {
    label: 'Syntax Issue',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  logic: {
    label: 'Logic Issue',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  'edge-case': {
    label: 'Edge Case',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  efficiency: {
    label: 'Efficiency',
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  },
  none: {
    label: 'Looking Good',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
}

export function EvaluationBubble({
  evaluation,
  error,
  onDismiss,
  onRetry,
}: EvaluationBubbleProps) {
  // Error state
  if (error) {
    return (
      <div className="animate-in fade-in slide-in-from-top-2 duration-200 mx-4 my-2 p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Evaluation Failed</span>
          </div>
          <button onClick={onDismiss} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 text-sm font-medium text-red-700 dark:text-red-400 hover:underline"
          >
            Try Again
          </button>
        )}
      </div>
    )
  }

  // No evaluation yet
  if (!evaluation) return null

  const issueConfig = evaluation.issueType
    ? issueTypeConfig[evaluation.issueType]
    : issueTypeConfig.none

  const isSuccess = evaluation.isOnTrack && (!evaluation.issueType || evaluation.issueType === 'none')

  return (
    <div className={`animate-in fade-in slide-in-from-top-2 duration-200 mx-4 my-2 p-4 rounded-lg border ${isSuccess
        ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20'
        : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50'
      }`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {issueConfig.label === 'Looking Good' || isSuccess ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Lightbulb className="w-5 h-5 text-amber-500 dark:text-amber-400" />
          )}
          <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${issueTypeConfig[evaluation.issueType || 'none'].className}`}>
            {issueTypeConfig[evaluation.issueType || 'none'].label}
          </span>
        </div>
        <button
          onClick={onDismiss}
          className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
          aria-label="Dismiss feedback"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Feedback */}
      <p className="mt-3 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
        {evaluation.feedback}
      </p>

      {/* Hint (if any) */}
      {evaluation.hint && (
        <div className="mt-3 p-3 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wide mb-1">
            <Lightbulb className="w-3.5 h-3.5" />
            Hint
          </div>
          <p className="text-sm text-amber-800 dark:text-amber-300">{evaluation.hint}</p>
        </div>
      )}

      {/* Suggested Improvement (for correct code) */}
      {isSuccess && evaluation.suggestedImprovement && (
        <div className="mt-3 p-3 rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <div className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 mb-1">
            Optional Improvement
          </div>
          <p className="text-sm text-emerald-800 dark:text-emerald-300">
            {evaluation.suggestedImprovement}
          </p>
        </div>
      )}
    </div>
  )
}
