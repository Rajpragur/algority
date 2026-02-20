'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { ClientProblem, Pattern, CoachingSession, Phase, Message } from '@/lib/types'
import { SocraticCoach } from '@/components/socratic-coach'
import { submitCoachingAnswer, updateCoachingSessionTime, askCoachQuestion, submitProbeResponse, triggerPreGeneration, startCoachingSession, triggerFirstQuestionGeneration, completePhaseTransition } from '@/app/actions'

interface CoachingClientProps {
  problem: ClientProblem
  patterns: Pattern[]
  initialSession: CoachingSession
  initialMessages: Message[]
  initialPhases: Phase[]
  initialIsCompleted: boolean
  initialIsInitialized: boolean
}

export function CoachingClient({
  problem,
  patterns,
  initialSession,
  initialMessages,
  initialPhases,
  initialIsCompleted,
  initialIsInitialized,
}: CoachingClientProps) {
  const [session, setSession] = useState(initialSession)
  const [messages, setMessages] = useState(initialMessages)
  const [phases, setPhases] = useState(initialPhases)
  const [isCompleted, setIsCompleted] = useState(initialIsCompleted)
  const [isInitialized, setIsInitialized] = useState(initialIsInitialized)
  const [phaseTransition, setPhaseTransition] = useState<{
    pending: boolean
    previousPhaseId?: string
    nextPhaseId?: string
  }>({ pending: false })

  // Track question count to detect when new questions appear
  const questionCount = messages.filter(m => m.type === 'question').length
  const prevQuestionCount = useRef(questionCount)
  const hasTriggeredFirstQuestion = useRef(false)

  // Trigger first question generation when session is not initialized
  useEffect(() => {
    if (isInitialized || hasTriggeredFirstQuestion.current) return

    hasTriggeredFirstQuestion.current = true
    console.log('[Client] Triggering first question generation')
    triggerFirstQuestionGeneration(session.id).catch(err =>
      console.error('[Client] First question generation failed:', err)
    )
  }, [session.id, isInitialized])

  // Trigger pre-generation when component mounts or new questions appear
  useEffect(() => {
    if (isCompleted || !isInitialized) return

    // Trigger on mount (prevQuestionCount matches questionCount initially)
    // or when a new question appears (questionCount increased)
    const shouldTrigger = prevQuestionCount.current <= questionCount
    prevQuestionCount.current = questionCount

    if (shouldTrigger) {
      // Small delay to let the UI render first
      const timer = setTimeout(() => {
        console.log('[Client] Triggering pre-generation for next question')
        triggerPreGeneration(session.id).catch(err =>
          console.error('[Client] Pre-generation failed:', err)
        )
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [session.id, questionCount, isCompleted, isInitialized])

  const handleSubmitAnswer = useCallback(async (questionId: string, selectedOptions: string[]) => {
    try {
      const result = await submitCoachingAnswer(session.id, questionId, selectedOptions)
      setMessages(result.messages)
      setPhases(result.phases)

      if (result.isCompleted) {
        setIsCompleted(true)
      } else if (result.phaseTransitionPending && result.previousPhaseId && result.nextPhaseId) {
        // Phase transition detected - show celebration UI
        setPhaseTransition({
          pending: true,
          previousPhaseId: result.previousPhaseId,
          nextPhaseId: result.nextPhaseId,
        })

        // Complete the transition in the background
        try {
          const transitionResult = await completePhaseTransition(
            session.id,
            result.previousPhaseId,
            result.nextPhaseId
          )
          setMessages(transitionResult.messages)
          setPhases(transitionResult.phases)
          if (transitionResult.isCompleted) {
            setIsCompleted(true)
          }
        } finally {
          // Clear transition state regardless of success/failure
          setPhaseTransition({ pending: false })
        }
      }
    } catch (error) {
      console.error('Error submitting answer:', error)
      setPhaseTransition({ pending: false })
    }
  }, [session.id])

  const handleUpdateTime = useCallback((seconds: number) => {
    // Fire and forget - don't await
    updateCoachingSessionTime(session.id, seconds).catch(console.error)
  }, [session.id])

  const handleAskQuestion = useCallback(async (question: string) => {
    try {
      const result = await askCoachQuestion(session.id, question)
      setMessages(result.messages)
      setPhases(result.phases)
      if (result.isCompleted) {
        setIsCompleted(true)
      }
    } catch (error) {
      console.error('Error asking question:', error)
    }
  }, [session.id])

  const handleSubmitProbeResponse = useCallback(async (probeQuestionId: string, response: string) => {
    try {
      const result = await submitProbeResponse(session.id, probeQuestionId, response)
      setMessages(result.messages)
      setPhases(result.phases)
      if (result.isCompleted) {
        setIsCompleted(true)
      }
    } catch (error) {
      console.error('Error submitting probe response:', error)
    }
  }, [session.id])

  const handleStartSession = useCallback(async () => {
    try {
      const result = await startCoachingSession(session.id)
      if (result.success && result.messages && result.phases) {
        setMessages(result.messages)
        setPhases(result.phases)
        setIsInitialized(true)
      }
    } catch (error) {
      console.error('Error starting session:', error)
    }
  }, [session.id])

  return (
    <SocraticCoach
      problem={problem}
      patterns={patterns}
      session={session}
      phases={phases}
      messages={messages}
      isCompleted={isCompleted}
      isInitialized={isInitialized}
      phaseTransition={phaseTransition}
      onStartSession={handleStartSession}
      onSubmitAnswer={handleSubmitAnswer}
      onAskQuestion={handleAskQuestion}
      onSubmitProbeResponse={handleSubmitProbeResponse}
      onUpdateTime={handleUpdateTime}
    />
  )
}
