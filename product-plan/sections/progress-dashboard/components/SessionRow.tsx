import type { RecentSession } from '../types'

interface SessionRowProps {
  session: RecentSession
}

export function SessionRow({ session }: SessionRowProps) {
  const isSolved = session.outcome === 'solved'

  // Format date to relative time
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  return (
    <div className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      {/* Status icon */}
      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isSolved
          ? 'bg-emerald-100 dark:bg-emerald-900/30'
          : 'bg-red-100 dark:bg-red-900/30'
      }`}>
        {isSolved ? (
          <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>

      {/* Problem info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
          {session.problemName}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {session.pattern}
        </p>
      </div>

      {/* Duration */}
      <div className="shrink-0 text-right">
        <p className="text-sm font-mono text-slate-600 dark:text-slate-400">
          {session.duration}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {formatDate(session.date)}
        </p>
      </div>
    </div>
  )
}
