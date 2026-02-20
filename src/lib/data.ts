import { cache } from 'react'
import { createServerSupabaseClient } from './supabase'
import { redis } from './redis'
import type {
  Problem,
  Pattern,
  Difficulty,
  CoachingSession,
  Message,
  QuestionMessage,
  FeedbackMessage,
  CoachMessage,
  UserAnswerMessage,
  UserQuestionMessage,
  CoachResponseMessage,
  ProbeQuestionMessage,
  ProbeResponseMessage,
  ProbeEvaluationMessage,
  SessionWithProblem,
  CoachingInsights,
  CachedPhaseSummary,
  CachedQuestion,
  ProblemSet,
  ProblemWithSets,
} from './types'

export async function getProblems(limit = 50): Promise<Problem[]> {
  // Check cache first
  const cacheKey = `problems:all:${limit}`
  if (redis) {
    try {
      const cached = await redis.get<Problem[]>(cacheKey)
      if (cached) return cached
    } catch (e) {
      console.warn('Redis get error', e)
    }
  }

  const supabase = await createServerSupabaseClient()

  // Fetch problems with their patterns
  const { data: problems, error: problemsError } = await supabase
    .from('problems')
    .select('id, task_id, title, difficulty, problem_description')
    .order('id', { ascending: true })
    .limit(limit)

  if (problemsError) {
    console.error('Error fetching problems:', problemsError)
    return []
  }

  // Fetch problem-pattern relationships
  const problemIds = problems.map((p) => p.id)
  const { data: problemPatterns, error: ppError } = await supabase
    .from('problem_patterns')
    .select('problem_id, pattern_id')
    .in('problem_id', problemIds)

  if (ppError) {
    console.error('Error fetching problem patterns:', ppError)
  }

  // Group patterns by problem ID
  const patternsByProblem = new Map<number, string[]>()
  problemPatterns?.forEach((pp) => {
    const existing = patternsByProblem.get(pp.problem_id) || []
    patternsByProblem.set(pp.problem_id, [...existing, pp.pattern_id])
  })

  // Transform to Problem type
  const result = problems.map((p) => ({
    id: p.id,
    task_id: p.task_id,
    title: p.title,
    difficulty: p.difficulty as Difficulty,
    problem_description: p.problem_description,
    patterns: patternsByProblem.get(p.id) || [],
    problemSets: [], // Not populated in this basic fetch
    completionStatus: 'Untouched' as const, // TODO: Fetch from user sessions
  }))

  if (redis) {
    try {
      await redis.set(cacheKey, result, { ex: 3600 }) // Cache for 1 hour
    } catch (e) {
      console.warn('Redis set error', e)
    }
  }

  return result
}

// Wrapped with cache() to deduplicate calls within the same request cycle.
// If getPatterns() is called multiple times during a single page render,
// only one database query executes and the result is reused.
export const getPatterns = cache(async (): Promise<Pattern[]> => {
  const cacheKey = `patterns:all`
  if (redis) {
    try {
      const cached = await redis.get<Pattern[]>(cacheKey)
      if (cached) return cached
    } catch (e) {
      console.warn('Redis get error', e)
    }
  }

  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('patterns')
    .select('id, name, slug')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching patterns:', error)
    return []
  }

  const result = data || []
  if (redis) {
    try {
      await redis.set(cacheKey, result, { ex: 3600 }) // Cache for 1 hour
    } catch (e) {
      console.warn('Redis set error', e)
    }
  }

  return result
})

