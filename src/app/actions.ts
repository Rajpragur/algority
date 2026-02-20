'use server'

import { createServerSupabaseClient, getUser } from '@/lib/supabase'
import type { Problem, Difficulty, Phase, Message, QuestionMessage } from '@/lib/types'
import {
  getOrCreateSession,
  getSessionMessages,
  getProblemById,
  saveCoachMessage,
  saveQuestionMessage,
  saveUserAnswerMessage,
  saveFeedbackMessage,
  saveUserQuestionMessage,
  saveCoachResponseMessage,
  saveProbeQuestionMessage,
  saveProbeResponseMessage,
  saveProbeEvaluationMessage,
  updateSessionPhase,
  updateSessionTime,
  deleteSession,
  createCoachingSession,
  getIncompleteSessionForProblem,
  getCoachingSession,
  savePhaseSummary,
} from '@/lib/data'
import {
  cacheNextQuestion,
  getCachedNextQuestion,
  clearCachedNextQuestion,
  cachePhaseTransitionQuestion,
  getCachedPhaseTransitionQuestion,
  clearCachedPhaseTransitionQuestion,
} from '@/lib/question-cache'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { generateCoachingQuestion, generateQuestionPass1, evaluateAnswer, generatePhaseIntroWithQuestion, generateFirstQuestion, respondToUserQuestion, evaluateProbeResponse, generatePhaseSummary, toLLMProblem, toClientProblem, type PhaseSummaryResult } from '@/lib/openai'
import { maybeSampleSession } from '@/lib/sampling'
import { getCoachingConfig } from '@/lib/coaching-config'

interface SearchParams {
  query?: string
  patternIds?: string[]
  problemSetId?: string | null
  page?: number
  limit?: number
}

interface SearchResult {
  problems: Problem[]
  total: number
  page: number
  totalPages: number
}

import { unstable_cache } from 'next/cache'
import Fuse from 'fuse.js'
import { createClient } from '@supabase/supabase-js'

// Cache ALL problem metadata for fast in-memory search
// Revalidate every hour or on-demand
const getSearchIndex = unstable_cache(
  async () => {
    // Use a direct client that DOES NOT rely on request cookies
    // This is required because unstable_cache is static and cannot access dynamic headers/cookies
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Fetch all problems with essential fields only
    // Include problem_description for card previews (truncated in UI)
    const { data: problems } = await supabase
      .from('problems')
      .select('id, task_id, title, difficulty, problem_description')
      .order('id')

    if (!problems) return []

    // Fetch all patterns
    const { data: patterns } = await supabase
      .from('problem_patterns')
      .select('problem_id, pattern_id')

    // Fetch all problem sets
    const { data: setProblems } = await supabase
      .from('problem_set_problems')
      .select('problem_id, problem_set_id')

    // Construct the optimized search index
    const patternsMap = new Map<number, string[]>()
    patterns?.forEach(p => {
      const existing = patternsMap.get(p.problem_id) || []
      patternsMap.set(p.problem_id, [...existing, p.pattern_id])
    })

    const setsMap = new Map<number, Set<string>>()
    setProblems?.forEach(p => {
      const existing = setsMap.get(p.problem_id) || new Set()
      existing.add(p.problem_set_id)
      setsMap.set(p.problem_id, existing)
    })

    return problems.map(p => ({
      ...p,
      patterns: patternsMap.get(p.id) || [],
      problemSets: Array.from(setsMap.get(p.id) || []),
      completionStatus: 'Untouched' as const,
      // problem_description is now included from the DB fetch
    })) as Problem[]
  },
  ['problems-search-index'],
  { revalidate: 3600, tags: ['problems'] }
)

export async function searchProblems({
  query = '',
  patternIds = [],
  problemSetId = null,
  page = 1,
  limit = 24,
}: SearchParams): Promise<SearchResult> {
  // 1. Get cached index (instant after first hit)
  const allProblems = await getSearchIndex()

  // 2. Filter by Problem Set (O(1) lookup per item)
  let filtered = problemSetId
    ? allProblems.filter(p => (p.problemSets as unknown as string[]).includes(problemSetId))
    : allProblems

  // 3. Filter by Patterns
  if (patternIds.length > 0) {
    filtered = filtered.filter(p =>
      patternIds.some(pid => p.patterns.includes(pid))
    )
  }

  // 4. Fuzzy Search with Fuse.js (if query exists)
  if (query.trim()) {
    const fuse = new Fuse(filtered, {
      keys: ['title'],
      threshold: 0.3, // Fuzzy match tolerance
      distance: 100,
      minMatchCharLength: 2,
    })

    filtered = fuse.search(query.trim()).map(result => result.item)
  }

  // 5. User-specific: Merge completion status (Attempted/Solved)
  // We do this AFTER getting the cached index because cache is global/shared
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Fetch user's sessions to determine status
      const { data: sessions } = await supabase
        .from('coaching_sessions')
        .select('problem_id, completed_at')
        .eq('user_id', user.id)

      if (sessions && sessions.length > 0) {
        const sessionMap = new Map<number, 'Solved' | 'Attempted'>()
        sessions.forEach(s => {
          // If already marked solved, keep it. If new one is solved, mark solved.
          const existing = sessionMap.get(s.problem_id)
          const status = s.completed_at ? 'Solved' : 'Attempted'

          if (existing === 'Solved') return // Already solved takes precedence
          sessionMap.set(s.problem_id, status)
        })

        // Apply to filtered results
        filtered = filtered.map(p => ({
          ...p,
          completionStatus: sessionMap.get(p.id) || 'Untouched'
        }))
      }
    }
  } catch (error) {
    console.error("Error fetching user session status:", error)
    // Fallback to 'Untouched' is automatic since that's the default in getSearchIndex
  }

  // 6. Pagination
  const total = filtered.length
  const totalPages = Math.ceil(total / limit)
  const offset = (page - 1) * limit
  const paginated = filtered.slice(offset, offset + limit)

  return {
    problems: paginated as unknown as Problem[], // Cast to satisfy type (problem_description is missing but safe for list view)
    total,
    page,
    totalPages
  }
}

// =============================================================================
// Coaching Actions
// =============================================================================

const PHASES_CONFIG: Phase[] = [
  { id: 'understanding', title: 'Problem Understanding', description: 'Verify comprehension of the problem', status: 'active', confidenceProgress: 0 },
  { id: 'solution-building', title: 'Solution Building', description: 'Construct the algorithm step-by-step', status: 'locked', confidenceProgress: 0 },
  { id: 'algorithm-steps', title: 'Algorithm Steps', description: 'Verify pseudocode understanding', status: 'locked', confidenceProgress: 0 },
]

// Template intros for phase transitions (saves ~2-3s per transition vs generating)
const PHASE_INTRO_TEMPLATES: Record<string, string> = {
  'solution-building': "Great work understanding the problem! Now let's build the solution step by step. I'll guide you through the key algorithmic decisions.",
  'algorithm-steps': "Excellent progress! Now let's verify you can translate your understanding into code. I'll show you some pseudocode and test your ability to read, complete, and debug it.",
}

// Count questions asked in session for trace metadata
function getQuestionIndex(messages: Message[]): number {
  return messages.filter(m => m.type === 'question').length
}

// Check if there's an unanswered quiz question (prevents generating new questions prematurely)
function hasUnansweredQuestion(messages: Message[]): boolean {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (msg.type === 'question') {
      // Check if there's a user-answer or feedback after this question
      const hasAnswer = messages.slice(i + 1).some(m => m.type === 'user-answer' || m.type === 'feedback')
      return !hasAnswer
    }
  }
  return false
}

// =============================================================================
// Security & Safety Helpers
// =============================================================================

/**
 * Strips sensitive data (like correct answers for unanswered questions) 
 * from messages before sending to the client.
 */
function toSafeMessages(messages: Message[]): Message[] {
  return messages.map((m, i) => {
    if (m.type === 'question') {
      const q = m as QuestionMessage
      // Check if this question has been answered (followed by user-answer or feedback)
      const isAnswered = messages.slice(i + 1).some(next =>
        next.type === 'user-answer' || next.type === 'feedback'
      )
      if (!isAnswered) {
        // Return a copy without the correct answer
        return {
          ...q,
          correctAnswer: []
        }
      }
    }
    return m
  })
}

/**
 * Server action to fetch a problem's solution on-demand.
 * This ensures the solution isn't leaked in the initial page props.
 */
