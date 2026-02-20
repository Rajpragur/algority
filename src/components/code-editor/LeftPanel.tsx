'use client'

import { useCallback, useEffect, useRef } from 'react'
import { Problem, Difficulty, CoachingInsights } from '@/lib/types'
import { InsightsTab } from './InsightsTab'
import { ProblemDescription } from '@/components/shared'

interface LeftPanelProps {
  problem: Problem
  activeTab: 'problem' | 'solution' | 'insights'
  onTabChange: (tab: 'problem' | 'solution' | 'insights') => void
  // Solution reveal props
  solutionRevealed: boolean
  showRevealDialog: boolean
  onCancelReveal: () => void
  onConfirmReveal: () => void
  // Coaching insights for the Insights tab
  insights: CoachingInsights | null
}

const tabs = [
  { id: 'problem', label: 'Problem', panelId: 'tabpanel-problem' },
  { id: 'solution', label: 'Solution', panelId: 'tabpanel-solution' },
  { id: 'insights', label: 'Insights', panelId: 'tabpanel-insights' },
] as const

const difficultyColors: Record<Difficulty, string> = {
  Easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Hard: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export function LeftPanel({
  problem,
  activeTab,
  onTabChange,
  solutionRevealed,
  showRevealDialog,
  onCancelReveal,
  onConfirmReveal,
  insights,
}: LeftPanelProps) {
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, currentIndex: number) => {
      let newIndex: number | null = null

      switch (event.key) {
        case 'ArrowRight':
          newIndex = (currentIndex + 1) % tabs.length
          break
        case 'ArrowLeft':
          newIndex = (currentIndex - 1 + tabs.length) % tabs.length
          break
        case 'Home':
          newIndex = 0
          break
        case 'End':
          newIndex = tabs.length - 1
          break
        default:
          return
      }

      event.preventDefault()
      onTabChange(tabs[newIndex].id)
    },
    [onTabChange]
  )

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black border-r border-neutral-200 dark:border-neutral-800">
      {/* Tab Navigation */}
      <div role="tablist" aria-label="Problem sections" className="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={tab.panelId}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider transition-all relative ${activeTab === tab.id
              ? 'text-neutral-900 dark:text-white'
              : 'text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div
        id="tabpanel-problem"
        role="tabpanel"
        aria-labelledby="tab-problem"
        hidden={activeTab !== 'problem'}
        className="flex-1 overflow-y-auto p-6 "
      >
        {/* Problem Header */}
        <div className="mb-6 pb-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
              {problem.title}
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${problem.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' :
                problem.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' :
                  'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800'
                }`}
            >
              {problem.difficulty}
            </span>
          </div>
        </div>

        {/* Problem Description */}
        <div className="text-neutral-700 dark:text-neutral-300 prose prose-neutral dark:prose-invert prose-sm max-w-none prose-headings:font-semibold prose-code:font-mono prose-code:bg-neutral-100 dark:prose-code:bg-neutral-800 prose-code:text-neutral-800 dark:prose-code:text-neutral-200 prose-code:rounded prose-code:px-1 prose-code:py-0.5">
          <ProblemDescription description={problem.problem_description} />
        </div>
      </div>

      <div
        id="tabpanel-solution"
        role="tabpanel"
        aria-labelledby="tab-solution"
        hidden={activeTab !== 'solution'}
        className="flex-1 overflow-y-auto p-6"
      >
        {solutionRevealed ? (
          <SolutionDisplay solution={problem.solution} />
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4 text-neutral-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm max-w-xs">
              The solution is hidden to encourage independent problem solving.
            </p>
            <button
              onClick={onConfirmReveal} /* We can skip the dialog here since it's an explicit action in empty state, or keep it */
              className="mt-4 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Reveal Solution
            </button>
          </div>
        )}
      </div>

      <div
        id="tabpanel-insights"
        role="tabpanel"
        aria-labelledby="tab-insights"
        hidden={activeTab !== 'insights'}
        className="flex-1 overflow-y-auto p-6"
      >
        <InsightsTab insights={insights} problemId={problem.id} />
      </div>

      {/* Solution Reveal Confirmation Dialog */}
      <RevealSolutionDialog
        isOpen={showRevealDialog}
        onCancel={onCancelReveal}
        onReveal={onConfirmReveal}
      />
    </div>
  )
}

function SolutionDisplay({ solution }: { solution?: string | null }) {
  if (!solution) {
    return (
      <div className="text-slate-500 dark:text-slate-400 text-center py-8">
        <p className="text-sm">No reference solution available for this problem.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        Reference Solution
      </h3>
      <pre className="bg-slate-900 dark:bg-slate-950 p-4 rounded-lg overflow-auto border border-slate-700">
        <code className="text-sm font-mono text-slate-100 whitespace-pre">{solution}</code>
      </pre>
    </div>
  )
}

function RevealSolutionDialog({
  isOpen,
  onCancel,
  onReveal,
}: {
  isOpen: boolean
  onCancel: () => void
  onReveal: () => void
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)

  // Handle Escape key and focus trap
  useEffect(() => {
    if (!isOpen) return

    // Focus the cancel button when dialog opens
    cancelButtonRef.current?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
        return
      }

      // Focus trap - only trap Tab key
      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="reveal-dialog-title"
        aria-describedby="reveal-dialog-description"
        className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 max-w-md mx-4 border border-slate-200 dark:border-slate-700"
      >
        <h3
          id="reveal-dialog-title"
          className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2"
        >
          Reveal Solution?
        </h3>
        <p
          id="reveal-dialog-description"
          className="text-slate-600 dark:text-slate-400 mb-6"
        >
          Are you sure you want to reveal the solution? Try solving the problem yourself first for
          the best learning experience.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            ref={cancelButtonRef}
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onReveal}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
          >
            Reveal Solution
          </button>
        </div>
      </div>
    </div>
  )
}
