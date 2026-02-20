import type { Message, FeedbackMessage } from '../types'

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  if (message.type === 'coach') {
    return (
      <div className="flex gap-3">
        <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>

        <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-slate-100 dark:border-slate-700">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {message.content}
          </p>
        </div>
      </div>
    )
  }

  if (message.type === 'feedback') {
    const feedback = message as FeedbackMessage
    return (
      <div className="flex gap-3">
        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
          feedback.isCorrect
            ? 'bg-gradient-to-br from-emerald-400 to-emerald-600'
            : 'bg-gradient-to-br from-amber-400 to-amber-600'
        }`}>
          {feedback.isCorrect ? (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          )}
        </div>

        <div className={`flex-1 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border ${
          feedback.isCorrect
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
            : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
        }`}>
          <p className={`text-xs font-semibold mb-1 ${
            feedback.isCorrect
              ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-amber-700 dark:text-amber-400'
          }`}>
            {feedback.isCorrect ? 'Correct!' : 'Not quite!'}
          </p>
          <p className={`text-sm leading-relaxed ${
            feedback.isCorrect
              ? 'text-emerald-800 dark:text-emerald-300'
              : 'text-amber-800 dark:text-amber-300'
          }`}>
            {feedback.content}
          </p>
        </div>
      </div>
    )
  }

  return null
}