export async function getProblemSolution(sessionId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: session } = await supabase
    .from('coaching_sessions')
    .select('problem_id, user_id')
    .eq('id', sessionId)
    .single()

  if (!session || (session.user_id && session.user_id !== user.id)) {
    throw new Error('Unauthorized or session not found')
  }

  const problem = await getProblemById(session.problem_id)
  return problem?.solution || null
}

// =============================================================================
// Background Pre-generation for Latency Optimization
// =============================================================================
// Pre-generate the next question in the background while the user is answering the current one.
// Single-pass generation produces question content, options, and correct answer in one LLM call.

async function doPreGenerateNextQuestion(
  sessionId: string,
  problemId: number,
  phaseId: string,
  currentMessages: Message[]
): Promise<boolean> {
  try {
    // Skip pre-generation for "you-explain-it" phase (no quiz questions)
    if (phaseId === 'you-explain-it') return false

    const problem = await getProblemById(problemId)
    if (!problem) return false

    const phase = PHASES_CONFIG.find(p => p.id === phaseId)
    if (!phase) return false

    const questionIndex = getQuestionIndex(currentMessages) + 1
    console.log(`[PreGen] Starting for session ${sessionId}, phase ${phaseId}, question #${questionIndex}`)

    const startTime = Date.now()
    const llmProblem = toLLMProblem({ ...problem, problemSets: [] })

    // Single-pass generation: question content, options, and correct answer
    const result = await generateQuestionPass1({
      problem: llmProblem,
      phase,
      previousMessages: currentMessages,
      sessionId,
      questionIndex,
    })

    console.log(`[PreGen] Completed in ${Date.now() - startTime}ms - correct: ${result.correctAnswer.join(', ')}`)

    // Save to KV cache with complete question data
    await cacheNextQuestion(sessionId, phaseId, {
      phase: result.phase,
      questionType: result.questionType,
      content: result.content,
      options: result.options,
      correctAnswer: result.correctAnswer,
    })

    return true
  } catch (error) {
    console.error('[PreGen] Generation failed:', error)
    return false
  }
}

// Pre-generate the first question for the NEXT phase (for phase transitions)
async function doPreGeneratePhaseTransition(
  sessionId: string,
  problemId: number,
  nextPhaseId: string,
  currentMessages: Message[]
): Promise<boolean> {
  try {
    // Skip for you-explain-it (uses explanation prompt, not quiz)
    if (nextPhaseId === 'you-explain-it') return false

    const problem = await getProblemById(problemId)
    if (!problem) return false

    const nextPhase = PHASES_CONFIG.find(p => p.id === nextPhaseId)
    if (!nextPhase) return false

    const questionIndex = getQuestionIndex(currentMessages) + 1
    console.log(`[PhaseTransitionPreGen] Starting for session ${sessionId}, next phase: ${nextPhaseId}`)

    const startTime = Date.now()
    const llmProblem = toLLMProblem({ ...problem, problemSets: [] })

    // Single-pass generation: question content, options, and correct answer
    const result = await generateQuestionPass1({
      problem: llmProblem,
      phase: nextPhase,
      previousMessages: currentMessages,
      sessionId,
      questionIndex,
    })

    console.log(`[PhaseTransitionPreGen] Completed in ${Date.now() - startTime}ms - correct: ${result.correctAnswer.join(', ')}`)

    // Save to KV cache with complete question data
    await cachePhaseTransitionQuestion(sessionId, nextPhaseId, {
      phase: result.phase,
      questionType: result.questionType,
      content: result.content,
      options: result.options,
      correctAnswer: result.correctAnswer,
    })

    return true
  } catch (error) {
    console.error('[PhaseTransitionPreGen] Generation failed:', error)
    return false
  }
}

// Get the next phase ID given current phase
function getNextPhaseId(currentPhaseId: string): string | null {
  const phaseOrder = ['understanding', 'solution-building', 'algorithm-steps']
  const currentIndex = phaseOrder.indexOf(currentPhaseId)
  if (currentIndex === -1 || currentIndex >= phaseOrder.length - 1) return null
  return phaseOrder[currentIndex + 1]
}

// Public action for client to trigger pre-generation
// Call this from the client AFTER rendering a question to pre-generate the next one
export async function triggerPreGeneration(sessionId: string): Promise<{ success: boolean }> {
  console.log(`[PreGen] Client triggered pre-generation for session ${sessionId}`)

  const supabase = await createServerSupabaseClient()
  const [messages, { data: sessionData }] = await Promise.all([
    getSessionMessages(sessionId),
    supabase
      .from('coaching_sessions')
      .select('problem_id, current_phase')
      .eq('id', sessionId)
      .single()
  ])

  if (!sessionData) {
    return { success: false }
  }

  const currentPhaseId = sessionData.current_phase

  // Check if we're close to transitioning phases
  const currentPhaseMessages = getCurrentPhaseMessages(messages, currentPhaseId)
  const PHASE_MINIMUMS: Record<string, number> = {
    'understanding': 2,
    'solution-building': 2,
    'algorithm-steps': 3,
  }
  const minForPhase = PHASE_MINIMUMS[currentPhaseId] || 2
  const correctInPhase = currentPhaseMessages.filter(m => m.type === 'feedback' && m.isCorrect).length
  const closeToTransition = correctInPhase >= minForPhase - 1

  // If close to transitioning and not in the last phase, pre-generate for next phase
  if (closeToTransition && currentPhaseId !== 'algorithm-steps') {
    const nextPhaseId = getNextPhaseId(currentPhaseId)
    if (nextPhaseId) {
      const existingTransitionCache = await getCachedPhaseTransitionQuestion(sessionId, nextPhaseId)

      if (!existingTransitionCache) {
        console.log(`[PreGen] Close to transition (${correctInPhase}/${minForPhase} correct) - pre-generating for ${nextPhaseId}`)
        // Fire off phase transition pre-gen (don't await - run in parallel)
        doPreGeneratePhaseTransition(sessionId, sessionData.problem_id, nextPhaseId, messages)
          .catch(err => console.error('[PreGen] Phase transition pre-gen failed:', err))
      } else {
        console.log(`[PreGen] Phase transition cache already exists for ${nextPhaseId}`)
      }
    }
  }

  // Also pre-generate for current phase (in case user gets it wrong)
  const existingCache = await getCachedNextQuestion(sessionId, currentPhaseId)
  if (existingCache) {
    console.log(`[PreGen] Cache already exists for phase ${currentPhaseId}, skipping`)
    return { success: true }
  }

  const success = await doPreGenerateNextQuestion(
    sessionId,
    sessionData.problem_id,
    currentPhaseId,
    messages
  )

  return { success }
}

// Count questions in the current phase only (using the phase field on QuestionMessage)
function countQuestionsInPhase(messages: Message[], currentPhaseId: string): number {
  return messages.filter(m =>
    m.type === 'question' &&
    (m as QuestionMessage).phase === currentPhaseId
  ).length
}

// Get messages for the current phase only
function getCurrentPhaseMessages(messages: Message[], currentPhaseId: string): Message[] {
  // Filter to messages that belong to the current phase
  // For questions, we can check the phase field
  // For other messages, we need to infer from position relative to phase transitions
  const phaseOrder = ['understanding', 'solution-building', 'algorithm-steps']
  const currentPhaseIndex = phaseOrder.indexOf(currentPhaseId)

  // Find the index where current phase started
  let phaseStartIndex = 0
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    // Coach messages introducing a new phase mark phase transitions
    if (msg.type === 'coach') {
      // Check if next message is a question for the current phase
      const nextMsg = messages[i + 1]
      if (nextMsg?.type === 'question' && (nextMsg as QuestionMessage).phase === currentPhaseId) {
        phaseStartIndex = i
        break
      }
    }
  }

  // If we're in understanding (first phase), start from beginning
  if (currentPhaseId === 'understanding') {
    phaseStartIndex = 0
  }

  return messages.slice(phaseStartIndex)
}

// Get messages for a specific previous phase
function getPhaseMessages(messages: Message[], phaseId: string): Message[] {
  const result: Message[] = []
  let inPhase = false

  for (const msg of messages) {
    if (msg.type === 'question' && (msg as QuestionMessage).phase === phaseId) {
      inPhase = true
    }
    if (msg.type === 'question' && (msg as QuestionMessage).phase !== phaseId && inPhase) {
      break // Exited the phase
    }
    if (inPhase) {
      result.push(msg)
    }
  }

  return result
}

