-- Migration: Create eval_sample_queue table for production sampling
-- Story: 4.1 Production Sampling Configuration

CREATE TABLE IF NOT EXISTS eval_sample_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES coaching_sessions(id) ON DELETE CASCADE,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  UNIQUE(session_id)
);

-- Index for efficient status-based queries
CREATE INDEX IF NOT EXISTS idx_eval_sample_queue_status ON eval_sample_queue(status);

-- Index for session lookups
CREATE INDEX IF NOT EXISTS idx_eval_sample_queue_session ON eval_sample_queue(session_id);

-- Index for processing order (oldest pending first)
CREATE INDEX IF NOT EXISTS idx_eval_sample_queue_pending ON eval_sample_queue(queued_at) WHERE status = 'pending';

COMMENT ON TABLE eval_sample_queue IS 'Queue of coaching sessions sampled for background evaluation';
COMMENT ON COLUMN eval_sample_queue.status IS 'pending = awaiting evaluation, processed = evaluation complete, failed = evaluation error';