export async function getProblemById(id: number) {
  const cacheKey = `problem:${id}`
  if (redis) {
    try {
      const cached = await redis.get<any>(cacheKey)
      if (cached) return cached
    } catch (e) {
      console.warn('Redis get error', e)
    }
  }

  const supabase = await createServerSupabaseClient()

  // Explicitly select only the fields needed for coaching and display
  // Excludes test_cases and test_code to avoid passing them to AI (wastes tokens, could leak answers)
  const { data, error } = await supabase
    .from('problems')
    .select('id, task_id, title, difficulty, problem_description, completion, starter_code, prompt, entry_point')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching problem:', error)
    return null
  }

  // Fetch patterns for this problem
  const { data: problemPatterns } = await supabase
    .from('problem_patterns')
    .select('pattern_id')
    .eq('problem_id', id)

  const result = {
    id: data.id,
    task_id: data.task_id,
    title: data.title,
    difficulty: data.difficulty,
    problem_description: data.problem_description,
    patterns: problemPatterns?.map((pp) => pp.pattern_id) || [],
    problemSets: [],
    completionStatus: 'Untouched' as const,
    // Map completion to solution for AI grounding
    solution: data.completion || null,
    // Include starter code for editor initialization
    starter_code: data.starter_code || undefined,
    // Include prompt and entry_point for code execution harness
    prompt: data.prompt || null,
    entry_point: data.entry_point || null,
  }

  if (redis) {
    try {
      await redis.set(cacheKey, result, { ex: 3600 }) // Cache for 1 hour
    } catch (e) {
      console.warn('Redis set error', e)
    }
  }

  return result
}

// Fetch problem with test data - only use for code execution, not for AI
export async function getProblemWithTestData(id: number) {
  const cacheKey = `problem:testdata:${id}`
  if (redis) {
    try {
      const cached = await redis.get<any>(cacheKey)
      if (cached) return cached
    } catch (e) {
      console.warn('Redis get error', e)
    }
  }

  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('problems')
    .select('id, task_id, title, difficulty, problem_description, completion, starter_code, prompt, entry_point, test_cases, test_code')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching problem with test data:', error)
    return null
  }

  // Fetch patterns for this problem
  const { data: problemPatterns } = await supabase
    .from('problem_patterns')
    .select('pattern_id')
    .eq('problem_id', id)

  const result = {
    id: data.id,
    task_id: data.task_id,
    title: data.title,
    difficulty: data.difficulty,
    problem_description: data.problem_description,
    patterns: problemPatterns?.map((pp) => pp.pattern_id) || [],
    completionStatus: 'Untouched' as const,
    problemSets: [],
    solution: data.completion || null,
    starter_code: data.starter_code || undefined,
    prompt: data.prompt || null,
    entry_point: data.entry_point || null,
    test_cases: data.test_cases,
    test_code: data.test_code || null,
  }

  if (redis) {
    try {
      await redis.set(cacheKey, result, { ex: 3600 }) // Cache for 1 hour
    } catch (e) {
      console.warn('Redis set error', e)
    }
  }

  return result
}

// =============================================================================
// Coaching Session Functions
// =============================================================================

export async function createCoachingSession(problemId: number, userId?: string | null): Promise<CoachingSession | null> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('coaching_sessions')
    .insert({
      problem_id: problemId,
      current_phase: 'understanding',
      elapsed_seconds: 0,
      is_initialized: false,
      ...(userId && { user_id: userId }),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating coaching session:', error)
    return null
  }

  return {
    id: data.id,
    problemId: data.problem_id,
    currentPhase: data.current_phase,
    elapsedSeconds: data.elapsed_seconds,
    startedAt: data.started_at,
    completedAt: data.completed_at,
    userId: data.user_id || null,
  }
}

export async function getCoachingSession(sessionId: string): Promise<CoachingSession | null> {
  const supabase = await createServerSupabaseClient()

  // Get current user for ownership verification
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('coaching_sessions')
    .select('*')
    .eq('id', sessionId)

  // If authenticated, filter by user_id (defense in depth)
  if (user) {
    query = query.eq('user_id', user.id)
  }

  const { data, error } = await query.single()

  if (error) {
    // Could be "not found" or "no permission" - both return null
    if (error.code !== 'PGRST116') {
      console.error('Error fetching coaching session:', error)
    }
    return null
  }

  return {
    id: data.id,
    problemId: data.problem_id,
    currentPhase: data.current_phase,
    elapsedSeconds: data.elapsed_seconds,
    startedAt: data.started_at,
    completedAt: data.completed_at,
    userId: data.user_id || null,
    phaseSummaries: data.phase_summaries || {},
  }
}

