import { createClient } from '@supabase/supabase-js'
import type { EvalSession, FlaggedMessage } from './types'

// Standalone Supabase client for CLI (uses service role key for full DB access)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL in environment')
}
if (!supabaseServiceKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY in environment')
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface SessionRow {
  id: string
  current_phase: string
  problems: {
    id: number
    title: string
    difficulty: string
    problem_description: string
  }
  coaching_messages: Array<{
    type: string
    content: string
    is_correct: boolean | null
    created_at: string
  }>
}

// Get difficulty for multiple sessions (for segmented reports)
export async function getSessionDifficulties(sessionIds: string[]): Promise<Map<string, string>> {
  const difficulties = new Map<string, string>()

  if (sessionIds.length === 0) return difficulties

  const { data, error } = await supabase
    .from('coaching_sessions')
    .select('id, problems (difficulty)')
    .in('id', sessionIds)

  if (error || !data) {
    console.error('Failed to fetch session difficulties:', error?.message)
    return difficulties
  }

  for (const row of data) {
    const typedRow = row as unknown as { id: string; problems: { difficulty: string } | null }
    if (typedRow.problems?.difficulty) {
      difficulties.set(typedRow.id, typedRow.problems.difficulty)
    }
  }

  return difficulties
}

export async function getSessionWithMessages(sessionId: string): Promise<EvalSession | null> {
  // Fetch session with problem and messages
  const { data: session, error } = await supabase
    .from('coaching_sessions')
    .select(`
      id,
      current_phase,
      problems (id, title, difficulty, problem_description),
      coaching_messages (type, content, is_correct, created_at)
    `)
    .eq('id', sessionId)
    .single()

  if (error || !session) return null

  const typedSession = session as unknown as SessionRow

  // Transform to EvalSession format
  return {
    sessionId: typedSession.id,
    problem: {
      id: typedSession.problems.id,
      title: typedSession.problems.title,
      difficulty: typedSession.problems.difficulty,
      description: typedSession.problems.problem_description,
    },
    messages: typedSession.coaching_messages
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map(m => ({
        type: m.type,
        content: m.content,
        isCorrect: m.is_correct ?? undefined,
      })),
    phases: {
      started: [], // Could be derived from messages
      completed: [],
    },
  }
}

interface FlaggedMessageRow {
  id: string
  session_id: string
  type: string
  content: string
  flagged_at: string
  created_at: string
}

interface SessionMessagesRow {
  id: string
  type: string
  content: string
  created_at: string
}

// Get all flagged messages with surrounding context
export async function getFlaggedMessages(): Promise<FlaggedMessage[]> {
  // Fetch flagged messages
  const { data: flagged, error: flaggedError } = await supabase
    .from('coaching_messages')
    .select('id, session_id, type, content, flagged_at, created_at')
    .eq('is_flagged', true)
    .order('flagged_at', { ascending: false })

  if (flaggedError || !flagged) {
    console.error('Failed to fetch flagged messages:', flaggedError?.message)
    return []
  }

  if (flagged.length === 0) return []

  const typedFlagged = flagged as FlaggedMessageRow[]

  // Get unique session IDs
  const sessionIds = [...new Set(typedFlagged.map(m => m.session_id))]

  // Fetch session details with problems
  const { data: sessions, error: sessionsError } = await supabase
    .from('coaching_sessions')
    .select('id, problems (id, title, difficulty)')
    .in('id', sessionIds)

  if (sessionsError) {
    console.error('Failed to fetch session details:', sessionsError.message)
    return []
  }

  type SessionWithProblem = { id: string; problems: { id: number; title: string; difficulty: string } }
  const sessionMap = new Map<string, SessionWithProblem>()
  for (const session of (sessions || [])) {
    const typed = session as unknown as SessionWithProblem
    sessionMap.set(typed.id, typed)
  }

  // Fetch all messages for these sessions to build context
  const { data: allMessages, error: messagesError } = await supabase
    .from('coaching_messages')
    .select('id, session_id, type, content, created_at')
    .in('session_id', sessionIds)
    .order('created_at', { ascending: true })

  if (messagesError) {
    console.error('Failed to fetch session messages:', messagesError.message)
    return []
  }

  // Group messages by session
  const messagesBySession = new Map<string, SessionMessagesRow[]>()
  for (const msg of (allMessages || []) as Array<SessionMessagesRow & { session_id: string }>) {
    const existing = messagesBySession.get(msg.session_id) || []
    messagesBySession.set(msg.session_id, [...existing, msg])
  }

  // Build flagged messages with context
  const result: FlaggedMessage[] = []
  for (const flaggedMsg of typedFlagged) {
    const session = sessionMap.get(flaggedMsg.session_id)
    if (!session) continue

    const sessionMessages = messagesBySession.get(flaggedMsg.session_id) || []
    const msgIndex = sessionMessages.findIndex(m => m.id === flaggedMsg.id)

    // Get 2 messages before and after
    const before = sessionMessages
      .slice(Math.max(0, msgIndex - 2), msgIndex)
      .map(m => ({ type: m.type, content: m.content }))
    const after = sessionMessages
      .slice(msgIndex + 1, msgIndex + 3)
      .map(m => ({ type: m.type, content: m.content }))

    result.push({
      id: flaggedMsg.id,
      sessionId: flaggedMsg.session_id,
      type: flaggedMsg.type,
      content: flaggedMsg.content,
      flaggedAt: flaggedMsg.flagged_at,
      problem: {
        id: session.problems.id,
        title: session.problems.title,
        difficulty: session.problems.difficulty,
      },
      context: { before, after },
    })
  }

  return result
}
