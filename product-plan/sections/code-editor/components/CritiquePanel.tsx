import type { AICritique } from '../types'

interface CritiquePanelProps {
  critique: AICritique
  onToggle?: () => void
}

export function CritiquePanel({ critique, onToggle }: CritiquePanelProps) {
  const suggestionIcons: Record<string, React.ReactNode> = {
    improvement: (
      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    style: (
      <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    optimization: (
      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    bug: (
      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    )
  }

  const suggestionColors: Record<string, string> = {
    improvement: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    style: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    optimization: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    bug: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
  }

  return (
    <div className="bg-white dark:bg-slate-900">
      <button
        onClick={() => onToggle?.()}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${critique.isVisible ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              AI Critique
            </span>
          </div>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {critique.suggestions.length} suggestions
        </span>
      </button>

      {critique.isVisible && (
        <div className="px-4 pb-4">
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              {critique.overallAssessment}
            </p>
          </div>

          <div className="space-y-3">
            {critique.suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${suggestionColors[suggestion.type] || 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {suggestionIcons[suggestion.type]}
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {suggestion.title}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {suggestion.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
