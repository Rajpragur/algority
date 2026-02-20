-- Coaching Sessions and Messages Schema
-- Run this in your Supabase SQL Editor

-- Coaching sessions table
CREATE TABLE IF NOT EXISTS coaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  current_phase TEXT NOT NULL DEFAULT 'understanding',
  elapsed_seconds INTEGER NOT NULL DEFAULT 0,
  is_initialized BOOLEAN NOT NULL DEFAULT FALSE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration: Add golden candidate columns (Epic 3 - Story 3.1)
ALTER TABLE coaching_sessions ADD COLUMN IF NOT EXISTS is_golden_candidate BOOLEAN DEFAULT FALSE;
ALTER TABLE coaching_sessions ADD COLUMN IF NOT EXISTS golden_labels TEXT[] DEFAULT '{}';

-- Coaching messages table
CREATE TABLE IF NOT EXISTS coaching_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES coaching_sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('coach', 'question', 'user-answer', 'feedback', 'user-question', 'coach-response', 'probe-question', 'probe-response', 'probe-evaluation', 'solution-explanation-prompt', 'solution-explanation-response', 'solution-explanation-evaluation')),
  phase TEXT NOT NULL,
  content TEXT,
  question_type TEXT CHECK (question_type IN ('single-select', 'multi-select')),
  options JSONB,
  correct_answer JSONB,
  selected_options JSONB,
  is_correct BOOLEAN,
  probe_type TEXT CHECK (probe_type IN ('short-answer', 'explain-reasoning', 'predict-behavior')),
  understanding_level TEXT CHECK (understanding_level IN ('strong', 'partial', 'unclear', 'incorrect')),
  -- Solution explanation evaluation fields
  completeness_score NUMERIC(3,2),
  covered_areas TEXT[],
  missing_areas TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_problem_id ON coaching_sessions(problem_id);
CREATE INDEX IF NOT EXISTS idx_coaching_messages_session_id ON coaching_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_coaching_messages_phase ON coaching_messages(phase);

-- Enable RLS
ALTER TABLE coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_messages ENABLE ROW LEVEL SECURITY;

-- Policies (allow all for now - add user-based policies when auth is added)
CREATE POLICY "Allow all operations on coaching_sessions" ON coaching_sessions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on coaching_messages" ON coaching_messages
  FOR ALL USING (true) WITH CHECK (true);

-- Updated_at trigger for sessions
CREATE OR REPLACE FUNCTION update_coaching_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER coaching_sessions_updated_at
  BEFORE UPDATE ON coaching_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_coaching_session_updated_at();
