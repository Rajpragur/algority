import { useState } from 'react'
import type { SocraticCoachProps, Message, QuestionMessage } from '../types'
import { SessionHeader } from './SessionHeader'
import { PhaseProgress } from './PhaseProgress'
import { MessageBubble } from './MessageBubble'
import { QuestionCard } from './QuestionCard'

export function SocraticCoach({
  problem,
  session,
  phases,
  messages,
  onSelectOption,
  onSubmitAnswer,
  onReviewPhase,
  onProceedToEditor
}: SocraticCoachProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({})

  const handleOptionSelect = (questionId: string, optionId: string, isMultiSelect: boolean) => {
    setSelectedOptions(prev => {
      const current = prev[questionId] || []
      if (isMultiSelect) {
        const updated = current.includes(optionId)
          ? current.filter(id => id !== optionId)
          : [...current, optionId]
        return { ...prev, [questionId]: updated }
      } else {
        return { ...prev, [questionId]: [optionId] }
      }
    })
    onSelectOption?.(questionId, selectedOptions[questionId] || [])
  }

  const handleSubmit = (questionId: string) => {
    onSubmitAnswer?.(questionId)
  }

  const allPhasesCompleted = phases.every(p => p.status === 'completed')

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <SessionHeader
          problem={problem}
          elapsedSeconds={session.elapsedSeconds}
        />
        <PhaseProgress
          phases={phases}
          currentPhase={session.currentPhase}
          onReviewPhase={onReviewPhase}
        />
      </div>

      {/* Chat/Quiz Interface */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {messages.map((message, index) => {
            if (message.type === 'question') {
              const questionMsg = message as QuestionMessage
              const nextMessage = messages[index + 1]
              const isAnswered = nextMessage?.type === 'user-answer'
              const userAnswer = isAnswered ? messages[index + 1] : null

              if (isAnswered && userAnswer && 'selectedOptions' in userAnswer) {
                return (
                  <QuestionCard
                    key={message.id}
                    question={questionMsg}
                    selectedOptions={userAnswer.selectedOptions}
                    isSubmitted={true}
                    onOptionSelect={() => {}}
                    onSubmit={() => {}}
                  />
                )
              } else {
                return (
                  <QuestionCard
                    key={message.id}
                    question={questionMsg}
                    selectedOptions={selectedOptions[message.id] || []}
                    isSubmitted={false}
                    onOptionSelect={(optionId) => handleOptionSelect(
                      message.id,
                      optionId,
                      questionMsg.questionType === 'multi-select'
                    )}
                    onSubmit={() => handleSubmit(message.id)}
                  />
                )
              }
            }

            if (message.type === 'user-answer') {
              return null
            }

            return (
              <MessageBubble key={message.id} message={message} />
            )
          })}
        </div>

        {/* Proceed to Editor Button */}
        {allPhasesCompleted && (
          <div className="mt-12 text-center">
            <button
              onClick={() => onProceedToEditor?.()}
              className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5"
            >
              <span>Continue to Code Editor</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
