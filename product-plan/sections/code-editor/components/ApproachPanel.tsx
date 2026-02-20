import type { Problem, ApproachSummary } from '../types'

interface ApproachPanelProps {
  problem: Problem
  approachSummary: ApproachSummary
}

export function ApproachPanel({ problem, approachSummary }: ApproachPanelProps) {
  const difficultyColors = {
    easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
    hard: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
  }

  return (
    <div className="h-full bg-white dark:bg-slate-900 p-4 sm:p-5">
      {/* Problem Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {problem.title}
          </h1>
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${difficultyColors[problem.difficulty]}`}>
            {problem.difficulty}
          </span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {problem.description}
        </p>
      </div>

      {/* Approach Summary */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {approachSummary.title}
          </h2>
        </div>

        <ol className="space-y-2 ml-1">
          {approachSummary.steps.map((step, index) => (
            <li key={index} className="flex gap-3 text-sm">
              <span className="shrink-0 w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-medium text-slate-500 dark:text-slate-400">
                {index + 1}
              </span>
              <span className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {step}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* Complexity */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
          Complexity
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Time</p>
            <p className="font-mono text-sm font-medium text-slate-900 dark:text-slate-100">
              {approachSummary.timeComplexity}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Space</p>
            <p className="font-mono text-sm font-medium text-slate-900 dark:text-slate-100">
              {approachSummary.spaceComplexity}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
