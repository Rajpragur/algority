'use client'

import { useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ProblemDescription } from '@/components/shared'
import type { ClientProblem } from '@/lib/types'

interface ProblemModalProps {
  problem: ClientProblem
  isOpen: boolean
  onClose: () => void
  /** Optional footer content (e.g., "Start Session" button) */
  footer?: React.ReactNode
}

const difficultyColors = {
  Easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
  Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
  Hard: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
}

export function ProblemModal({ problem, isOpen, onClose, footer }: ProblemModalProps) {
  // Handle Escape key to close modal
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal Content */}
      <div
        className="relative z-10 w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {problem.title}
            </h2>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${difficultyColors[problem.difficulty]}`}>
              {problem.difficulty}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-4 text-slate-700 dark:text-slate-300 prose prose-slate dark:prose-invert prose-sm max-w-none">
          <ProblemDescription description={problem.problem_description} />
        </div>

        {/* Optional Footer */}
        {footer && (
          <div className="sticky bottom-0 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
