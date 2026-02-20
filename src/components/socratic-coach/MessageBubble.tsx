'use client'

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Flag } from 'lucide-react'
import { motion } from 'framer-motion'
import type {
  Message,
  FeedbackMessage,
  CoachMessage,
  CoachResponseMessage,
  ProbeQuestionMessage,
  ProbeEvaluationMessage,
} from '@/lib/types'
import { flagCoachingMessage } from '@/app/actions'

// Convert Unicode escape sequences (e.g., \u2264) to actual characters
function decodeUnicodeEscapes(text: string): string {
  return text.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  )
}

// Shared markdown components for consistent styling
function createMarkdownComponents(textColorClass: string) {
  return {
    p: ({ children }: { children?: React.ReactNode }) => (
      <p className={`text-sm leading-relaxed ${textColorClass}`}>{children}</p>
    ),
    strong: ({ children }: { children?: React.ReactNode }) => (
      <strong className="font-semibold">{children}</strong>
    ),
    em: ({ children }: { children?: React.ReactNode }) => (
      <em className="italic">{children}</em>
    ),
    code: ({ children }: { children?: React.ReactNode }) => (
      <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-xs font-mono">{children}</code>
    ),
    ul: ({ children }: { children?: React.ReactNode }) => (
      <ul className="list-disc list-inside space-y-1 mt-1">{children}</ul>
    ),
    ol: ({ children }: { children?: React.ReactNode }) => (
      <ol className="list-decimal list-inside space-y-1 mt-1">{children}</ol>
    ),
    li: ({ children }: { children?: React.ReactNode }) => (
      <li className={`text-sm ${textColorClass}`}>{children}</li>
    ),
  }
}

interface MessageBubbleProps {
  message: Message
  showNextButton?: boolean
  buttonText?: string
  onNextQuestion?: () => void
}

interface FlagButtonProps {
  messageId: string
  initialFlagged: boolean
}