// Deterministic minimum questions per phase for progress calculation
const PHASE_MIN_QUESTIONS_FOR_PROGRESS: Record<string, number> = {
  'understanding': 2,
  'solution-building': 2,
  'algorithm-steps': 3,
}

function computePhases(
  messages: Message[],
  currentPhase: string,
  isCompleted = false
): Phase[] {
  // Count correct answers per phase
  const correctByPhase: Record<string, number> = {}
  const phaseOrder = ['understanding', 'solution-building', 'algorithm-steps']

  // Track which phase each feedback belongs to based on the feedback's phase field
  messages.forEach((msg) => {
    if (msg.type === 'feedback' && msg.isCorrect) {
      const feedbackPhase = (msg as { phase?: string }).phase || 'understanding'
      correctByPhase[feedbackPhase] = (correctByPhase[feedbackPhase] || 0) + 1
    }
  })

  const currentPhaseIndex = phaseOrder.indexOf(currentPhase)

  return PHASES_CONFIG.map((phase, idx) => {
    const correct = correctByPhase[phase.id] || 0
    const minRequired = PHASE_MIN_QUESTIONS_FOR_PROGRESS[phase.id] || 2
    let status: 'locked' | 'active' | 'completed' = 'locked'
    let confidenceProgress = 0

    if (isCompleted) {
      // Session is complete - all phases are completed
      status = 'completed'
      confidenceProgress = 100
    } else if (idx < currentPhaseIndex) {
      // Completed phases
      status = 'completed'
      confidenceProgress = 100
    } else if (idx === currentPhaseIndex) {
      // Active phase - calculate progress as percentage toward minimum required
      status = 'active'
      // Progress = (correct / minRequired) * 100, capped at 100
      confidenceProgress = Math.min(Math.round((correct / minRequired) * 100), 100)
    }
    // Locked phases stay at 0

    return {
      ...phase,
      status,
      confidenceProgress,
    }
  })
}

export async function initializeCoachingSession(problemId: number) {
  const supabase = await createServerSupabaseClient()

  const session = await getOrCreateSession(problemId)
  if (!session) {
    throw new Error('Failed to create session')
  }

  const problem = await getProblemById(problemId)
  if (!problem) {
    throw new Error('Problem not found')
  }

  // DEFENSIVE CHECK: If messages already exist, skip initialization entirely
  // This prevents duplicate generation even if is_initialized flag is somehow wrong
  const existingMessages = await getSessionMessages(session.id)
  if (existingMessages.length > 0) {
    const { data: sessionCheck } = await supabase
      .from('coaching_sessions')
      .select('completed_at')
      .eq('id', session.id)
      .single()
    const isCompleted = !!sessionCheck?.completed_at

    // Ensure is_initialized is set (fix any inconsistent state)
    await supabase
      .from('coaching_sessions')
      .update({ is_initialized: true })
      .eq('id', session.id)

    return {
      session,
      problem: toClientProblem({ ...problem, problemSets: [] }),
      messages: toSafeMessages(existingMessages),
      phases: computePhases(existingMessages, session.currentPhase, isCompleted),
      isCompleted,
    }
  }

  // No messages yet - try atomic claim
  const { data: claimed } = await supabase
    .from('coaching_sessions')
    .update({ is_initialized: true })
    .eq('id', session.id)
    .eq('is_initialized', false)
    .select('id')
    .single()

  if (!claimed) {
    // Lost the race - another call is initializing or already initialized
    // Wait briefly for the winner to finish generating messages, then fetch
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Check if session is completed
    const { data: sessionCheck } = await supabase
      .from('coaching_sessions')
      .select('completed_at')
      .eq('id', session.id)
      .single()
    const isCompleted = !!sessionCheck?.completed_at

    const messages = await getSessionMessages(session.id)
    const phases = computePhases(messages, session.currentPhase, isCompleted)

    return {
      session,
      problem: toClientProblem({ ...problem, problemSets: [] }),
      messages: toSafeMessages(messages),
      phases: computePhases(messages, session.currentPhase, isCompleted),
      isCompleted,
    }
  }

  // Won the race - this call is responsible for generating initial messages
  const phases = computePhases([], session.currentPhase)
  const currentPhase = phases.find(p => p.status === 'active') || phases[0]

  // Generate intro and first question (lightweight version for fast session init)
  const { intro, question } = await generateFirstQuestion({
    problem: toLLMProblem({ ...problem, problemSets: [] }),
    sessionId: session.id,
  })
  await saveCoachMessage(session.id, currentPhase.id, intro)
  await saveQuestionMessage(session.id, currentPhase.id, question)

  // Fetch messages again to include the new ones
  const updatedMessages = await getSessionMessages(session.id)

  return {
    session,
    problem: {
      ...problem,
      problemSets: [],
      completionStatus: 'Untouched' as const,
    },
    messages: updatedMessages,
    phases: computePhases(updatedMessages, session.currentPhase),
    isCompleted: false, // New sessions are never completed
  }
}

// Initialize session by session ID (for direct session URL access)
export async function initializeCoachingSessionById(sessionId: string) {
  const supabase = await createServerSupabaseClient()

  const session = await getCoachingSession(sessionId)
  if (!session) {
    throw new Error('Session not found')
  }

  const problem = await getProblemById(session.problemId)
  if (!problem) {
    throw new Error('Problem not found')
  }

  // Fetch messages and session status
  const [existingMessages, { data: sessionCheck }] = await Promise.all([
    getSessionMessages(session.id),
    supabase
      .from('coaching_sessions')
      .select('completed_at, is_initialized')
      .eq('id', session.id)
      .single()
  ])

  const isCompleted = !!sessionCheck?.completed_at
  const isInitialized = !!sessionCheck?.is_initialized

  // If messages exist, return them
  if (existingMessages.length > 0) {
    return {
      session,
      problem: toClientProblem(problem),
      messages: toSafeMessages(existingMessages),
      phases: computePhases(existingMessages, session.currentPhase, isCompleted),
      isCompleted,
      isInitialized: true,
    }
  }

  // No messages yet - return empty state for welcome screen
  // The UI will show the problem modal and "Start Session" button
  // Background generation should already be running from createFreshSession
  return {
    session,
    problem: toClientProblem(problem),
    messages: [],
    phases: computePhases([], session.currentPhase, false),
    isCompleted: false,
    isInitialized,
  }
}


