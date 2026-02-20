-- Migration: Add flagging columns to coaching_messages
-- Story: 4.5 User Feedback Flag Button

ALTER TABLE coaching_messages
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMPTZ;

-- Index for efficient querying of flagged messages
CREATE INDEX IF NOT EXISTS idx_coaching_messages_flagged
ON coaching_messages(is_flagged)
WHERE is_flagged = TRUE;

COMMENT ON COLUMN coaching_messages.is_flagged IS 'User flagged this message as unhelpful';
COMMENT ON COLUMN coaching_messages.flagged_at IS 'Timestamp when user flagged this message';
