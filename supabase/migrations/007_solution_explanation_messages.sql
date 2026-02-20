-- Migration: Add "You Explain It" phase message types
-- Story 3.1 & 3.2: Solution explanation messages

-- Drop the existing constraint and add new one with additional types
ALTER TABLE coaching_messages DROP CONSTRAINT IF EXISTS coaching_messages_type_check;
ALTER TABLE coaching_messages ADD CONSTRAINT coaching_messages_type_check
  CHECK (type IN (
    'coach',
    'question',
    'user-answer',
    'feedback',
    'user-question',
    'coach-response',
    'probe-question',
    'probe-response',
    'probe-evaluation',
    'solution-explanation-prompt',
    'solution-explanation-response',
    'solution-explanation-evaluation'
  ));

-- Add columns for solution explanation evaluation
ALTER TABLE coaching_messages ADD COLUMN IF NOT EXISTS completeness_score NUMERIC(3,2);
ALTER TABLE coaching_messages ADD COLUMN IF NOT EXISTS covered_areas TEXT[];
ALTER TABLE coaching_messages ADD COLUMN IF NOT EXISTS missing_areas TEXT[];

-- Add comment for documentation
COMMENT ON COLUMN coaching_messages.completeness_score IS 'Score 0-1 for solution explanation completeness';
COMMENT ON COLUMN coaching_messages.covered_areas IS 'Areas covered in explanation (e.g., core-algorithm, complexity-analysis)';
COMMENT ON COLUMN coaching_messages.missing_areas IS 'Areas not adequately covered in explanation';