// Check for incomplete session for a problem - explicit user filter
export async function getIncompleteSessionForProblem(problemId: number): Promise<{ id: string } | null> {
  const supabase = await createServerSupabaseClient()

  // Get current user - return null if not authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return null
  }

  const { data } = await supabase
    .from('coaching_sessions')
    .select('id')
    .eq('problem_id', problemId)
    .eq('user_id', user.id)
    .is('completed_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return data ? { id: data.id } : null
}

export async function getSessionMessages(sessionId: string): Promise<Message[]> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('coaching_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching session messages:', error)
    return []
  }

  return data.map((msg) => mapDatabaseMessageToMessage(msg))
}

// Database row type (simplified for mapping)
interface DBMessage {
  id: string
  type: string
  content: string | null
  phase: string | null
  question_type: string | null
  options: unknown[] | null
  correct_answer: string[] | null
  selected_options: string[] | null
  is_correct: boolean | null
  is_flagged: boolean | null
  probe_type: string | null
  understanding_level: string | null
  completeness_score: number | null
  covered_areas: string[] | null
  missing_areas: string[] | null
}

function mapDatabaseMessageToMessage(msg: DBMessage): Message {
  const baseContent = msg.content || ''
  const isFlagged = msg.is_flagged || false

  switch (msg.type) {
    case 'question':
      return {
        id: msg.id,
        type: 'question',
        phase: msg.phase || '',
        questionType: (msg.question_type as 'single-select' | 'multi-select') || 'single-select',
        content: baseContent,
        options: (msg.options || []) as QuestionMessage['options'],
        correctAnswer: msg.correct_answer || [],
      }

    case 'user-answer':
      return {
        id: msg.id,
        type: 'user-answer',
        selectedOptions: msg.selected_options || [],
      }

    case 'feedback':
      return {
        id: msg.id,
        type: 'feedback',
        phase: msg.phase || 'understanding',
        isCorrect: msg.is_correct || false,
        content: baseContent,
        isFlagged,
      }

    case 'user-question':
      return {
        id: msg.id,
        type: 'user-question',
        content: baseContent,
      }

    case 'coach-response':
      return {
        id: msg.id,
        type: 'coach-response',
        content: baseContent,
        isFlagged,
      }

    case 'probe-question':
      return {
        id: msg.id,
        type: 'probe-question',
        content: baseContent,
        probeType: (msg.probe_type as 'short-answer' | 'explain-reasoning' | 'predict-behavior') || 'short-answer',
      }

    case 'probe-response':
      return {
        id: msg.id,
        type: 'probe-response',
        content: baseContent,
      }

    case 'probe-evaluation':
      return {
        id: msg.id,
        type: 'probe-evaluation',
        content: baseContent,
        understandingLevel: (msg.understanding_level as 'strong' | 'partial' | 'unclear' | 'incorrect') || 'partial',
        isFlagged,
      }

    case 'coach':
    default:
      return {
        id: msg.id,
        type: 'coach',
        phase: msg.phase || 'understanding',
        content: baseContent,
        isFlagged,
      }
  }
}

export async function saveCoachMessage(
  sessionId: string,
  phase: string,
  content: string
): Promise<string | null> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('coaching_messages')
    .insert({
      session_id: sessionId,
      type: 'coach',
      phase,
      content,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error saving coach message:', error)
    return null
  }

  return data.id
}

export async function saveQuestionMessage(
  sessionId: string,
  phase: string,
  question: Omit<QuestionMessage, 'id' | 'type'>
): Promise<string | null> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('coaching_messages')
    .insert({
      session_id: sessionId,
      type: 'question',
      phase,
      content: question.content,
      question_type: question.questionType,
      options: question.options,
      correct_answer: question.correctAnswer,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error saving question message:', error)
    return null
  }

  return data.id
}

