import { CheckCircle2, Circle, Clock } from 'lucide-react'
import type { Problem, Pattern } from '../types'

interface ProblemCardProps {
  problem: Problem
  patterns: Pattern[]
  onSelect?: () => void
}

const difficultyColors = {
  Easy: 'text-emerald-600 dark:text-emerald-400',
  Medium: 'text-amber-600 dark:text-amber-400',
  Hard: 'text-red-500 dark:text-red-400',
}

const statusConfig = {
  Solved: {
    icon: CheckCircle2,
    className: 'text-emerald-500',
    bgClassName: 'bg-emerald-50 dark:bg-emerald-950/50',
  },
  Attempted: {
    icon: Clock,
    className: 'text-amber-500',
    bgClassName: 'bg-amber-50 dark:bg-amber-950/50',
  },
  Untouched: {
    icon: Circle,
    className: 'text-slate-300 dark:text-slate-600',
    bgClassName: '',
  },
}

export function ProblemCard({ problem, patterns, onSelect }: ProblemCardProps) {
  const status = statusConfig[problem.completionStatus]
  const StatusIcon = status.icon

  const patternNames = problem.patterns
    .map((patternId) => patterns.find((p) => p.id === patternId)?.name)
    .filter(Boolean)

  return (
    <button
      onClick={onSelect}
      className={`
        group relative w-full rounded-lg border border-slate-200 bg-white p-4 text-left
        transition-all duration-200 hover:border-slate-300 hover:shadow-md
        dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700
        ${status.bgClassName}
      `}
    >
      {/* Status indicator */}
      <div className="absolute right-3 top-3">
        <StatusIcon className={`h-5 w-5 ${status.className}`} />
      </div>

      {/* Difficulty badge */}
      <span className={`text-xs font-semibold uppercase tracking-wide ${difficultyColors[problem.difficulty]}`}>
        {problem.difficulty}
      </span>

      {/* Title */}
      <h3 className="mt-1.5 pr-6 text-base font-semibold text-slate-900 group-hover:text-emerald-600 dark:text-white dark:group-hover:text-emerald-400">
        {problem.title}
      </h3>

      {/* Description */}
      <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
        {problem.description}
      </p>

      {/* Pattern tags */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {patternNames.map((name) => (
          <span
            key={name}
            className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400"
          >
            {name}
          </span>
        ))}
      </div>
    </button>
  )
}
