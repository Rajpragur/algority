-- Add current_phase_reasoning to store the latest LLM assessment for the active phase
-- This gets updated after every evaluateAnswer call, providing continuous feedback

ALTER TABLE coaching_sessions
ADD COLUMN IF NOT EXISTS current_phase_reasoning TEXT;

COMMENT ON COLUMN coaching_sessions.current_phase_reasoning IS 'Latest LLM assessment of user progress in the current phase, updated after each answer evaluation';
