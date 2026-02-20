import type { QuestionMessage } from '../types'

interface QuestionCardProps {
  question: QuestionMessage
  selectedOptions: string[]
  isSubmitted: boolean
  onOptionSelect: (optionId: string) => void
  onSubmit: () => void
}

export function QuestionCard({
  question,
  selectedOptions,
  isSubmitted,
  onOptionSelect,
  onSubmit
}: QuestionCardProps) {
  const isMultiSelect = question.questionType === 'multi-select'
  const hasSelection = selectedOptions.length > 0

  return (
    <div className="flex gap-3">
      <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md">
        <span className="text-white text-xs font-bold">?</span>
      </div>

      <div className="flex-1">
        <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-sm shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {question.content}
            </p>
            {isMultiSelect && !isSubmitted && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Select all that apply
              </p>
            )}
          </div>

          <div className="p-2">
            {question.options.map(option => {
              const isSelected = selectedOptions.includes(option.id)

              return (
                <button
                  key={option.id}
                  onClick={() => !isSubmitted && onOptionSelect(option.id)}
                  disabled={isSubmitted}
                  className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                    isSubmitted
                      ? isSelected
                        ? 'bg-slate-100 dark:bg-slate-700'
                        : 'opacity-50'
                      : isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 ring-2 ring-emerald-500'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {isMultiSelect ? (
                    <div className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  ) : (
                    <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'border-emerald-500'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}>
                      {isSelected && (
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      )}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-xs font-bold mr-2 ${
                      isSelected
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                    }`}>
                      {option.label}
                    </span>
                    <span className={`text-sm ${
                      isSelected
                        ? 'text-slate-800 dark:text-slate-200'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}>
                      {option.text}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          {!isSubmitted && (
            <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
              <button
                onClick={onSubmit}
                disabled={!hasSelection}
                className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  hasSelection
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                }`}
              >
                Submit Answer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
