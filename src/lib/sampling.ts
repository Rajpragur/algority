import { createServerSupabaseClient } from './supabase'

/**
 * Get the production sample rate from environment variable
 * Defaults to 0 (no sampling) if not set
 */
function getSampleRate(): number {
  const rate = parseFloat(process.env.EVAL_SAMPLE_RATE || '0')
  if (isNaN(rate) || rate < 0 || rate > 1) {
    return 0
  }
  return rate
}

/**
 * Determine if a session should be sampled for background evaluation
 * based on EVAL_SAMPLE_RATE environment variable (0.0 to 1.0)
 */
export function shouldSampleSession(): boolean {
  const rate = getSampleRate()
  if (rate <= 0) return false
  if (rate >= 1) return true
  return Math.random() < rate
}

/**
 * Queue a completed session for background evaluation
 * Non-blocking - errors are logged but don't affect the user experience
 */
export async function queueSessionForEvaluation(sessionId: string): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient()

    const { error } = await supabase
      .from('eval_sample_queue')
      .insert({
        session_id: sessionId,
        status: 'pending',
      })

    if (error) {
      // Unique constraint violation means already queued - not an error
      if (error.code !== '23505') {
        console.error('[Sampling] Failed to queue session:', error.message)
      }
    }
  } catch (err) {
    // Non-blocking - don't affect user experience
    console.error('[Sampling] Error queuing session:', err)
  }
}

/**
 * Conditionally queue a session based on sample rate
 * Call this when a coaching session completes
 */
export async function maybeSampleSession(sessionId: string): Promise<void> {
  if (shouldSampleSession()) {
    await queueSessionForEvaluation(sessionId)
  }
}
