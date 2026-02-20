-- Migration: Add phase summaries storage for caching
-- This stores LLM-generated summaries of each completed phase to avoid regenerating them

-- Add JSONB column to store phase summaries
ALTER TABLE coaching_sessions
ADD COLUMN IF NOT EXISTS phase_summaries JSONB DEFAULT '{}';

-- Comment for documentation
COMMENT ON COLUMN coaching_sessions.phase_summaries IS
'Cached LLM summaries of completed phases. Format: {"understanding": {"phaseId": "understanding", "conceptsCovered": [...], "summary": "..."}, ...}';