export async function submitCoachingAnswer(
  sessionId: string,
  questionId: string,
  selectedOptions: string[]
) {
  const actionStart = Date.now()
  const t = (label: string) => console.log(`[Timing] ${label} at T+${Date.now() - actionStart}ms`)

  // OPTIMIZATION: Fetch ALL initial data in one parallel batch
  const supabase = await createServerSupabaseClient()

  // First batch: session + messages (need session.problem_id and current_phase for next batch)
  const [messages, { data: sessionData }] = await Promise.all([
    getSessionMessages(sessionId),
    supabase
      .from('coaching_sessions')
      .select('problem_id, current_phase, phase_summaries')
      .eq('id', sessionId)
      .single()
  ])
  t('Batch 1 (messages + session)')

  if (!sessionData) {
    throw new Error('Session not found')
  }

  const question = messages.find(m => m.id === questionId && m.type === 'question') as QuestionMessage | undefined
  if (!question) {
    throw new Error('Question not found')
  }

  const currentPhase = PHASES_CONFIG.find(p => p.id === sessionData.current_phase) || PHASES_CONFIG[0]

  // Second batch: problem + cache (parallel)
  const [problem, cachedQuestion] = await Promise.all([
    getProblemById(sessionData.problem_id).then(r => { t('  - getProblemById done'); return r }),
    getCachedNextQuestion(sessionId, currentPhase.id).then(r => { t('  - Redis getCachedNextQuestion done'); return r }),
  ])
  t(`Batch 2 done - cache ${cachedQuestion ? 'HIT' : 'MISS'}`)

  if (!problem) {
    throw new Error('Problem not found')
  }

  // Save user answer (fire-and-forget style - we don't need the result)
  const saveAnswerPromise = saveUserAnswerMessage(sessionId, currentPhase.id, selectedOptions)

  // Use existing messages for AI context (don't refetch - user answer doesn't affect AI evaluation)
  const allMessages = messages

  // Filter to current phase messages only
  const currentPhaseMessages = getCurrentPhaseMessages(allMessages, currentPhase.id)

  // Use cached summaries from the session data we already fetched
  const phaseOrder = ['understanding', 'solution-building', 'algorithm-steps']
  const currentPhaseIndex = phaseOrder.indexOf(currentPhase.id)
  const previousPhaseIds = phaseOrder.slice(0, currentPhaseIndex)

  // Already have session data with phase_summaries from initial fetch
  const cachedSummaries = (sessionData.phase_summaries as Record<string, PhaseSummaryResult>) || {}

  const previousPhaseSummaries: PhaseSummaryResult[] = []
  for (const phaseId of previousPhaseIds) {
    // Use cached summary if available
    if (cachedSummaries[phaseId]) {
      previousPhaseSummaries.push(cachedSummaries[phaseId])
    } else {
      // Generate summary if not cached (fallback for existing sessions without summaries)
      const phaseMessages = getPhaseMessages(allMessages, phaseId)
      if (phaseMessages.length > 0) {
        const summary = await generatePhaseSummary({
          problem: toLLMProblem(problem),
          phaseId,
          phaseMessages,
          sessionId,
        })
        previousPhaseSummaries.push(summary)
        // Cache the generated summary for future use
        await savePhaseSummary(sessionId, phaseId, summary)
      }
    }
  }

  // ==========================================================================
  // SPECULATIVE PARALLEL EXECUTION for latency optimization
  // ==========================================================================
  // Start generating the next question WHILE evaluating the answer.
  // BUT: Skip speculation if we have a cached question OR likely to transition phases.

  const questionIndex = getQuestionIndex(allMessages)

  // Check if we're likely to transition phases (already have enough correct answers)
  const PHASE_MINIMUMS: Record<string, number> = {
    'understanding': 2,
    'solution-building': 2,
    'algorithm-steps': 3,
  }
  const minForPhase = PHASE_MINIMUMS[currentPhase.id] || 2
  const correctInPhase = currentPhaseMessages.filter(m => m.type === 'feedback' && m.isCorrect).length
  // If one more correct answer would meet/exceed minimum, likely to transition - skip speculation
  const likelyToTransition = correctInPhase >= minForPhase - 1

  // Speculatively generate next question for current phase
  // Skip if: (1) we have a cached question, (2) likely to transition
  const shouldSpeculate = !likelyToTransition && !cachedQuestion
  const speculativePromise = shouldSpeculate
    ? generateCoachingQuestion({
      problem: toLLMProblem(problem),
      phase: currentPhase,
      previousMessages: allMessages,
      sessionId,
      questionIndex: questionIndex + 1,
    })
    : Promise.resolve(null)

  if (cachedQuestion) {
    console.log(`[Speculation] Skipping - cache hit for phase ${currentPhase.id}`)
  } else if (likelyToTransition) {
    console.log(`[Speculation] Skipping - likely to transition from ${currentPhase.id} (${correctInPhase}/${minForPhase} correct)`)
  }

  // Evaluate answer in parallel with speculative generation (if any)
  t('Starting evaluateAnswer')
  const [feedback, speculativeNextQuestion] = await Promise.all([
    evaluateAnswer({
      question,
      selectedOptions,
      problem: toLLMProblem(problem),
      phase: currentPhase,
      currentPhaseMessages,
      previousPhaseSummaries,
      sessionId,
      questionIndex,
    }),
    speculativePromise,
  ])
  t(`evaluateAnswer done - isCorrect: ${feedback.isCorrect}, shouldAdvance: ${feedback.shouldAdvancePhase}`)

  // Save user answer and feedback in parallel (both are independent DB writes)
  await Promise.all([
    saveAnswerPromise,
    saveFeedbackMessage(sessionId, currentPhase.id, feedback),
  ])
  t('Saved answer + feedback')

  // OPTIMIZATION: Don't refetch messages - compute from what we have
  // The feedback we just saved is in 'feedback' variable, we can use allMessages + feedback for logic
  const updatedMessages = allMessages // Use existing messages for phase transition logic

  // Phase transition is determined by evaluateAnswer's shouldAdvancePhase
  // BUT we enforce minimum question counts as a safety net (reuse minForPhase from above)
  const minQuestions = minForPhase
  const questionsInPhase = countQuestionsInPhase(allMessages, currentPhase.id)

  let canAdvance = feedback.shouldAdvancePhase
  if (feedback.shouldAdvancePhase && questionsInPhase < minQuestions) {
    console.log(`[Phase Guard] Blocking advancement from ${currentPhase.id}. Questions: ${questionsInPhase}, Minimum: ${minQuestions}`)
    canAdvance = false
  }

  // Handle phase transition based on AI decision
  // Check for final phase completion first - algorithm-steps is the last phase
  if (canAdvance && currentPhase.id === 'algorithm-steps') {
    // Algorithm-steps phase complete - session is done!
    const supabaseForComplete = await createServerSupabaseClient()
    await supabaseForComplete
      .from('coaching_sessions')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', sessionId)

    // Maybe sample for production monitoring
    await maybeSampleSession(sessionId)

    // Fetch messages with the feedback we just saved
    const messagesWithFeedback = await getSessionMessages(sessionId)
    console.log(`[Timing] submitCoachingAnswer completed at T+${Date.now() - actionStart}ms (session completed)`)

    return {
      messages: toSafeMessages(messagesWithFeedback),
      phases: computePhases(messagesWithFeedback, currentPhase.id, true),
      isCompleted: true,
      awaitingProbeResponse: false,
      phaseTransitionPending: false,
    }
  } else if (canAdvance && feedback.nextPhase) {
    // AI decided to advance to next phase - return early with pending flag
    // Client will show celebration UI and call completePhaseTransition
    await updateSessionPhase(sessionId, feedback.nextPhase)

    // Fetch messages with the feedback we just saved
    const messagesWithFeedback = await getSessionMessages(sessionId)
    console.log(`[Timing] submitCoachingAnswer completed at T+${Date.now() - actionStart}ms (phase transition pending)`)

    return {
      messages: toSafeMessages(messagesWithFeedback),
      phases: computePhases(messagesWithFeedback, feedback.nextPhase, false),
      isCompleted: false,
      awaitingProbeResponse: false,
      phaseTransitionPending: true,
      previousPhaseId: currentPhase.id,
      nextPhaseId: feedback.nextPhase,
    }
  } else if (!canAdvance) {
    // Stay in current phase - try to use cached/speculative question for low latency
    // Priority: 1) Cached question from pre-generation, 2) Speculative question, 3) Generate fresh
    t('Starting next question resolution')
    if (cachedQuestion && cachedQuestion.correctAnswer) {
      // Use cached question (single-pass generation includes correctAnswer)
      t(`Cache HIT for phase ${currentPhase.id}`)

      const questionToSave = {
        phase: cachedQuestion.phase,
        questionType: cachedQuestion.questionType,
        content: cachedQuestion.content,
        options: cachedQuestion.options,
        correctAnswer: cachedQuestion.correctAnswer,
      }

      // Save question and clear cache in parallel
      await Promise.all([
        saveQuestionMessage(sessionId, currentPhase.id, questionToSave),
        clearCachedNextQuestion(sessionId, currentPhase.id),
      ])
      t('Saved cached question')
    } else if (speculativeNextQuestion) {
      // Use speculative question (generated in parallel with evaluateAnswer)
      t('Using speculative question')
      await saveQuestionMessage(sessionId, currentPhase.id, speculativeNextQuestion)
      t('Saved speculative question')
    } else {
      // Fallback: generate synchronously (slowest path)
      t('FALLBACK: generating question synchronously')
      const fallbackQuestionIndex = getQuestionIndex(updatedMessages)
      const nextQuestion = await generateCoachingQuestion({
        problem: toLLMProblem(problem),
        phase: currentPhase,
        previousMessages: updatedMessages,
        sessionId,
        questionIndex: fallbackQuestionIndex,
      })
      t('Fallback question generated')
      await saveQuestionMessage(sessionId, currentPhase.id, nextQuestion)
      t('Saved fallback question')
    }
  }

  // OPTIMIZATION: Compute final phase from our logic instead of refetching session
  // We know exactly what phase we're in: either stayed in currentPhase or advanced
  const finalPhase = (canAdvance && feedback.nextPhase) ? feedback.nextPhase : currentPhase.id

  // OPTIMIZATION: isCompleted is always false here - completion only happens in submitSolutionExplanation
  const isCompleted = false

  // Fetch final messages (still needed for IDs assigned by DB)
  t('Fetching final messages')
  const finalMessages = await getSessionMessages(sessionId)
  t('DONE')

  // NOTE: Pre-generation for next question is triggered by client effect
  // (removing server-side fire-and-forget to avoid duplicate calls)

  return {
    messages: toSafeMessages(finalMessages),
    phases: computePhases(finalMessages, finalPhase, isCompleted),
    isCompleted,
    awaitingProbeResponse: false,
    phaseTransitionPending: false,
  }
}

