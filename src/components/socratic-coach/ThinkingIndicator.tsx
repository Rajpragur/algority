'use client'

import { useState, useEffect } from 'react'

interface ThinkingIndicatorProps {
  /** Type of action being processed */
  type: 'quiz' | 'question' | 'probe'
}

const MESSAGES: Record<ThinkingIndicatorProps['type'], string[]> = {
  quiz: [
    'Analyzing your answer...',
    'Evaluating your reasoning...',
    'Considering the problem context...',
    'Checking for common patterns...',
    'Crafting personalized feedback...',
    'Preparing your next challenge...',
    'Almost ready...',
  ],
  question: [
    'Thinking about your question...',
    'Considering the problem context...',
    'Reviewing relevant concepts...',
    'Finding the best way to guide you...',
    'Formulating a helpful response...',
    'Almost ready...',
  ],
  probe: [
    'Reading your explanation...',
    'Evaluating your understanding...',
    'Identifying key insights...',
    'Checking your reasoning depth...',
    'Preparing a follow-up...',
    'Almost ready...',
  ],
}

const COLORS: Record<ThinkingIndicatorProps['type'], {
  gradient: string
  bg: string
  border: string
  dot: string
  text: string
}> = {
  quiz: {
    gradient: 'from-emerald-400 to-emerald-600',
    bg: 'bg-white dark:bg-slate-800',
    border: 'border-slate-100 dark:border-slate-700',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  question: {
    gradient: 'from-blue-400 to-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500',
    text: 'text-blue-700 dark:text-blue-300',
  },
  probe: {
    gradient: 'from-violet-400 to-violet-600',
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    border: 'border-violet-200 dark:border-violet-800',
    dot: 'bg-violet-500',
    text: 'text-violet-700 dark:text-violet-300',
  },
}

const ICONS: Record<ThinkingIndicatorProps['type'], React.ReactNode> = {
  quiz: (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  question: (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  probe: (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

export function ThinkingIndicator({ type }: ThinkingIndicatorProps) {
  const [messageIndex, setMessageIndex] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const messages = MESSAGES[type]
  const colors = COLORS[type]
  const icon = ICONS[type]

  // Progress through messages every 3 seconds (covers ~18-21s total)
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => {
        // Stay on last message once reached
        if (prev >= messages.length - 1) return prev
        return prev + 1
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [messages.length])

  // Track elapsed time for the timer display
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const currentMessage = messages[messageIndex]

  return (
    <div className="flex gap-3">
      <div className={`shrink-0 w-8 h-8 rounded-full bg-gradient-to-br ${colors.gradient} flex items-center justify-center shadow-md animate-pulse`}>
        {icon}
      </div>
      <div className={`flex-1 ${colors.bg} rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border ${colors.border}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`text-sm ${colors.text} transition-opacity duration-300`}>
              {currentMessage}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
              {elapsedSeconds}s
            </span>
            <div className={`w-1.5 h-1.5 ${colors.dot} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }} />
            <div className={`w-1.5 h-1.5 ${colors.dot} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }} />
            <div className={`w-1.5 h-1.5 ${colors.dot} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }} />
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${colors.dot} transition-all duration-500 ease-out`}
            style={{ width: `${Math.min(((messageIndex + 1) / messages.length) * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
