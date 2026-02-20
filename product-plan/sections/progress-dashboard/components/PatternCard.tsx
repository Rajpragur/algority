import type { PatternProgress } from '../types'

interface PatternCardProps {
  pattern: PatternProgress
}

export function PatternCard({ pattern }: PatternCardProps) {
  const statusConfig = {
    mastered: {
      ringColor: 'stroke-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      textColor: 'text-emerald-700 dark:text-emerald-400',
      label: 'Mastered'
    },
    'in-progress': {
      ringColor: 'stroke-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-200 dark:border-amber-800',
      textColor: 'text-amber-700 dark:text-amber-400',
      label: 'In Progress'
    },
    'not-started': {
      ringColor: 'stroke-slate-300 dark:stroke-slate-600',
      bgColor: 'bg-slate-50 dark:bg-slate-800/50',
      borderColor: 'border-slate-200 dark:border-slate-700',
      textColor: 'text-slate-500 dark:text-slate-400',
      label: 'Not Started'
    }
  }

  const config = statusConfig[pattern.status]
  const progressPercent = pattern.problemsTotal > 0
    ? (pattern.problemsCompleted / pattern.problemsTotal) * 100
    : 0

  // Calculate SVG circle parameters
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference

  return (
    <div className={`relative rounded-xl border p-4 ${config.bgColor} ${config.borderColor}`}>
      <div className="flex items-start gap-3">
        {/* Progress Ring */}
        <div className="relative shrink-0">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            {/* Background ring */}
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              strokeWidth="4"
              className="stroke-slate-200 dark:stroke-slate-700"
            />
            {/* Progress ring */}
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              strokeWidth="4"
              strokeLinecap="round"
              className={config.ringColor}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
                transition: 'stroke-dashoffset 0.5s ease-out'
              }}
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {pattern.successRate}%
            </span>
          </div>
        </div>

        {/* Pattern info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
            {pattern.name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
            {pattern.description}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {pattern.problemsCompleted}/{pattern.problemsTotal} problems
            </span>
            <span className={`text-xs font-medium ${config.textColor}`}>
              {config.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
