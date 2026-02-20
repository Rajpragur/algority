-- Migration: Add review status columns to coaching_sessions
-- Story: 4.8 Review and Approve Contributed Examples

-- Add review_status enum column (pending/approved/rejected)
ALTER TABLE coaching_sessions
ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'pending'
CHECK (review_status IN ('pending', 'approved', 'rejected'));

-- Add review_notes for developer feedback
ALTER TABLE coaching_sessions
ADD COLUMN IF NOT EXISTS review_notes TEXT;

-- Add reviewed_at timestamp
ALTER TABLE coaching_sessions
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Index for efficient querying of pending reviews
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_pending_review
ON coaching_sessions(review_status, is_golden_candidate)
WHERE is_golden_candidate = TRUE AND review_status = 'pending';

COMMENT ON COLUMN coaching_sessions.review_status IS 'Review status for golden candidate submissions (pending/approved/rejected)';
COMMENT ON COLUMN coaching_sessions.review_notes IS 'Developer notes from review (especially rejection reasons)';
COMMENT ON COLUMN coaching_sessions.reviewed_at IS 'Timestamp when developer reviewed the submission';
