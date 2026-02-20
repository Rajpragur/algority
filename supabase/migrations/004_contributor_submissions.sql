-- Migration: Add contributor submission columns to coaching_sessions
-- Story: 4.7 Contributor Golden Dataset Submissions

-- Add contributor_notes for user feedback about the session
ALTER TABLE coaching_sessions
ADD COLUMN IF NOT EXISTS contributor_notes TEXT;

-- Add submitted_as_golden_at timestamp to track when user submitted
ALTER TABLE coaching_sessions
ADD COLUMN IF NOT EXISTS submitted_as_golden_at TIMESTAMPTZ;

COMMENT ON COLUMN coaching_sessions.contributor_notes IS 'User notes explaining why this session is a good/bad example';
COMMENT ON COLUMN coaching_sessions.submitted_as_golden_at IS 'Timestamp when user submitted this session as golden candidate';
