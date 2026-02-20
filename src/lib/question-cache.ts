/**
 * Upstash Redis cache for pre-generated questions.
 * Uses Redis-compatible KV store that persists across serverless invocations.
 */

import { Redis } from '@upstash/redis'
import type { CachedQuestion } from './types'

// Initialize Redis client (auto-detects env vars)
const redis = Redis.fromEnv()

// Cache TTL: 5 minutes (questions are session-specific and short-lived)
const CACHE_TTL_SECONDS = 300

// Key builders
function nextQuestionKey(sessionId: string, phaseId: string): string {
  return `session:${sessionId}:next-question:${phaseId}`
}

function phaseTransitionKey(sessionId: string, nextPhaseId: string): string {
  return `session:${sessionId}:phase-transition:${nextPhaseId}`
}

// =============================================================================
// Next Question Cache (for current phase)
// =============================================================================

/**
 * Save a pre-generated question for the current phase
 */
export async function cacheNextQuestion(
  sessionId: string,
  phaseId: string,
  question: CachedQuestion
): Promise<void> {
  const key = nextQuestionKey(sessionId, phaseId)
  await redis.set(key, question, { ex: CACHE_TTL_SECONDS })
  console.log(`[RedisCache] Saved next question for phase: ${phaseId}`)
}

/**
 * Get a cached question for the current phase
 */
export async function getCachedNextQuestion(
  sessionId: string,
  phaseId: string
): Promise<CachedQuestion | null> {
  const key = nextQuestionKey(sessionId, phaseId)
  const cached = await redis.get<CachedQuestion>(key)
  return cached
}

/**
 * Update the correctAnswer for a cached question (Pass 2 completion)
 */
export async function updateCachedNextQuestionAnswer(
  sessionId: string,
  phaseId: string,
  correctAnswer: string[]
): Promise<void> {
  const key = nextQuestionKey(sessionId, phaseId)
  const cached = await redis.get<CachedQuestion>(key)
  if (cached) {
    cached.correctAnswer = correctAnswer
    await redis.set(key, cached, { ex: CACHE_TTL_SECONDS })
    console.log(`[RedisCache] Updated correctAnswer for phase: ${phaseId} - ${correctAnswer.join(', ')}`)
  }
}

/**
 * Clear the cached question for a phase (after using it)
 */
export async function clearCachedNextQuestion(
  sessionId: string,
  phaseId: string
): Promise<void> {
  const key = nextQuestionKey(sessionId, phaseId)
  await redis.del(key)
  console.log(`[RedisCache] Cleared next question for phase: ${phaseId}`)
}

// =============================================================================
// Phase Transition Cache (for next phase's first question)
// =============================================================================

/**
 * Save a pre-generated question for phase transition
 */
export async function cachePhaseTransitionQuestion(
  sessionId: string,
  nextPhaseId: string,
  question: CachedQuestion
): Promise<void> {
  const key = phaseTransitionKey(sessionId, nextPhaseId)
  await redis.set(key, question, { ex: CACHE_TTL_SECONDS })
  console.log(`[RedisCache] Saved phase transition question for: ${nextPhaseId}`)
}

/**
 * Get a cached phase transition question
 */
export async function getCachedPhaseTransitionQuestion(
  sessionId: string,
  nextPhaseId: string
): Promise<CachedQuestion | null> {
  const key = phaseTransitionKey(sessionId, nextPhaseId)
  const cached = await redis.get<CachedQuestion>(key)
  return cached
}

/**
 * Update the correctAnswer for a phase transition question (Pass 2 completion)
 */
export async function updateCachedPhaseTransitionAnswer(
  sessionId: string,
  nextPhaseId: string,
  correctAnswer: string[]
): Promise<void> {
  const key = phaseTransitionKey(sessionId, nextPhaseId)
  const cached = await redis.get<CachedQuestion>(key)
  if (cached) {
    cached.correctAnswer = correctAnswer
    await redis.set(key, cached, { ex: CACHE_TTL_SECONDS })
    console.log(`[RedisCache] Updated phase transition correctAnswer for: ${nextPhaseId} - ${correctAnswer.join(', ')}`)
  }
}

/**
 * Clear the cached phase transition question (after using it)
 */
export async function clearCachedPhaseTransitionQuestion(
  sessionId: string,
  nextPhaseId: string
): Promise<void> {
  const key = phaseTransitionKey(sessionId, nextPhaseId)
  await redis.del(key)
  console.log(`[RedisCache] Cleared phase transition question for: ${nextPhaseId}`)
}
