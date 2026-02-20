'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { CoachingInsights, CachedPhaseSummary } from '@/lib/types'
import { EmptyInsights } from './EmptyInsights'

interface InsightsTabProps {
  insights: CoachingInsights | null
  problemId: number
}

const PHASE_ORDER = ['understanding', 'solution-building', 'algorithm-steps'] as const

const PHASE_TITLES: Record<string, string> = {
  understanding: 'Problem Understanding',
  'solution-building': 'Solution Building',
  'algorithm-steps': 'Algorithm Steps',
}

export function InsightsTab({ insights, problemId }: InsightsTabProps) {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set())

  if (!insights || !insights.hasSession) {
    return <EmptyInsights problemId={problemId} />
  }

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev)
      if (next.has(phaseId)) {
        next.delete(phaseId)
      } else {
        next.add(phaseId)
      }
      return next
    })
  }

  const hasPhaseSummaries =
    insights.phaseSummaries && Object.keys(insights.phaseSummaries).length > 0

  return (
    <div className="space-y-6">
      {/* Phase Summaries Section */}
      {hasPhaseSummaries && (
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Session Takeaways
          </h3>
          <div className="space-y-2">
            {PHASE_ORDER
              .filter((phaseId) => insights.phaseSummaries![phaseId])
              .map((phaseId) => (
                <PhaseCard
                  key={phaseId}
                  phaseId={phaseId}
                  summary={insights.phaseSummaries![phaseId]}
                  isExpanded={expandedPhases.has(phaseId)}
                  onToggle={() => togglePhase(phaseId)}
                />
              ))}
          </div>
        </div>
      )}

      {/* No phase summaries */}
      {!hasPhaseSummaries && (
        <div className="text-slate-500 dark:text-slate-400 text-center py-4">
          <p className="text-sm">
            Session completed, but no detailed insights were saved.
          </p>
        </div>
      )}
    </div>
  )
}

function PhaseCard({
  phaseId,
  summary,
  isExpanded,
  onToggle,
}: {
  phaseId: string
  summary: CachedPhaseSummary
  isExpanded: boolean
  onToggle: () => void
}) {
  const phaseTitle = PHASE_TITLES[phaseId] || phaseId
  const contentId = `phase-content-${phaseId}`

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        aria-expanded={isExpanded}
        aria-controls={contentId}
      >
        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {phaseTitle}
        </span>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-500" />
        )}
      </button>

      {isExpanded && (
        <div id={contentId} className="px-3 pb-3 space-y-2">
          {/* Summary text */}
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {summary.summary}
          </p>

          {/* Concepts covered */}
          {summary.conceptsCovered && summary.conceptsCovered.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {summary.conceptsCovered.map((concept, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                >
                  {concept}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
