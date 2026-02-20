-- Migration: Enable Row Level Security (RLS) for data isolation
-- Story: auth-1-2-rls-policies-for-data-isolation
-- Date: 2026-01-09
--
-- RLS ensures users can only access their own data:
-- - coaching_sessions: direct ownership via user_id
-- - coaching_messages: indirect ownership via session's user_id
--
-- Behavior:
-- - Unauthenticated users (auth.uid() = NULL) see no rows
-- - Legacy sessions with user_id = NULL remain hidden (orphaned data)
-- - Service role key bypasses RLS (for CLI tools)

-- ============================================
-- COACHING_SESSIONS: Direct ownership policies
-- ============================================

-- Enable RLS on coaching_sessions
ALTER TABLE coaching_sessions ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can only see their own sessions
CREATE POLICY "Users can select own sessions"
ON coaching_sessions FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: Users can only create sessions for themselves
CREATE POLICY "Users can insert own sessions"
ON coaching_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own sessions
CREATE POLICY "Users can update own sessions"
ON coaching_sessions FOR UPDATE
USING (auth.uid() = user_id);

-- DELETE: Users can only delete their own sessions
CREATE POLICY "Users can delete own sessions"
ON coaching_sessions FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- COACHING_MESSAGES: Indirect ownership policies
-- ============================================

-- Enable RLS on coaching_messages
ALTER TABLE coaching_messages ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can only see messages from their sessions
CREATE POLICY "Users can select messages from own sessions"
ON coaching_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM coaching_sessions
    WHERE coaching_sessions.id = coaching_messages.session_id
    AND coaching_sessions.user_id = auth.uid()
  )
);

-- INSERT: Users can only add messages to their sessions
CREATE POLICY "Users can insert messages to own sessions"
ON coaching_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM coaching_sessions
    WHERE coaching_sessions.id = coaching_messages.session_id
    AND coaching_sessions.user_id = auth.uid()
  )
);

-- UPDATE: Users can only update messages from their sessions
CREATE POLICY "Users can update messages from own sessions"
ON coaching_messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM coaching_sessions
    WHERE coaching_sessions.id = coaching_messages.session_id
    AND coaching_sessions.user_id = auth.uid()
  )
);

-- DELETE: Users can only delete messages from their sessions
CREATE POLICY "Users can delete messages from own sessions"
ON coaching_messages FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM coaching_sessions
    WHERE coaching_sessions.id = coaching_messages.session_id
    AND coaching_sessions.user_id = auth.uid()
  )
);

-- ============================================
-- PERFORMANCE INDEX
-- ============================================

-- Index on session_id for RLS policy performance
-- The EXISTS subqueries in coaching_messages policies join on session_id
CREATE INDEX IF NOT EXISTS idx_coaching_messages_session_id ON coaching_messages(session_id);