export async function saveUserAnswerMessage(
  sessionId: string,
  phase: string,
  selectedOptions: string[]
): Promise<string | null> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('coaching_messages')
    .insert({
      session_id: sessionId,
      type: 'user-answer',
      phase,
      selected_options: selectedOptions,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error saving user answer:', error)
    return null
  }

  return data.id
}

export async function saveFeedbackMessage(
  sessionId: string,
  phase: string,
  feedback: Omit<FeedbackMessage, 'id' | 'type'>
): Promise<string | null> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('coaching_messages')
    .insert({
      session_id: sessionId,
      type: 'feedback',
      phase,
      content: feedback.content,
      is_correct: feedback.isCorrect,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error saving feedback:', error)
    return null
  }

  return data.id
}

export async function saveUserQuestionMessage(
  sessionId: string,
  phase: string,
  content: string
): Promise<string | null> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('coaching_messages')
    .insert({
      session_id: sessionId,
      type: 'user-question',
      phase,
      content,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error saving user question:', error)
    return null
  }

  return data.id
}

export async function saveCoachResponseMessage(
  sessionId: string,
  phase: string,
  content: string
): Promise<string | null> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('coaching_messages')
    .insert({
      session_id: sessionId,
      type: 'coach-response',
      phase,
      content,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error saving coach response:', error)
    return null
  }

  return data.id
}

export async function saveProbeQuestionMessage(
  sessionId: string,
  phase: string,
  content: string,
  probeType: 'short-answer' | 'explain-reasoning' | 'predict-behavior'
): Promise<string | null> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('coaching_messages')
    .insert({
      session_id: sessionId,
      type: 'probe-question',
      phase,
      content,
      probe_type: probeType,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error saving probe question:', error)
    return null
  }

  return data.id
}

export async function saveProbeResponseMessage(
  sessionId: string,
  phase: string,
  content: string
): Promise<string | null> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('coaching_messages')
    .insert({
      session_id: sessionId,
      type: 'probe-response',
      phase,
      content,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error saving probe response:', error)
    return null
  }

  return data.id
}

export async function saveProbeEvaluationMessage(
  sessionId: string,
  phase: string,
  content: string,
  understandingLevel: 'strong' | 'partial' | 'unclear' | 'incorrect'
): Promise<string | null> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('coaching_messages')
    .insert({
      session_id: sessionId,
      type: 'probe-evaluation',
      phase,
      content,
      understanding_level: understandingLevel,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error saving probe evaluation:', error)
    return null
  }

  return data.id
}

export async function updateSessionPhase(
  sessionId: string,
  phase: string
): Promise<boolean> {
  const supabase = await createServerSupabaseClient()

  // When changing phase, also clear the cached question (it's for the old phase)
  const { error } = await supabase
    .from('coaching_sessions')
    .update({
      current_phase: phase,
      cached_next_question: null,
      cached_question_phase: null,
    })
    .eq('id', sessionId)

  if (error) {
    console.error('Error updating session phase:', error)
    return false
  }

  return true
}


export async function savePhaseSummary(
  sessionId: string,
  phaseId: string,
  summary: { conceptsCovered: string[]; summary: string }
): Promise<boolean> {
  const supabase = await createServerSupabaseClient()

  // Fetch current summaries
  const { data: session } = await supabase
    .from('coaching_sessions')
    .select('phase_summaries')
    .eq('id', sessionId)
    .single()

  const currentSummaries = (session?.phase_summaries || {}) as Record<string, unknown>
  const updatedSummaries = {
    ...currentSummaries,
    [phaseId]: {
      phaseId,
      conceptsCovered: summary.conceptsCovered,
      summary: summary.summary,
    },
  }

  const { error } = await supabase
    .from('coaching_sessions')
    .update({ phase_summaries: updatedSummaries })
    .eq('id', sessionId)

  if (error) {
    console.error('Error saving phase summary:', error)
    return false
  }

  return true
}