/**
 * Complete a phase transition after the client shows celebration UI.
 * Uses template intros (faster) and generates just the first question.
 */
export async function completePhaseTransition(
  sessionId: string,
  previousPhaseId: string,
  nextPhaseId: string
) {
  const actionStart = Date.now()
  console.log(`[PhaseTransition] Starting completion for ${previousPhaseId} → ${nextPhaseId}`)

  const supabase = await createServerSupabaseClient()

  // Fetch session and problem data
  const [messages, { data: sessionData }] = await Promise.all([
    getSessionMessages(sessionId),
    supabase
      .from('coaching_sessions')
      .select('problem_id')
      .eq('id', sessionId)
      .single()
  ])

  if (!sessionData) {
    throw new Error('Session not found')
  }

  const problem = await getProblemById(sessionData.problem_id)
  if (!problem) {
    throw new Error('Problem not found')
  }

  const llmProblem = toLLMProblem(problem)

  // Get messages from the completed phase for summary
  const completedPhaseMessages = getPhaseMessages(messages, previousPhaseId)

  // Standard quiz phases - use template intro + check for cached first question
  const nextPhase = PHASES_CONFIG.find(p => p.id === nextPhaseId)
  if (!nextPhase) {
    throw new Error(`Invalid phase: ${nextPhaseId}`)
  }

  const intro = PHASE_INTRO_TEMPLATES[nextPhaseId]
  if (!intro) {
    throw new Error(`No template intro for phase: ${nextPhaseId}`)
  }

  // Check for pre-generated phase transition question in KV cache
  const cachedQuestion = await getCachedPhaseTransitionQuestion(sessionId, nextPhaseId)

  if (cachedQuestion && cachedQuestion.correctAnswer) {
    // Use cached question (single-pass generation includes correctAnswer)
    console.log(`[PhaseTransition] Cache hit! Using pre-generated question for ${nextPhaseId}`)

    const firstQuestion = {
      phase: cachedQuestion.phase,
      questionType: cachedQuestion.questionType,
      content: cachedQuestion.content,
      options: cachedQuestion.options,
      correctAnswer: cachedQuestion.correctAnswer,
    }

    // Save messages SEQUENTIALLY to ensure correct ordering in database
    // (parallel inserts can get same created_at timestamp causing undefined order)
    await saveCoachMessage(sessionId, nextPhaseId, intro)
    await saveQuestionMessage(sessionId, nextPhaseId, firstQuestion)
    await clearCachedPhaseTransitionQuestion(sessionId, nextPhaseId)

    // Generate and save phase summary in background (fire-and-forget)
    // This is used for context in later phases but user doesn't need to wait
    generatePhaseSummary({
      problem: llmProblem,
      phaseId: previousPhaseId,
      phaseMessages: completedPhaseMessages,
      sessionId,
    }).then(phaseSummary => {
      savePhaseSummary(sessionId, previousPhaseId, phaseSummary)
        .then(() => console.log(`[PhaseTransition] Background summary saved for ${previousPhaseId}`))
        .catch(err => console.error(`[PhaseTransition] Failed to save summary:`, err))
    }).catch(err => console.error(`[PhaseTransition] Failed to generate summary:`, err))
  } else {
    // No cache - generate fresh
    console.log(`[PhaseTransition] Cache miss - generating question for ${nextPhaseId}`)
    const questionIndex = getQuestionIndex(messages)

    // Generate first question (user waits for this)
    const firstQuestion = await generateCoachingQuestion({
      problem: llmProblem,
      phase: nextPhase,
      previousMessages: messages,
      sessionId,
      questionIndex,
    })

    // Save messages SEQUENTIALLY to ensure correct ordering
    await saveCoachMessage(sessionId, nextPhaseId, intro)
    await saveQuestionMessage(sessionId, nextPhaseId, firstQuestion)

    // Generate and save phase summary in background (fire-and-forget)
    generatePhaseSummary({
      problem: llmProblem,
      phaseId: previousPhaseId,
      phaseMessages: completedPhaseMessages,
      sessionId,
    }).then(phaseSummary => {
      savePhaseSummary(sessionId, previousPhaseId, phaseSummary)
        .then(() => console.log(`[PhaseTransition] Background summary saved for ${previousPhaseId}`))
        .catch(err => console.error(`[PhaseTransition] Failed to save summary:`, err))
    }).catch(err => console.error(`[PhaseTransition] Failed to generate summary:`, err))
  }

  // Fetch final messages
  const finalMessages = await getSessionMessages(sessionId)
  console.log(`[PhaseTransition] Completed in ${Date.now() - actionStart}ms`)

  return {
    messages: finalMessages,
    phases: computePhases(finalMessages, nextPhaseId, false),
    isCompleted: false,
  }
}

export async function submitProbeResponse(
  sessionId: string,
  probeQuestionId: string,
  response: string
) {
  const supabase = await createServerSupabaseClient()

  // Get session data
  const { data: sessionData } = await supabase
    .from('coaching_sessions')
    .select('problem_id, current_phase')
    .eq('id', sessionId)
    .single()

  if (!sessionData) {
    throw new Error('Session not found')
  }

  const problem = await getProblemById(sessionData.problem_id)
  if (!problem) {
    throw new Error('Problem not found')
  }

  const currentPhase = PHASES_CONFIG.find(p => p.id === sessionData.current_phase) || PHASES_CONFIG[0]

  // Find the probe question
  const messages = await getSessionMessages(sessionId)
  const probeQuestion = messages.find(m => m.id === probeQuestionId && m.type === 'probe-question')

  if (!probeQuestion || probeQuestion.type !== 'probe-question') {
    throw new Error('Probe question not found')
  }

  // Save the student's probe response
  await saveProbeResponseMessage(sessionId, currentPhase.id, response)

  // Get updated messages for context
  const messagesForContext = await getSessionMessages(sessionId)

  // Evaluate the probe response
  const evaluation = await evaluateProbeResponse({
    problem: toLLMProblem(problem),
    phase: currentPhase,
    probeQuestion: probeQuestion.content,
    studentResponse: response,
    previousMessages: messagesForContext,
    sessionId,
  })

  // Save the evaluation
  await saveProbeEvaluationMessage(sessionId, currentPhase.id, evaluation.evaluation, evaluation.understandingLevel)

  // Get updated messages
  let updatedMessages = await getSessionMessages(sessionId)

  // Handle phase advancement or continuation based on evaluation
  if (evaluation.needsClarification && evaluation.clarificationQuestion) {
    // Ask another probe question for clarification
    const clarificationProbeType = evaluation.understandingLevel === 'unclear' ? 'explain-reasoning' : 'short-answer'
    await saveProbeQuestionMessage(sessionId, currentPhase.id, evaluation.clarificationQuestion, clarificationProbeType)
  } else if (evaluation.shouldAdvancePhase && evaluation.nextPhase) {
    // Advance to next phase
    await updateSessionPhase(sessionId, evaluation.nextPhase)

    // Generate intro and first question for next phase
    const nextPhase = PHASES_CONFIG.find(p => p.id === evaluation.nextPhase)
    if (!nextPhase) {
      console.error(`[Probe Transition] Invalid nextPhase from LLM: "${evaluation.nextPhase}"`)
      // Stay in current phase - generate next question
      const questionIndex = getQuestionIndex(updatedMessages)
      const nextQuestion = await generateCoachingQuestion({
        problem: toLLMProblem(problem),
        phase: currentPhase,
        previousMessages: updatedMessages,
        sessionId,
        questionIndex,
      })
      await saveQuestionMessage(sessionId, currentPhase.id, nextQuestion)
    } else {
      const questionIndex = getQuestionIndex(updatedMessages)
      const { intro, question: nextQuestion } = await generatePhaseIntroWithQuestion({
        problem: toLLMProblem(problem),
        phase: nextPhase,
        previousMessages: updatedMessages,
        sessionId,
        questionIndex,
      })
      await saveCoachMessage(sessionId, evaluation.nextPhase!, intro)
      await saveQuestionMessage(sessionId, evaluation.nextPhase!, nextQuestion)
    }
  } else if (evaluation.shouldAdvancePhase && !evaluation.nextPhase && currentPhase.id === 'algorithm-steps') {
    // Algorithm-steps phase complete with no next phase - session is done!
    await supabase
      .from('coaching_sessions')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', sessionId)

    // Maybe sample for production monitoring
    await maybeSampleSession(sessionId)
  } else {
    // Stay in current phase - generate next question
    const questionIndex = getQuestionIndex(updatedMessages)
    const nextQuestion = await generateCoachingQuestion({
      problem: toLLMProblem(problem),
      phase: currentPhase,
      previousMessages: updatedMessages,
      sessionId,
      questionIndex,
    })
    await saveQuestionMessage(sessionId, currentPhase.id, nextQuestion)
  }

  // Return final state
  const finalMessages = await getSessionMessages(sessionId)
  const { data: updatedSession } = await supabase
    .from('coaching_sessions')
    .select('current_phase, completed_at')
    .eq('id', sessionId)
    .single()

  const isCompleted = !!updatedSession?.completed_at
  // Check if there's a pending probe question (needs clarification)
  const lastMessage = finalMessages[finalMessages.length - 1]
  const awaitingProbeResponse = lastMessage?.type === 'probe-question'

  return {
    messages: finalMessages,
    phases: computePhases(finalMessages, updatedSession?.current_phase || sessionData.current_phase, isCompleted),
    isCompleted,
    awaitingProbeResponse,
  }
}

