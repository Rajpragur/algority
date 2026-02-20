-- Add columns for pre-generated question caching
-- This enables generating the next question while the student is still reading/answering the current one

ALTER TABLE coaching_sessions
ADD COLUMN IF NOT EXISTS cached_next_question JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cached_question_phase TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN coaching_sessions.cached_next_question IS 'Pre-generated next question to reduce latency. Stored as QuestionMessage JSON.';
COMMENT ON COLUMN coaching_sessions.cached_question_phase IS 'Phase the cached question belongs to. Used to invalidate cache on phase transition.';