export async function updateSessionTime(
  sessionId: string,
  elapsedSeconds: number
): Promise<boolean> {
  const supabase = await createServerSupabaseClient()

  // Get current user for ownership verification
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return false
  }

  // Update only if user owns the session (defense in depth)
  const { error } = await supabase
    .from('coaching_sessions')
    .update({ elapsed_seconds: elapsedSeconds })
    .eq('id', sessionId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating session time:', error)
    return false
  }

  return true
}

export async function completeSession(sessionId: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient()

  // Get current user for ownership verification
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return false
  }

  // Complete only if user owns the session (defense in depth)
  const { error } = await supabase
    .from('coaching_sessions')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error completing session:', error)
    return false
  }

  return true
}

// Get or create a session for a problem - explicit user filtering
export async function getOrCreateSession(problemId: number, userId?: string | null): Promise<CoachingSession | null> {
  const supabase = await createServerSupabaseClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  const effectiveUserId = userId || user?.id

  if (!effectiveUserId) {
    return null
  }

  // First, try to find an existing incomplete session for this problem (user's own)
  const { data: existingSession } = await supabase
    .from('coaching_sessions')
    .select('*')
    .eq('problem_id', problemId)
    .eq('user_id', effectiveUserId)
    .is('completed_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (existingSession) {
    return {
      id: existingSession.id,
      problemId: existingSession.problem_id,
      currentPhase: existingSession.current_phase,
      elapsedSeconds: existingSession.elapsed_seconds,
      startedAt: existingSession.started_at,
      completedAt: existingSession.completed_at,
      userId: existingSession.user_id || null,
      phaseSummaries: existingSession.phase_summaries || {},
    }
  }

  // Create a new session
  return createCoachingSession(problemId, userId)
}