export async function askCoachQuestion(
  sessionId: string,
  question: string
) {
  const supabase = await createServerSupabaseClient()

  // OPTIMIZATION: Fetch session data and messages in parallel
  const [{ data: sessionData }, messagesForContext] = await Promise.all([
    supabase
      .from('coaching_sessions')
      .select('problem_id, current_phase')
      .eq('id', sessionId)
      .single(),
    getSessionMessages(sessionId)
  ])

  if (!sessionData) {
    throw new Error('Session not found')
  }

  const problem = await getProblemById(sessionData.problem_id)
  if (!problem) {
    throw new Error('Problem not found')
  }

  const currentPhase = PHASES_CONFIG.find(p => p.id === sessionData.current_phase) || PHASES_CONFIG[0]

  // Save user's question (fire-and-forget - we have messages already)
  const saveQuestionPromise = saveUserQuestionMessage(sessionId, currentPhase.id, question)

  const questionIndex = getQuestionIndex(messagesForContext)

  // Get AI response (can start before save completes)
  const coachResponse = await respondToUserQuestion({
    problem: toLLMProblem(problem),
    phase: currentPhase,
    userQuestion: question,
    previousMessages: messagesForContext,
    sessionId,
    questionIndex,
  })

  // Ensure user question is saved, then save coach response
  await saveQuestionPromise
  await saveCoachResponseMessage(sessionId, currentPhase.id, coachResponse.response)

  // OPTIMIZATION: Use existing messages - don't refetch
  const updatedMessages = messagesForContext

  // Handle phase advancement if AI decides student is ready
  if (coachResponse.shouldAdvancePhase && coachResponse.nextPhase) {
    await updateSessionPhase(sessionId, coachResponse.nextPhase)

    // Generate intro and first question together for next phase
    const nextPhase = PHASES_CONFIG.find(p => p.id === coachResponse.nextPhase)
    if (!nextPhase) {
      console.error(`[Coach Response Transition] Invalid nextPhase from LLM: "${coachResponse.nextPhase}"`)
      // Don't generate new content - just respond to user's question
    } else {
      const nextQuestionIndex = getQuestionIndex(updatedMessages)
      const { intro, question: nextQuestion } = await generatePhaseIntroWithQuestion({
        problem: toLLMProblem(problem),
        phase: nextPhase,
        previousMessages: updatedMessages,
        sessionId,
        questionIndex: nextQuestionIndex,
      })
      await saveCoachMessage(sessionId, coachResponse.nextPhase!, intro)
      await saveQuestionMessage(sessionId, coachResponse.nextPhase!, nextQuestion)
    }
  } else if (coachResponse.shouldFollowUpWithQuiz) {
    // GUARD: Only generate a new question if there isn't already an unanswered one
    // This prevents the bug where asking for a hint generates a new question prematurely
    if (!hasUnansweredQuestion(updatedMessages)) {
      const nextQuestionIndex = getQuestionIndex(updatedMessages)
      const nextQuestion = await generateCoachingQuestion({
        problem: toLLMProblem(problem),
        phase: currentPhase,
        previousMessages: updatedMessages,
        sessionId,
        questionIndex: nextQuestionIndex,
      })
      await saveQuestionMessage(sessionId, currentPhase.id, nextQuestion)
    }
    // If there's already an unanswered question, skip generation - let user answer it first
  }

  // Get final state - fetch messages and session in parallel
  const [finalMessages, { data: updatedSession }] = await Promise.all([
    getSessionMessages(sessionId),
    supabase
      .from('coaching_sessions')
      .select('current_phase, completed_at')
      .eq('id', sessionId)
      .single()
  ])

  const isCompleted = !!updatedSession?.completed_at

  return {
    messages: finalMessages,
    phases: computePhases(finalMessages, updatedSession?.current_phase || sessionData.current_phase, isCompleted),
    isCompleted,
  }
}

export async function updateCoachingSessionTime(sessionId: string, elapsedSeconds: number) {
  await updateSessionTime(sessionId, elapsedSeconds)
}

export async function deleteCoachingSession(sessionId: string) {
  const success = await deleteSession(sessionId)
  if (success) {
    revalidatePath('/coach')
  }
  return success
}

export async function restartCoachingSession(problemId: number): Promise<never | null> {
  // Check authentication
  const user = await getUser()
  if (!user) {
    return null
  }

  const session = await createCoachingSession(problemId, user.id)
  if (!session) {
    return null
  }

  revalidatePath('/coach')

  // Redirect immediately - client will trigger first question generation
  redirect(`/coach/${session.id}`)
}

/**
 * Trigger first question generation in the background.
 * Called from client when welcome state is shown.
 */
export async function triggerFirstQuestionGeneration(sessionId: string): Promise<void> {
  const supabase = await createServerSupabaseClient()

  // Get session data
  const { data: sessionData } = await supabase
    .from('coaching_sessions')
    .select('problem_id, is_initialized')
    .eq('id', sessionId)
    .single()

  if (!sessionData || sessionData.is_initialized) {
    // Already initialized or not found, skip
    return
  }

  // Check if already cached
  const existingCache = await getCachedNextQuestion(sessionId, 'first-question')
  if (existingCache) {
    console.log(`[FirstQuestion] Already cached for session ${sessionId}`)
    return
  }

  // Generate in this request context (not fire-and-forget)
  await doGenerateFirstQuestion(sessionId, sessionData.problem_id)
}

// =============================================================================
// Background First Question Generation
// =============================================================================

/**
 * Generate the first question in the background and cache it.
 * Called when session is created - runs while user reads problem statement.
 */
async function doGenerateFirstQuestion(sessionId: string, problemId: number): Promise<void> {
  console.log(`[FirstQuestion] Starting background generation for session ${sessionId}`)
  const startTime = Date.now()

  const problem = await getProblemById(problemId)
  if (!problem) {
    console.error('[FirstQuestion] Problem not found:', problemId)
    return
  }

  const llmProblem = toLLMProblem(problem)

  // Generate the first question using the lightweight function
  const { intro, question } = await generateFirstQuestion({
    problem: llmProblem,
    sessionId,
  })

  // Cache the result for when user clicks "Start Session"
  // Store intro alongside the question data
  await cacheNextQuestion(sessionId, 'first-question', {
    phase: 'understanding',
    questionType: question.questionType,
    content: question.content,
    options: question.options,
    correctAnswer: question.correctAnswer,
    intro,  // Store intro with the cached question
  })

  console.log(`[FirstQuestion] Completed in ${Date.now() - startTime}ms for session ${sessionId}`)
}

/**
 * Called when user clicks "Start Session" button.
 * Retrieves the cached first question (or generates if not ready) and saves to messages.
 */
