import type { SubmissionResult } from '../types'

interface SubmissionModalProps {
  result: SubmissionResult | null
  onClose: () => void
  onNextProblem?: () => void
}

export function SubmissionModal({ result, onClose, onNextProblem }: SubmissionModalProps) {
  const displayResult: SubmissionResult = result || {
    score: 100,
    totalTests: 15,
    passedTests: 15,
    failedTests: 0,
    runtime: '42ms',
    memory: '14.2 MB',
    status: 'accepted'
  }

  const statusConfig = {
    accepted: {
      title: 'Accepted!',
      subtitle: 'All test cases passed',
      color: 'text-emerald-600 dark:text-emerald-400',
      bgGradient: 'from-emerald-500 to-emerald-600',
      icon: (
        <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    wrong_answer: {
      title: 'Wrong Answer',
      subtitle: 'Some test cases failed',
      color: 'text-red-600 dark:text-red-400',
      bgGradient: 'from-red-500 to-red-600',
      icon: (
        <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    time_limit: {
      title: 'Time Limit Exceeded',
      subtitle: 'Your solution took too long',
      color: 'text-amber-600 dark:text-amber-400',
      bgGradient: 'from-amber-500 to-amber-600',
      icon: (
        <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    runtime_error: {
      title: 'Runtime Error',
      subtitle: 'Your code crashed during execution',
      color: 'text-red-600 dark:text-red-400',
      bgGradient: 'from-red-500 to-red-600',
      icon: (
        <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    }
  }

  const config = statusConfig[displayResult.status]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className={`relative px-6 py-8 bg-gradient-to-br ${config.bgGradient} text-center`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex justify-center mb-4">
            {config.icon}
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">
            {config.title}
          </h2>
          <p className="text-white/80">
            {config.subtitle}
          </p>
        </div>

        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Score</p>
            <p className={`text-4xl font-bold ${config.color}`}>
              {displayResult.score}%
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {displayResult.totalTests}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total Tests</p>
            </div>
            <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {displayResult.passedTests}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Passed</p>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {displayResult.failedTests}
              </p>
              <p className="text-xs text-red-600 dark:text-red-400">Failed</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 mb-6 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-slate-500 dark:text-slate-400">Runtime:</span>
              <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{displayResult.runtime}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              <span className="text-slate-500 dark:text-slate-400">Memory:</span>
              <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{displayResult.memory}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Review Code
            </button>
            {displayResult.status === 'accepted' && (
              <button
                onClick={() => onNextProblem?.()}
                className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-lg shadow-emerald-500/25"
              >
                Next Problem →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
