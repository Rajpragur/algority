-- Add columns for open-ended probe messages
-- probe_type: type of probe question (short-answer, explain-reasoning, predict-behavior)
-- understanding_level: evaluation of student's probe response (strong, partial, unclear, incorrect)

ALTER TABLE coaching_messages
ADD COLUMN IF NOT EXISTS probe_type TEXT;

ALTER TABLE coaching_messages
ADD COLUMN IF NOT EXISTS understanding_level TEXT;

-- Update check constraint to include new probe message types
ALTER TABLE coaching_messages DROP CONSTRAINT IF EXISTS coaching_messages_type_check;
ALTER TABLE coaching_messages ADD CONSTRAINT coaching_messages_type_check
  CHECK (type IN ('coach', 'question', 'user-answer', 'feedback', 'user-question', 'coach-response', 'probe-question', 'probe-response', 'probe-evaluation'));
