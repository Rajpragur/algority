import { notFound } from 'next/navigation'
import { getPatterns } from '@/lib/data'
import { initializeCoachingSessionById } from '@/app/actions'
import { CoachingClient } from './CoachingClient'

export default async function CoachPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params

  // Validate UUID format (basic check)
  if (!sessionId || sessionId.length < 32) {
    notFound()
  }

  try {
    // Fetch session data and patterns in parallel to reduce latency
    const [sessionData, patterns] = await Promise.all([
      initializeCoachingSessionById(sessionId),
      getPatterns(),
    ])
    const { session, problem, messages, phases, isCompleted, isInitialized } = sessionData

    return (
      <CoachingClient
        problem={problem}
        patterns={patterns}
        initialSession={session}
        initialMessages={messages}
        initialPhases={phases}
        initialIsCompleted={isCompleted}
        initialIsInitialized={isInitialized ?? true}
      />
    )
  } catch (error) {
    console.error('Error initializing coaching session:', error)
    notFound()
  }
}