// Fetch sessions for the current user only
// Defense in depth: explicit user_id filter + RLS policy
export async function getUserSessions(): Promise<SessionWithProblem[]> {
  const supabase = await createServerSupabaseClient()

  // Get current user - return empty if not authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return []
  }

  // Fetch sessions with explicit user_id filter (defense in depth alongside RLS)
  const { data: sessions, error } = await supabase
    .from('coaching_sessions')
    .select(`
      id,
      problem_id,
      current_phase,
      elapsed_seconds,
      started_at,
      completed_at,
      updated_at,
      user_id,
      is_golden_candidate,
      submitted_as_golden_at,
      problems!inner (
        id,
        title,
        difficulty
      )
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching sessions:', error)
    return []
  }

  if (!sessions || sessions.length === 0) {
    return []
  }

  // Get problem IDs to fetch patterns
  const problemIds = sessions.map((s) => s.problem_id)
  const { data: problemPatterns } = await supabase
    .from('problem_patterns')
    .select('problem_id, pattern_id')
    .in('problem_id', problemIds)

  // Group patterns by problem ID
  const patternsByProblem = new Map<number, string[]>()
  problemPatterns?.forEach((pp) => {
    const existing = patternsByProblem.get(pp.problem_id) || []
    patternsByProblem.set(pp.problem_id, [...existing, pp.pattern_id])
  })

  // Calculate phases completed based on current_phase
  // Note: Old sessions may have 'approach' or 'implementation' - map to 'solution-building'
  const phaseOrder = ['understanding', 'solution-building', 'algorithm-steps']
  const getPhasesCompleted = (currentPhase: string, completedAt: string | null): number => {
    if (completedAt) return phaseOrder.length
    // Handle legacy phase IDs from old sessions
    const normalizedPhase = (currentPhase === 'approach' || currentPhase === 'implementation')
      ? 'solution-building'
      : currentPhase
    const index = phaseOrder.indexOf(normalizedPhase)
    return index >= 0 ? index : 0
  }

  // Transform to SessionWithProblem
  return sessions.map((s) => {
    // Supabase returns the joined table as an object (not array) with !inner
    const problem = s.problems as unknown as { id: number; title: string; difficulty: string }
    return {
      id: s.id,
      problemId: s.problem_id,
      currentPhase: s.current_phase,
      elapsedSeconds: s.elapsed_seconds,
      startedAt: s.started_at,
      completedAt: s.completed_at,
      userId: s.user_id || null,
      updatedAt: s.updated_at,
      problem: {
        id: problem.id,
        title: problem.title,
        difficulty: problem.difficulty as 'Easy' | 'Medium' | 'Hard',
        patterns: patternsByProblem.get(s.problem_id) || [],
      },
      phasesCompleted: getPhasesCompleted(s.current_phase, s.completed_at),
      isGoldenCandidate: s.is_golden_candidate || false,
      submittedAsGoldenAt: s.submitted_as_golden_at || null,
    }
  })
}

export async function deleteSession(sessionId: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient()

  // Get current user for ownership verification
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return false
  }

  // Delete only if user owns the session (defense in depth)
  const { error } = await supabase
    .from('coaching_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting session:', error)
    return false
  }

  return true
}

// =============================================================================
// Code Editor Coaching Insights Functions
// =============================================================================

export async function getCoachingInsightsForProblem(
  problemId: number
): Promise<CoachingInsights | null> {
  const supabase = await createServerSupabaseClient()

  // Get current user - return null if not authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return null
  }

  const cacheKey = `insights:${user.id}:${problemId}`
  if (redis) {
    try {
      const cached = await redis.get<CoachingInsights>(cacheKey)
      if (cached) return cached
    } catch (e) {
      console.warn('Redis insights get error:', e)
    }
  }

  // Find the most recent completed coaching session for this problem (user's own)
  const { data: session, error: sessionError } = await supabase
    .from('coaching_sessions')
    .select('id, completed_at, phase_summaries')
    .eq('problem_id', problemId)
    .eq('user_id', user.id)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(1)
    .single()

  if (sessionError) {
    // PGRST116 = "no rows returned" - expected for new problems
    if (sessionError.code !== 'PGRST116') {
      console.error('Error fetching coaching session:', sessionError)
    }
    return null
  }

  if (!session) {
    return null
  }

  const result = {
    hasSession: true,
    sessionId: session.id,
    phaseSummaries: (session.phase_summaries || {}) as Record<string, CachedPhaseSummary>,
    completedAt: session.completed_at,
  }

  if (redis) {
    try {
      await redis.set(cacheKey, result, { ex: 60 })
    } catch (e) {
      console.warn('Redis insights set error:', e)
    }
  }

  return result
}

// =============================================================================
// Problem Sets Functions (Blind 75, Grind 75, NeetCode 150)
// =============================================================================

export async function getProblemSets(): Promise<ProblemSet[]> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('problem_sets')
    .select('id, name, description, source_url, problem_count')
    .order('problem_count', { ascending: true })

  if (error) {
    console.error('Error fetching problem sets:', error)
    return []
  }

  return (data || []).map((set) => ({
    id: set.id,
    name: set.name,
    description: set.description,
    sourceUrl: set.source_url,
    problemCount: set.problem_count,
  }))
}

export async function getProblemSet(setId: string): Promise<ProblemSet | null> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('problem_sets')
    .select('id, name, description, source_url, problem_count')
    .eq('id', setId)
    .single()

  if (error) {
    console.error('Error fetching problem set:', error)
    return null
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    sourceUrl: data.source_url,
    problemCount: data.problem_count,
  }
}

export async function getProblemsBySet(
  setId: string,
  limit = 200
): Promise<ProblemWithSets[]> {
  const supabase = await createServerSupabaseClient()

  // Fetch problems in this set with their position and category
  const { data: setProblems, error: setError } = await supabase
    .from('problem_set_problems')
    .select(`
      problem_id,
      position,
      category,
      problems!inner (
        id,
        task_id,
        title,
        difficulty,
        problem_description
      )
    `)
    .eq('problem_set_id', setId)
    .order('position', { ascending: true })
    .limit(limit)

  if (setError) {
    console.error('Error fetching problems by set:', setError)
    return []
  }

  if (!setProblems || setProblems.length === 0) {
    return []
  }

  // Get problem IDs to fetch patterns
  const problemIds = setProblems.map((sp) => sp.problem_id)
  const { data: problemPatterns } = await supabase
    .from('problem_patterns')
    .select('problem_id, pattern_id')
    .in('problem_id', problemIds)

  // Group patterns by problem ID
  const patternsByProblem = new Map<number, string[]>()
  problemPatterns?.forEach((pp) => {
    const existing = patternsByProblem.get(pp.problem_id) || []
    patternsByProblem.set(pp.problem_id, [...existing, pp.pattern_id])
  })

  // Get the problem set name
  const { data: setData } = await supabase
    .from('problem_sets')
    .select('name')
    .eq('id', setId)
    .single()

  const setName = setData?.name || setId

  // Transform to ProblemWithSets
  return setProblems.map((sp) => {
    const problem = sp.problems as unknown as {
      id: number
      task_id: string
      title: string
      difficulty: string
      problem_description: string
    }

    return {
      id: problem.id,
      task_id: problem.task_id,
      title: problem.title,
      difficulty: problem.difficulty as Difficulty,
      problem_description: problem.problem_description,
      patterns: patternsByProblem.get(problem.id) || [],
      completionStatus: 'Untouched' as const,
      problemSets: [
        {
          id: setId,
          name: setName,
          position: sp.position,
          category: sp.category,
        },
      ],
    }
  })
}

export async function getProblemsWithSets(limit = 50): Promise<ProblemWithSets[]> {
  const supabase = await createServerSupabaseClient()

  // Fetch problems with their patterns
  const { data: problems, error: problemsError } = await supabase
    .from('problems')
    .select('id, task_id, title, difficulty, problem_description')
    .order('id', { ascending: true })
    .limit(limit)

  if (problemsError) {
    console.error('Error fetching problems:', problemsError)
    return []
  }

  const problemIds = problems.map((p) => p.id)

  // Fetch problem-pattern relationships
  const { data: problemPatterns } = await supabase
    .from('problem_patterns')
    .select('problem_id, pattern_id')
    .in('problem_id', problemIds)

  // Fetch problem-set relationships
  const { data: problemSetProblems } = await supabase
    .from('problem_set_problems')
    .select(`
      problem_id,
      position,
      category,
      problem_sets!inner (
        id,
        name
      )
    `)
    .in('problem_id', problemIds)

  // Group patterns by problem ID
  const patternsByProblem = new Map<number, string[]>()
  problemPatterns?.forEach((pp) => {
    const existing = patternsByProblem.get(pp.problem_id) || []
    patternsByProblem.set(pp.problem_id, [...existing, pp.pattern_id])
  })

  // Group problem sets by problem ID
  const setsByProblem = new Map<
    number,
    Array<{ id: string; name: string; position: number; category: string | null }>
  >()
  problemSetProblems?.forEach((psp) => {
    const set = psp.problem_sets as unknown as { id: string; name: string }
    const existing = setsByProblem.get(psp.problem_id) || []
    setsByProblem.set(psp.problem_id, [
      ...existing,
      {
        id: set.id,
        name: set.name,
        position: psp.position,
        category: psp.category,
      },
    ])
  })

  // Transform to ProblemWithSets
  return problems.map((p) => ({
    id: p.id,
    task_id: p.task_id,
    title: p.title,
    difficulty: p.difficulty as Difficulty,
    problem_description: p.problem_description,
    patterns: patternsByProblem.get(p.id) || [],
    completionStatus: 'Untouched' as const,
    problemSets: setsByProblem.get(p.id) || [],
  }))
}
