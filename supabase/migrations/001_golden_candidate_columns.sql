-- Migration: Add golden candidate columns to coaching_sessions
-- Run this in Supabase SQL Editor to enable golden dataset flagging

-- Add is_golden_candidate boolean column
ALTER TABLE coaching_sessions
ADD COLUMN IF NOT EXISTS is_golden_candidate BOOLEAN DEFAULT FALSE;

-- Add golden_labels text array column for categorization
ALTER TABLE coaching_sessions
ADD COLUMN IF NOT EXISTS golden_labels TEXT[] DEFAULT '{}';

-- Create index for efficient querying of golden candidates
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_golden_candidate
ON coaching_sessions(is_golden_candidate)
WHERE is_golden_candidate = TRUE;