function FlagButton({ messageId, initialFlagged }: FlagButtonProps): React.ReactElement {
  const [isFlagged, setIsFlagged] = useState(initialFlagged)
  const [isLoading, setIsLoading] = useState(false)

  const handleFlag = async () => {
    if (isFlagged || isLoading) return

    setIsLoading(true)
    try {
      const result = await flagCoachingMessage(messageId)
      if (result.success) {
        setIsFlagged(true)
      }
    } catch (error) {
      console.error('Failed to flag message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleFlag}
      disabled={isFlagged || isLoading}
      className={`p-1 rounded transition-colors ${isFlagged
        ? 'text-amber-500 cursor-default'
        : 'text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400'
        }`}
      title={isFlagged ? 'Flagged as unhelpful' : 'Flag as unhelpful'}
    >
      <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-current' : ''}`} />
    </button>
  )
}

// Shared bubble wrapper for coach messages with avatar
interface CoachBubbleProps {
  iconGradient: string
  icon: React.ReactNode
  bubbleClasses: string
  textColorClass: string
  content: string
  label?: string
  labelColorClass?: string
  messageId?: string
  isFlagged?: boolean
  children?: React.ReactNode
}

function CoachBubble({
  iconGradient,
  icon,
  bubbleClasses,
  textColorClass,
  content,
  label,
  labelColorClass,
  messageId,
  isFlagged,
  children,
}: CoachBubbleProps): React.ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex gap-3 group"
    >
      <div className={`shrink-0 w-8 h-8 rounded-full bg-gradient-to-br ${iconGradient} flex items-center justify-center shadow-md`}>
        {icon}
      </div>
      <div className={`flex-1 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border relative ${bubbleClasses}`}>
        {label && (
          <p className={`text-xs font-semibold mb-1 ${labelColorClass}`}>
            {label}
          </p>
        )}
        <ReactMarkdown components={createMarkdownComponents(textColorClass)}>
          {decodeUnicodeEscapes(content)}
        </ReactMarkdown>
        {children}
        {messageId && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <FlagButton messageId={messageId} initialFlagged={isFlagged || false} />
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Common SVG icons used across message types
const Icons = {
  lightbulb: (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  check: (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  ),
  chat: (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  question: (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  checkCircle: (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  edit: (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
}

// Probe evaluation level configurations
const PROBE_LEVEL_CONFIG = {
  strong: {
    label: 'Great understanding!',
    bgClass: 'bg-emerald-50 dark:bg-emerald-900/20',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
    textClass: 'text-emerald-800 dark:text-emerald-300',
    labelClass: 'text-emerald-700 dark:text-emerald-400',
    iconBgClass: 'from-emerald-400 to-emerald-600',
  },
  partial: {
    label: 'On the right track',
    bgClass: 'bg-blue-50 dark:bg-blue-900/20',
    borderClass: 'border-blue-200 dark:border-blue-800',
    textClass: 'text-blue-800 dark:text-blue-300',
    labelClass: 'text-blue-700 dark:text-blue-400',
    iconBgClass: 'from-blue-400 to-blue-600',
  },
  unclear: {
    label: 'Let me clarify',
    bgClass: 'bg-amber-50 dark:bg-amber-900/20',
    borderClass: 'border-amber-200 dark:border-amber-800',
    textClass: 'text-amber-800 dark:text-amber-300',
    labelClass: 'text-amber-700 dark:text-amber-400',
    iconBgClass: 'from-amber-400 to-amber-600',
  },
  incorrect: {
    label: 'Not quite right',
    bgClass: 'bg-rose-50 dark:bg-rose-900/20',
    borderClass: 'border-rose-200 dark:border-rose-800',
    textClass: 'text-rose-800 dark:text-rose-300',
    labelClass: 'text-rose-700 dark:text-rose-400',
    iconBgClass: 'from-rose-400 to-rose-600',
  },
} as const

const PROBE_TYPE_LABELS = {
  'short-answer': 'Quick check',
  'explain-reasoning': 'Explain your thinking',
  'predict-behavior': 'Predict the outcome',
} as const

export function MessageBubble({ message, showNextButton, buttonText = 'Next Question', onNextQuestion }: MessageBubbleProps): React.ReactElement | null {
  // Disable the next button for 5 seconds to ensure user reads the feedback
  // Skip delay for phase transitions since they already have loading states
  const isPhaseTransition = buttonText === 'Start Next Phase'
  const [isButtonDisabled, setIsButtonDisabled] = useState(showNextButton && !isPhaseTransition)

  useEffect(() => {
    if (showNextButton && !isPhaseTransition) {
      setIsButtonDisabled(true)
      const timer = setTimeout(() => {
        setIsButtonDisabled(false)
      }, 5000)
      return () => clearTimeout(timer)
    } else {
      setIsButtonDisabled(false)
    }
  }, [showNextButton, isPhaseTransition])

  if (message.type === 'coach') {
    const coachMsg = message as CoachMessage
    return (
      <CoachBubble
        iconGradient="from-emerald-400 to-emerald-600"
        icon={Icons.lightbulb}
        bubbleClasses="bg-white dark:bg-neutral-800 border-neutral-100 dark:border-neutral-700 shadow-sm"
        textColorClass="text-neutral-700 dark:text-neutral-300"
        content={coachMsg.content}
        messageId={coachMsg.id}
        isFlagged={coachMsg.isFlagged}
      />
    )
  }

  if (message.type === 'feedback') {
    const feedback = message as FeedbackMessage
    const isCorrect = feedback.isCorrect
    return (
      <CoachBubble
        iconGradient={isCorrect ? 'from-emerald-400 to-emerald-600' : 'from-amber-400 to-amber-600'}
        icon={isCorrect ? Icons.check : Icons.lightbulb}
        bubbleClasses={isCorrect
          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
          : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
        }
        textColorClass={isCorrect
          ? 'text-emerald-800 dark:text-emerald-300'
          : 'text-amber-800 dark:text-amber-300'
        }
        content={feedback.content}
        label={isCorrect ? 'Correct!' : 'Not quite!'}
        labelColorClass={isCorrect
          ? 'text-emerald-700 dark:text-emerald-400'
          : 'text-amber-700 dark:text-amber-400'
        }
        messageId={feedback.id}
        isFlagged={feedback.isFlagged}
      >
        {showNextButton && onNextQuestion && (
          <div className="mt-3 pt-3 border-t border-current/10">
            <button
              onClick={onNextQuestion}
              disabled={isButtonDisabled}
              className={`relative w-full py-2.5 rounded-lg text-sm font-semibold overflow-hidden ${isButtonDisabled
                ? 'bg-slate-300 dark:bg-slate-600 cursor-not-allowed'
                : isCorrect
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow transition-all'
                  : 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm hover:shadow transition-all'
                }`}
            >
              {/* Animated fill overlay - fills from left to right over 4 seconds */}
              {isButtonDisabled && (
                <span
                  className={`absolute inset-y-0 left-0 ${isCorrect ? 'bg-emerald-600' : 'bg-amber-600'}`}
                  style={{
                    width: '100%',
                    transform: 'scaleX(0)',
                    transformOrigin: 'left',
                    animation: 'fillRight 5s linear forwards',
                  }}
                />
              )}
              <span className={`relative inline-flex items-center gap-2 ${isButtonDisabled ? 'text-white' : ''}`}>
                {buttonText}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
          </div>
        )}
      </CoachBubble>
    )
  }

  if (message.type === 'coach-response') {
    const coachResponse = message as CoachResponseMessage
    return (
      <CoachBubble
        iconGradient="from-blue-400 to-blue-600"
        icon={Icons.chat}
        bubbleClasses="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
        textColorClass="text-blue-800 dark:text-blue-300"
        content={coachResponse.content}
        messageId={coachResponse.id}
        isFlagged={coachResponse.isFlagged}
      />
    )
  }

  if (message.type === 'probe-question') {
    const probeQuestion = message as ProbeQuestionMessage
    return (
      <CoachBubble
        iconGradient="from-violet-400 to-violet-600"
        icon={Icons.question}
        bubbleClasses="bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800"
        textColorClass="text-violet-800 dark:text-violet-300"
        content={probeQuestion.content}
        label={PROBE_TYPE_LABELS[probeQuestion.probeType]}
        labelColorClass="text-violet-600 dark:text-violet-400"
      />
    )
  }

  if (message.type === 'probe-response') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] bg-violet-100 dark:bg-violet-900/40 rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm border border-violet-200 dark:border-violet-700">
          <ReactMarkdown components={createMarkdownComponents('text-violet-900 dark:text-violet-200')}>
            {decodeUnicodeEscapes(message.content)}
          </ReactMarkdown>
        </div>
      </div>
    )
  }

  if (message.type === 'probe-evaluation') {
    const probeEvaluation = message as ProbeEvaluationMessage
    const levelConfig = PROBE_LEVEL_CONFIG[probeEvaluation.understandingLevel]
    return (
      <CoachBubble
        iconGradient={levelConfig.iconBgClass}
        icon={Icons.checkCircle}
        bubbleClasses={`${levelConfig.bgClass} ${levelConfig.borderClass}`}
        textColorClass={levelConfig.textClass}
        content={probeEvaluation.content}
        label={levelConfig.label}
        labelColorClass={levelConfig.labelClass}
        messageId={probeEvaluation.id}
        isFlagged={probeEvaluation.isFlagged}
      />
    )
  }

  return null
}