export async function startCoachingSession(sessionId: string): Promise<{
  success: boolean
  messages?: Message[]
  phases?: Phase[]
}> {
  console.log(`[StartSession] Starting session ${sessionId}`)
  const supabase = await createServerSupabaseClient()

  // Get session data
  const { data: sessionData } = await supabase
    .from('coaching_sessions')
    .select('problem_id, current_phase, is_initialized')
    .eq('id', sessionId)
    .single()

  if (!sessionData) {
    console.error(`[StartSession] Session not found: ${sessionId}`)
    return { success: false }
  }

  // If already initialized, just return current state
  if (sessionData.is_initialized) {
    console.log(`[StartSession] Session already initialized, returning current state`)
    const messages = await getSessionMessages(sessionId)
    return {
      success: true,
      messages,
      phases: computePhases(messages, sessionData.current_phase),
    }
  }

  const currentPhase = PHASES_CONFIG.find(p => p.id === sessionData.current_phase) || PHASES_CONFIG[0]

  // Try to get cached first question (includes intro)
  const cachedQuestion = await getCachedNextQuestion(sessionId, 'first-question')

  let intro: string
  let question: {
    phase: string
    questionType: 'single-select' | 'multi-select'
    content: string
    options: { id: string; label: string; text: string }[]
    correctAnswer: string[]
  }

  if (cachedQuestion && cachedQuestion.correctAnswer && cachedQuestion.intro) {
    // Use cached question
    console.log(`[StartSession] Using cached first question for session ${sessionId}`)
    intro = cachedQuestion.intro
    question = {
      phase: cachedQuestion.phase,
      questionType: cachedQuestion.questionType,
      content: cachedQuestion.content,
      options: cachedQuestion.options,
      correctAnswer: cachedQuestion.correctAnswer,
    }
    // Clear the cache
    await clearCachedNextQuestion(sessionId, 'first-question')
  } else {
    // Generate now (background generation didn't complete in time)
    console.log(`[StartSession] Cache miss - generating first question now for session ${sessionId}`)
    const problem = await getProblemById(sessionData.problem_id)
    if (!problem) {
      console.error(`[StartSession] Problem not found: ${sessionData.problem_id}`)
      return { success: false }
    }

    const result = await generateFirstQuestion({
      problem: toLLMProblem(problem),
      sessionId,
    })
    intro = result.intro
    question = result.question
  }

  // Save messages
  await saveCoachMessage(sessionId, currentPhase.id, intro)
  await saveQuestionMessage(sessionId, currentPhase.id, question)

  // Mark as initialized
  await supabase
    .from('coaching_sessions')
    .update({ is_initialized: true })
    .eq('id', sessionId)

  // Get final messages
  const messages = await getSessionMessages(sessionId)

  // NOTE: Pre-generation for question #2 is triggered by client effect
  // (removing server-side fire-and-forget to avoid duplicate calls)

  return {
    success: true,
    messages,
    phases: computePhases(messages, sessionData.current_phase),
  }
}

export async function flagCoachingMessage(messageId: string): Promise<{ success: boolean; alreadyFlagged?: boolean }> {
  const supabase = await createServerSupabaseClient()

  // Check if already flagged
  const { data: existing } = await supabase
    .from('coaching_messages')
    .select('is_flagged')
    .eq('id', messageId)
    .single()

  if (existing?.is_flagged) {
    return { success: true, alreadyFlagged: true }
  }

  // Flag the message
  const { error } = await supabase
    .from('coaching_messages')
    .update({
      is_flagged: true,
      flagged_at: new Date().toISOString(),
    })
    .eq('id', messageId)

  if (error) {
    console.error('Failed to flag message:', error.message)
    return { success: false }
  }

  return { success: true }
}

export async function submitAsGoldenCandidate(
  sessionId: string,
  notes?: string
): Promise<{ success: boolean; alreadySubmitted?: boolean }> {
  const supabase = await createServerSupabaseClient()

  // Check if already submitted
  const { data: existing } = await supabase
    .from('coaching_sessions')
    .select('is_golden_candidate, submitted_as_golden_at')
    .eq('id', sessionId)
    .single()

  if (existing?.is_golden_candidate && existing?.submitted_as_golden_at) {
    return { success: true, alreadySubmitted: true }
  }

  // Submit as golden candidate
  const { error } = await supabase
    .from('coaching_sessions')
    .update({
      is_golden_candidate: true,
      contributor_notes: notes || null,
      submitted_as_golden_at: new Date().toISOString(),
    })
    .eq('id', sessionId)

  if (error) {
    console.error('Failed to submit as golden candidate:', error.message)
    return { success: false }
  }

  return { success: true }
}

// =============================================================================
// Session Management for Problem Card Flow
// =============================================================================

export async function checkIncompleteSession(problemId: number): Promise<{ hasIncomplete: boolean; sessionId?: string }> {
  const existing = await getIncompleteSessionForProblem(problemId)
  if (existing) {
    return { hasIncomplete: true, sessionId: existing.id }
  }
  return { hasIncomplete: false }
}

export async function createFreshSession(problemId: number): Promise<never | { error: string }> {
  // Check authentication
  const user = await getUser()
  if (!user) {
    return { error: 'auth_required' }
  }

  const session = await createCoachingSession(problemId, user.id)
  if (!session) {
    return { error: 'Failed to create session' }
  }

  // Redirect immediately - client will trigger first question generation
  // (Fire-and-forget doesn't work here because redirect() terminates the request)
  redirect(`/coach/${session.id}`)
}

// =============================================================================
// Code Execution Actions
// =============================================================================

import { submitBatch, pollResultsBatch, executeWithWait, isErrorStatus, getErrorType } from '@/lib/judge0'
import type { TestCase, ExecutionResult, Judge0Result } from '@/lib/types'
import { JUDGE0_STATUS } from '@/lib/types'

/**
 * Generate Python test runner code that:
 * 1. Reads stdin (variable assignments like "nums = [3,3], target = 6")
 * 2. Executes them to set variables
 * 3. Calls the solution function
 * 4. Prints the result
 */
function generateTestRunner(entryPoint: string): string {
  // Extract just the method name if entry_point is like "Solution().twoSum"
  const methodName = entryPoint.includes('.')
    ? entryPoint.split('.').pop()!
    : entryPoint

  return `
# Test runner - reads input, calls solution, prints result
import sys
import re

# Read all input
_input = sys.stdin.read().strip()

# Convert "nums = [3,3], target = 6" to valid Python syntax
# Split on ", " only when followed by a variable name and "="
# This handles: "var1 = value1, var2 = value2" -> "var1 = value1; var2 = value2"
_input = re.sub(r',\\s*([a-zA-Z_][a-zA-Z0-9_]*)\\s*=', r'; \\1 =', _input)

# Execute the input to set variables
_vars = {}
exec(_input, globals(), _vars)

# Call the solution function with the parsed arguments
_solution = Solution()
_method = getattr(_solution, "${methodName}")

# Get the method's parameter names to pass args in correct order
import inspect
_params = list(inspect.signature(_method).parameters.keys())
_args = [_vars[p] for p in _params if p in _vars]

_result = _method(*_args)
print(_result)
`
}

/**
 * Execute code against test cases using Judge0
 * Server-side only - API key never exposed to client
 * @param code - User's solution code
 * @param tests - Test cases to run against
 * @param codePrompt - Optional test harness/preamble with imports and helper classes
 * @param entryPoint - Solution function name (e.g., "twoSum")
 */
// Threshold for using wait=true (synchronous) vs batch+polling
// wait=true eliminates polling overhead - try higher threshold
const WAIT_MODE_THRESHOLD = 100

