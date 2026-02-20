-- Migration: Add phase transition reasonings storage
-- This stores the LLM's reasoning for each phase transition decision

-- Add JSONB column to store phase reasonings: { phaseId: reasoning }
ALTER TABLE coaching_sessions
ADD COLUMN IF NOT EXISTS phase_transition_reasonings JSONB DEFAULT '{}';

-- Comment for documentation
COMMENT ON COLUMN coaching_sessions.phase_transition_reasonings IS
'Stores LLM reasoning for each completed phase transition. Format: {"understanding": "reasoning...", "solution-building": "reasoning..."}';
