'use client'

import { Sparkles, Loader2 } from 'lucide-react'

interface EvaluateButtonProps {
  onEvaluate: () => void
  isLoading: boolean
  disabled?: boolean
}

export function EvaluateButton({ onEvaluate, isLoading, disabled }: EvaluateButtonProps) {
  return (
    <button
      onClick={onEvaluate}
      disabled={isLoading || disabled}
      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
      title="Get AI feedback on your code"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Sparkles className="w-4 h-4" />
      )}
      <span>Evaluate</span>
    </button>
  )
}