export async function executeCode(
  code: string,
  tests: TestCase[],
  codePrompt?: string,
  entryPoint?: string
): Promise<ExecutionResult[]> {
  // Build full code: harness + user solution + test runner
  let fullCode = codePrompt ? `${codePrompt}\n\n${code}` : code

  // Add test runner if we have an entry point
  if (entryPoint) {
    fullCode += '\n\n' + generateTestRunner(entryPoint)
  }

  try {
    // Extract all stdin inputs from test cases
    const stdinInputs = tests.map((test) => test.input)

    let judge0Results: Judge0Result[]

    if (tests.length <= WAIT_MODE_THRESHOLD) {
      // For small test counts, use wait=true (no polling, much faster)
      judge0Results = await executeWithWait(fullCode, stdinInputs)
    } else {
      // For large test counts, use batch submission + polling
      const tokens = await submitBatch(fullCode, stdinInputs)
      judge0Results = await pollResultsBatch(tokens)
    }

    // Map results back to test cases
    return tests.map((test, index) => mapToExecutionResult(test, judge0Results[index]))
  } catch (error) {
    // If batch submission fails, return error for all tests
    return tests.map((test) => ({
      testId: test.id,
      passed: false,
      actualOutput: '',
      expectedOutput: test.expectedOutput,
      error: {
        type: 'runtime' as const,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    }))
  }
}

/**
 * Map Judge0 result to our ExecutionResult format
 */
function mapToExecutionResult(test: TestCase, result: Judge0Result): ExecutionResult {
  const actualOutput = (result.stdout || '').trim()
  const expectedOutput = test.expectedOutput.trim()

  // Check for errors
  if (isErrorStatus(result.status.id)) {
    return {
      testId: test.id,
      passed: false,
      actualOutput: actualOutput,
      expectedOutput: expectedOutput,
      executionTime: result.time ? parseFloat(result.time) * 1000 : undefined,
      memoryUsed: result.memory || undefined,
      error: {
        type: getErrorType(result.status.id),
        message: getErrorMessage(result),
      },
    }
  }

  // Check if output matches expected
  const passed = actualOutput === expectedOutput

  return {
    testId: test.id,
    passed,
    actualOutput,
    expectedOutput,
    executionTime: result.time ? parseFloat(result.time) * 1000 : undefined,
    memoryUsed: result.memory || undefined,
  }
}

/**
 * Extract error message from Judge0 result
 */
function getErrorMessage(result: Judge0Result): string {
  // Compilation error
  if (result.compile_output) {
    return result.compile_output.trim()
  }

  // Runtime error (stderr)
  if (result.stderr) {
    return result.stderr.trim()
  }

  // Timeout
  if (result.status.id === JUDGE0_STATUS.TIME_LIMIT_EXCEEDED) {
    return 'Code execution exceeded the time limit (10 seconds)'
  }

  // Generic message from Judge0
  if (result.message) {
    return result.message
  }

  // Fallback to status description
  return result.status.description
}

/**
 * Result from executing code with test_code assertions
 */
export interface TestCodeExecutionResult {
  passed: boolean
  totalTests: number
  passedTests: number
  error?: {
    type: 'syntax' | 'runtime' | 'timeout' | 'compilation' | 'assertion'
    message: string
    failedAssertion?: string
  }
  executionTime?: number
  memoryUsed?: number
}

/**
 * Execute code against test_code assertions (def check(candidate):...)
 * This is the new testing approach that uses assertion-based test code
 * instead of input/output pairs.
 *
 * @param code - User's solution code
 * @param testCode - Python test code with assertions (def check(candidate):...)
 * @param codePrompt - Optional test harness/preamble with imports and helper classes
 * @param entryPoint - Solution function name (e.g., "twoSum")
 */
export async function executeWithTestCode(
  code: string,
  testCode: string,
  codePrompt?: string,
  entryPoint?: string
): Promise<TestCodeExecutionResult> {
  // Extract just the method name if entry_point is like "Solution().twoSum"
  const methodName = entryPoint?.includes('.')
    ? entryPoint.split('.').pop()!
    : entryPoint

  // Build full code: harness + user solution + test_code + check call
  let fullCode = ''

  // Add preamble/harness if provided
  if (codePrompt) {
    fullCode += codePrompt + '\n\n'
  }

  // Add user's solution
  fullCode += code + '\n\n'

  // Add the test code (def check(candidate):...)
  fullCode += testCode + '\n\n'

  // Add the call to check() with the solution function
  // The test_code expects check(candidate) where candidate is the solution function
  if (methodName) {
    fullCode += `# Run tests\ncheck(Solution().${methodName})\nprint("ALL_TESTS_PASSED")\n`
  } else {
    // Fallback if no entry point - try to call check with a generic Solution reference
    fullCode += `# Run tests\ncheck(Solution)\nprint("ALL_TESTS_PASSED")\n`
  }

  try {
    // Execute the code - single execution, no stdin needed
    const results = await executeWithWait(fullCode, [''])
    const result = results[0]

    if (!result) {
      return {
        passed: false,
        totalTests: 0,
        passedTests: 0,
        error: {
          type: 'runtime',
          message: 'No result from code execution',
        },
      }
    }

    // Check for errors
    if (isErrorStatus(result.status.id)) {
      const errorMessage = getErrorMessage(result)

      // Check if it's an assertion error (test failure)
      const isAssertion = errorMessage.includes('AssertionError')

      // Try to extract which assertion failed
      let failedAssertion: string | undefined
      if (isAssertion) {
        // Extract the line that failed from the traceback
        const assertMatch = errorMessage.match(/assert (.+)/i)
        if (assertMatch) {
          failedAssertion = assertMatch[1]
        }
      }

      return {
        passed: false,
        totalTests: 0,
        passedTests: 0,
        error: {
          type: isAssertion ? 'assertion' : getErrorType(result.status.id),
          message: errorMessage,
          failedAssertion,
        },
        executionTime: result.time ? parseFloat(result.time) * 1000 : undefined,
        memoryUsed: result.memory || undefined,
      }
    }

    // Check if all tests passed (our marker was printed)
    const stdout = (result.stdout || '').trim()
    const allPassed = stdout.includes('ALL_TESTS_PASSED')

    // Count assertions in test_code for totalTests estimate
    const assertCount = (testCode.match(/assert /g) || []).length

    return {
      passed: allPassed,
      totalTests: assertCount,
      passedTests: allPassed ? assertCount : 0,
      executionTime: result.time ? parseFloat(result.time) * 1000 : undefined,
      memoryUsed: result.memory || undefined,
    }
  } catch (error) {
    return {
      passed: false,
      totalTests: 0,
      passedTests: 0,
      error: {
        type: 'runtime',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    }
  }
}

// =============================================================================
// Code Evaluation Actions (AI Feedback)
// =============================================================================

import { evaluateCodeAI, type CodeEvaluation } from '@/lib/openai'

export interface EvaluateCodeResult {
  success: boolean
  evaluation?: CodeEvaluation
  error?: string
}

/**
 * Evaluate user's code with AI and provide Socratic feedback
 * @param code - The code to evaluate (selected text or full code)
 * @param problemId - The problem ID for context
 * @param isSelection - Whether this is a code selection vs full code
 */
export async function evaluateCode(
  code: string,
  problemId: number,
  isSelection: boolean
): Promise<EvaluateCodeResult> {
  try {
    // Fetch problem data for context
    const problem = await getProblemById(problemId)

    if (!problem) {
      return { success: false, error: 'Problem not found' }
    }

    const evaluation = await evaluateCodeAI({
      code,
      problem: {
        title: problem.title,
        description: problem.problem_description,
        solution: problem.solution ?? '',
        prompt: problem.prompt,
      },
      isSelection,
    })

    return { success: true, evaluation }
  } catch (error) {
    console.error('Code evaluation failed:', error)
    return {
      success: false,
      error: 'AI evaluation temporarily unavailable. Please try again.',
    }
  }
}

// =============================================================================
// Authentication Actions
// =============================================================================

/**
 * Sign up a new user with email and password.
 * Optionally stores display name in user metadata.
 * Returns generic error messages to prevent user enumeration.
 *
 * Note: If email confirmation is enabled in Supabase, the user won't be
 * immediately signed in after signUp. They'll need to click the confirmation
 * link first. For immediate sign-in behavior, disable email confirmation
 * in Supabase Dashboard → Authentication → Providers → Email.
 */
export async function signUp(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const displayName = (formData.get('displayName') as string) || undefined

  // Validate required fields
  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName || email.split('@')[0],
      },
    },
  })

  if (error) {
    console.error('Sign up error:', error.message)
    // Generic error message - no user enumeration
    return { error: 'Unable to create account. Please try again.' }
  }

  return {}
}

/**
 * Sign in a user with email and password.
 * Returns generic error messages to prevent user enumeration.
 */
export async function signIn(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Validate required fields
  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Sign in error:', error.message)
    // Generic error message - no user enumeration
    return { error: 'Invalid email or password' }
  }

  // Revalidate to refresh server components with authenticated state
  revalidatePath('/')

  return {}
}
