import { supabase } from './supabase'
import { getProductionConfig } from './config'

/**
 * Determine if a session should be sampled for background evaluation
 * based on the configured sample_rate (0.0 to 1.0)
 */
export function shouldSampleSession(sampleRate?: number): boolean {
  const rate = sampleRate ?? getProductionConfig().sample_rate
  if (rate <= 0) return false
  if (rate >= 1) return true
  return Math.random() < rate
}

/**
 * Add a session to the evaluation sample queue
 * Returns true if queued successfully, false if already queued or error
 */
export async function queueSessionForEvaluation(sessionId: string): Promise<boolean> {
  const { error } = await supabase
    .from('eval_sample_queue')
    .insert({
      session_id: sessionId,
      status: 'pending',
    })

  if (error) {
    // Unique constraint violation means already queued
    if (error.code === '23505') {
      return false
    }
    console.error('Failed to queue session for evaluation:', error.message)
    return false
  }

  return true
}

/**
 * Get pending sessions from the sample queue
 * Returns oldest first for fair processing
 */
export async function getPendingSessions(limit = 10): Promise<string[]> {
  const { data, error } = await supabase
    .from('eval_sample_queue')
    .select('session_id')
    .eq('status', 'pending')
    .order('queued_at', { ascending: true })
    .limit(limit)

  if (error || !data) {
    console.error('Failed to fetch pending sessions:', error?.message)
    return []
  }

  return data.map(row => row.session_id)
}

/**
 * Mark a queued session as processed
 */
export async function markSessionProcessed(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('eval_sample_queue')
    .update({
      status: 'processed',
      processed_at: new Date().toISOString(),
    })
    .eq('session_id', sessionId)

  if (error) {
    console.error('Failed to mark session as processed:', error.message)
  }
}

/**
 * Mark a queued session as failed with error message
 */
export async function markSessionFailed(sessionId: string, errorMessage: string): Promise<void> {
  const { error } = await supabase
    .from('eval_sample_queue')
    .update({
      status: 'failed',
      processed_at: new Date().toISOString(),
      error_message: errorMessage,
    })
    .eq('session_id', sessionId)

  if (error) {
    console.error('Failed to mark session as failed:', error.message)
  }
}

/**
 * Get sample queue statistics
 */
export async function getSampleQueueStats(): Promise<{
  pending: number
  processed: number
  failed: number
}> {
  const { data, error } = await supabase
    .from('eval_sample_queue')
    .select('status')

  if (error || !data) {
    return { pending: 0, processed: 0, failed: 0 }
  }

  return data.reduce(
    (acc, row) => {
      if (row.status === 'pending') acc.pending++
      else if (row.status === 'processed') acc.processed++
      else if (row.status === 'failed') acc.failed++
      return acc
    },
    { pending: 0, processed: 0, failed: 0 }
  )
}
