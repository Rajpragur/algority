import type { Problem } from '../types'

interface SessionHeaderProps {
  problem: Problem
  elapsedSeconds: number
}

export function SessionHeader({ problem, elapsedSeconds }: SessionHeaderProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const difficultyColors = {
    easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
    hard: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
  }

  return (
    <div className="px-4 py-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* Problem Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
                {problem.title}
              </h1>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${difficultyColors[problem.difficulty]}`}>
                {problem.difficulty}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
              {problem.summary}
            </p>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-mono text-sm font-medium text-slate-700 dark:text-slate-300">
                {formatTime(elapsedSeconds)}
              </span>
            </div>
          </div>
        </div>

        {/* Pattern Tags */}
        <div className="flex flex-wrap gap-2 mt-3">
          {problem.patterns.map(pattern => (
            <span
              key={pattern}
              className="px-2 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded"
            >
              {pattern}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
