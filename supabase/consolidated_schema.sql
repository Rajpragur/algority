-- Algority Database Schema
-- Run this in Supabase SQL Editor to create tables

-- Drop existing tables if re-running
DROP TABLE IF EXISTS problem_patterns CASCADE;
DROP TABLE IF EXISTS problems CASCADE;
DROP TABLE IF EXISTS patterns CASCADE;

-- ============================================
-- PATTERNS TABLE
-- Algorithmic patterns (e.g., "Two Pointers", "Dynamic Programming")
-- ============================================
CREATE TABLE patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_patterns_name ON patterns(name);
CREATE INDEX idx_patterns_slug ON patterns(slug);

-- ============================================
-- PROBLEMS TABLE
-- LeetCode problems with solutions and test cases
-- ============================================
CREATE TABLE problems (
  id INTEGER PRIMARY KEY,                    -- question_id from LeetCode
  task_id TEXT NOT NULL UNIQUE,              -- e.g., "two-sum"
  title TEXT NOT NULL,                       -- e.g., "Two Sum"
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  problem_description TEXT NOT NULL,         -- Full problem text
  starter_code TEXT NOT NULL,                -- Python starter template
  prompt TEXT,                               -- Helper imports/classes for testing
  completion TEXT,                           -- Reference solution
  entry_point TEXT,                          -- e.g., "Solution().twoSum"
  test_code TEXT,                            -- Test function code
  test_cases JSONB,                          -- Structured test data (input_output)
  estimated_date DATE,                       -- When problem was added to LeetCode
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_problems_task_id ON problems(task_id);
CREATE INDEX idx_problems_difficulty ON problems(difficulty);
CREATE INDEX idx_problems_estimated_date ON problems(estimated_date);

-- ============================================
-- PROBLEM_PATTERNS JUNCTION TABLE
-- Many-to-many relationship between problems and patterns
-- ============================================
CREATE TABLE problem_patterns (
  problem_id INTEGER REFERENCES problems(id) ON DELETE CASCADE,
  pattern_id UUID REFERENCES patterns(id) ON DELETE CASCADE,
  PRIMARY KEY (problem_id, pattern_id)
);

CREATE INDEX idx_problem_patterns_pattern_id ON problem_patterns(pattern_id);

-- ============================================
-- ROW LEVEL SECURITY
-- Enable public read access for all tables
-- ============================================
ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_patterns ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Allow public read access to patterns"
  ON patterns FOR SELECT USING (true);

CREATE POLICY "Allow public read access to problems"
  ON problems FOR SELECT USING (true);

CREATE POLICY "Allow public read access to problem_patterns"
  ON problem_patterns FOR SELECT USING (true);

-- Service role insert/update/delete policies (for import script)
CREATE POLICY "Allow service role full access to patterns"
  ON patterns FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access to problems"
  ON problems FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access to problem_patterns"
  ON problem_patterns FOR ALL USING (auth.role() = 'service_role');
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

-- Migration: Add is_initialized column if it doesn't exist
-- ALTER TABLE coaching_sessions ADD COLUMN IF NOT EXISTS is_initialized BOOLEAN NOT NULL DEFAULT FALSE;

-- Migration: Add golden candidate columns (Epic 3 - Story 3.1)
-- ALTER TABLE coaching_sessions ADD COLUMN IF NOT EXISTS is_golden_candidate BOOLEAN DEFAULT FALSE;
-- ALTER TABLE coaching_sessions ADD COLUMN IF NOT EXISTS golden_labels TEXT[] DEFAULT '{}';

-- Coaching messages table
-- Message types:
--   coach: Phase intro messages from AI
--   question: Multiple choice quiz questions
--   user-answer: User's selected options for a quiz
--   feedback: AI feedback on quiz answer
--   user-question: Free-form question from user
--   coach-response: AI response to user question
--   probe-question: Open-ended probe to verify understanding
--   probe-response: Student's free-form answer to probe
--   probe-evaluation: AI evaluation of probe response
--   solution-explanation-prompt: Prompt asking user to explain their solution
--   solution-explanation-response: User's solution explanation
--   solution-explanation-evaluation: AI evaluation of user's explanation
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

-- Migration: Add new message types to existing table
-- ALTER TABLE coaching_messages DROP CONSTRAINT IF EXISTS coaching_messages_type_check;
-- ALTER TABLE coaching_messages ADD CONSTRAINT coaching_messages_type_check
--   CHECK (type IN ('coach', 'question', 'user-answer', 'feedback', 'user-question', 'coach-response'));

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
-- Migration: Add phase transition reasonings storage
-- This stores the LLM's reasoning for each phase transition decision

-- Add JSONB column to store phase reasonings: { phaseId: reasoning }
ALTER TABLE coaching_sessions
ADD COLUMN IF NOT EXISTS phase_transition_reasonings JSONB DEFAULT '{}';

-- Comment for documentation
COMMENT ON COLUMN coaching_sessions.phase_transition_reasonings IS
'Stores LLM reasoning for each completed phase transition. Format: {"understanding": "reasoning...", "solution-building": "reasoning..."}';
-- Add current_phase_reasoning to store the latest LLM assessment for the active phase
-- This gets updated after every evaluateAnswer call, providing continuous feedback

ALTER TABLE coaching_sessions
ADD COLUMN IF NOT EXISTS current_phase_reasoning TEXT;

COMMENT ON COLUMN coaching_sessions.current_phase_reasoning IS 'Latest LLM assessment of user progress in the current phase, updated after each answer evaluation';
-- Migration: Add phase summaries storage for caching
-- This stores LLM-generated summaries of each completed phase to avoid regenerating them

-- Add JSONB column to store phase summaries
ALTER TABLE coaching_sessions
ADD COLUMN IF NOT EXISTS phase_summaries JSONB DEFAULT '{}';

-- Comment for documentation
COMMENT ON COLUMN coaching_sessions.phase_summaries IS
'Cached LLM summaries of completed phases. Format: {"understanding": {"phaseId": "understanding", "conceptsCovered": [...], "summary": "..."}, ...}';
-- Migration: Add user_id to coaching_sessions for user data ownership
-- Story: auth-1-1-database-migration-for-user-ownership
-- Date: 2026-01-09

-- Add nullable user_id column referencing Supabase Auth users
-- Nullable to support brownfield migration (existing sessions have no user)
ALTER TABLE coaching_sessions
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Add index for query performance on user-scoped queries
-- This will be heavily used by RLS policies and data fetching
CREATE INDEX idx_coaching_sessions_user_id ON coaching_sessions(user_id);
-- Migration: Add ON DELETE SET NULL behavior to user_id foreign key
-- Story: auth-1-1-database-migration-for-user-ownership (code review fix)
-- Date: 2026-01-09
--
-- This ensures sessions are preserved (orphaned) when a user is deleted
-- rather than cascading deletion or causing FK constraint errors

-- Drop the existing foreign key constraint
ALTER TABLE coaching_sessions
DROP CONSTRAINT IF EXISTS coaching_sessions_user_id_fkey;

-- Re-add with ON DELETE SET NULL behavior
ALTER TABLE coaching_sessions
ADD CONSTRAINT coaching_sessions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
-- Migration: Enable Row Level Security (RLS) for data isolation
-- Story: auth-1-2-rls-policies-for-data-isolation
-- Date: 2026-01-09
--
-- RLS ensures users can only access their own data:
-- - coaching_sessions: direct ownership via user_id
-- - coaching_messages: indirect ownership via session's user_id
--
-- Behavior:
-- - Unauthenticated users (auth.uid() = NULL) see no rows
-- - Legacy sessions with user_id = NULL remain hidden (orphaned data)
-- - Service role key bypasses RLS (for CLI tools)

-- ============================================
-- COACHING_SESSIONS: Direct ownership policies
-- ============================================

-- Enable RLS on coaching_sessions
ALTER TABLE coaching_sessions ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can only see their own sessions
CREATE POLICY "Users can select own sessions"
ON coaching_sessions FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: Users can only create sessions for themselves
CREATE POLICY "Users can insert own sessions"
ON coaching_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own sessions
CREATE POLICY "Users can update own sessions"
ON coaching_sessions FOR UPDATE
USING (auth.uid() = user_id);

-- DELETE: Users can only delete their own sessions
CREATE POLICY "Users can delete own sessions"
ON coaching_sessions FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- COACHING_MESSAGES: Indirect ownership policies
-- ============================================

-- Enable RLS on coaching_messages
ALTER TABLE coaching_messages ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can only see messages from their sessions
CREATE POLICY "Users can select messages from own sessions"
ON coaching_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM coaching_sessions
    WHERE coaching_sessions.id = coaching_messages.session_id
    AND coaching_sessions.user_id = auth.uid()
  )
);

-- INSERT: Users can only add messages to their sessions
CREATE POLICY "Users can insert messages to own sessions"
ON coaching_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM coaching_sessions
    WHERE coaching_sessions.id = coaching_messages.session_id
    AND coaching_sessions.user_id = auth.uid()
  )
);

-- UPDATE: Users can only update messages from their sessions
CREATE POLICY "Users can update messages from own sessions"
ON coaching_messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM coaching_sessions
    WHERE coaching_sessions.id = coaching_messages.session_id
    AND coaching_sessions.user_id = auth.uid()
  )
);

-- DELETE: Users can only delete messages from their sessions
CREATE POLICY "Users can delete messages from own sessions"
ON coaching_messages FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM coaching_sessions
    WHERE coaching_sessions.id = coaching_messages.session_id
    AND coaching_sessions.user_id = auth.uid()
  )
);

-- ============================================
-- PERFORMANCE INDEX
-- ============================================

-- Index on session_id for RLS policy performance
-- The EXISTS subqueries in coaching_messages policies join on session_id
CREATE INDEX IF NOT EXISTS idx_coaching_messages_session_id ON coaching_messages(session_id);
-- Problem Sets: Curated problem collections (Blind 75, Grind 75, NeetCode 150)
-- =============================================================================

-- Problem Sets table - stores metadata about each curated list
CREATE TABLE IF NOT EXISTS problem_sets (
  id TEXT PRIMARY KEY,                    -- e.g., 'blind-75', 'grind-75', 'neetcode-150'
  name TEXT NOT NULL,                     -- Display name: "Blind 75"
  description TEXT,                       -- Brief description of the problem set
  source_url TEXT,                        -- Original source URL for attribution
  problem_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction table mapping problems to problem sets with ordering
CREATE TABLE IF NOT EXISTS problem_set_problems (
  problem_set_id TEXT REFERENCES problem_sets(id) ON DELETE CASCADE,
  problem_id INTEGER REFERENCES problems(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,              -- Order within the set (1-based)
  category TEXT,                          -- Category within the set (e.g., "Arrays & Hashing")
  PRIMARY KEY (problem_set_id, problem_id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_problem_set_problems_set_id ON problem_set_problems(problem_set_id);
CREATE INDEX IF NOT EXISTS idx_problem_set_problems_problem_id ON problem_set_problems(problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_set_problems_position ON problem_set_problems(problem_set_id, position);

-- Row Level Security
ALTER TABLE problem_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_set_problems ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Allow public read access to problem_sets"
  ON problem_sets FOR SELECT USING (true);

CREATE POLICY "Allow public read access to problem_set_problems"
  ON problem_set_problems FOR SELECT USING (true);

-- Service role full access (for data population)
CREATE POLICY "Allow service role full access to problem_sets"
  ON problem_sets FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access to problem_set_problems"
  ON problem_set_problems FOR ALL USING (auth.role() = 'service_role');
-- Problem Sets Data Population
-- Maps problems to curated problem sets (Blind 75, Grind 75, NeetCode 150)
-- =============================================================================
-- NOTE: This migration only inserts mappings for problems that exist in your database.
-- Premium LeetCode problems (like 271, 261, 269, 252, 253, 286, 323) are skipped if not present.

-- Insert Problem Sets
INSERT INTO problem_sets (id, name, description, source_url, problem_count) VALUES
  ('blind-75', 'Blind 75', 'The original curated list of 75 essential coding interview questions by Yangshun Tay. A focused set covering the most common patterns.', 'https://www.teamblind.com/post/new-year-gift-curated-list-of-top-75-leetcode-questions-to-save-your-time-oam1oreu', 75),
  ('grind-75', 'Grind 75', 'An updated and improved version of Blind 75 with better problem selection and structured weekly schedule. Created by the same author.', 'https://www.techinterviewhandbook.org/grind75/', 75),
  ('neetcode-150', 'NeetCode 150', 'The Blind 75 plus 75 additional problems for comprehensive interview preparation. Includes video solutions for every problem.', 'https://neetcode.io/practice', 150)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  source_url = EXCLUDED.source_url,
  problem_count = EXCLUDED.problem_count;

-- =============================================================================
-- BLIND 75 PROBLEMS
-- Uses INSERT ... SELECT to only add mappings for problems that exist
-- =============================================================================

INSERT INTO problem_set_problems (problem_set_id, problem_id, position, category)
SELECT 'blind-75', id, position, category
FROM (VALUES
  -- Arrays & Hashing
  (1, 1, 'Arrays & Hashing'),      -- Two Sum
  (217, 2, 'Arrays & Hashing'),    -- Contains Duplicate
  (242, 3, 'Arrays & Hashing'),    -- Valid Anagram
  (49, 4, 'Arrays & Hashing'),     -- Group Anagrams
  (347, 5, 'Arrays & Hashing'),    -- Top K Frequent Elements
  (238, 6, 'Arrays & Hashing'),    -- Product of Array Except Self
  (128, 7, 'Arrays & Hashing'),    -- Longest Consecutive Sequence
  (271, 8, 'Arrays & Hashing'),    -- Encode and Decode Strings (Premium)
  (36, 9, 'Arrays & Hashing'),     -- Valid Sudoku
  -- Two Pointers
  (125, 10, 'Two Pointers'),       -- Valid Palindrome
  (15, 11, 'Two Pointers'),        -- 3Sum
  (11, 12, 'Two Pointers'),        -- Container With Most Water
  (167, 13, 'Two Pointers'),       -- Two Sum II
  (42, 14, 'Two Pointers'),        -- Trapping Rain Water
  -- Sliding Window
  (121, 15, 'Sliding Window'),     -- Best Time to Buy and Sell Stock
  (3, 16, 'Sliding Window'),       -- Longest Substring Without Repeating Characters
  (424, 17, 'Sliding Window'),     -- Longest Repeating Character Replacement
  (76, 18, 'Sliding Window'),      -- Minimum Window Substring
  -- Stack
  (20, 19, 'Stack'),               -- Valid Parentheses
  (155, 20, 'Stack'),              -- Min Stack
  (150, 21, 'Stack'),              -- Evaluate Reverse Polish Notation
  (84, 22, 'Stack'),               -- Largest Rectangle in Histogram
  -- Binary Search
  (704, 23, 'Binary Search'),      -- Binary Search
  (33, 24, 'Binary Search'),       -- Search in Rotated Sorted Array
  (153, 25, 'Binary Search'),      -- Find Minimum in Rotated Sorted Array
  (981, 26, 'Binary Search'),      -- Time Based Key-Value Store
  (4, 27, 'Binary Search'),        -- Median of Two Sorted Arrays
  -- Linked List
  (206, 28, 'Linked List'),        -- Reverse Linked List
  (21, 29, 'Linked List'),         -- Merge Two Sorted Lists
  (143, 30, 'Linked List'),        -- Reorder List
  (19, 31, 'Linked List'),         -- Remove Nth Node From End of List
  (141, 32, 'Linked List'),        -- Linked List Cycle
  (23, 33, 'Linked List'),         -- Merge k Sorted Lists
  -- Trees
  (226, 34, 'Trees'),              -- Invert Binary Tree
  (104, 35, 'Trees'),              -- Maximum Depth of Binary Tree
  (100, 36, 'Trees'),              -- Same Tree
  (572, 37, 'Trees'),              -- Subtree of Another Tree
  (235, 38, 'Trees'),              -- Lowest Common Ancestor of a BST
  (102, 39, 'Trees'),              -- Binary Tree Level Order Traversal
  (98, 40, 'Trees'),               -- Validate Binary Search Tree
  (230, 41, 'Trees'),              -- Kth Smallest Element in a BST
  (105, 42, 'Trees'),              -- Construct Binary Tree from Preorder and Inorder
  (124, 43, 'Trees'),              -- Binary Tree Maximum Path Sum
  (297, 44, 'Trees'),              -- Serialize and Deserialize Binary Tree
  -- Tries
  (208, 45, 'Tries'),              -- Implement Trie
  (211, 46, 'Tries'),              -- Design Add and Search Words Data Structure
  (212, 47, 'Tries'),              -- Word Search II
  -- Heap
  (295, 48, 'Heap'),               -- Find Median from Data Stream
  -- Backtracking
  (39, 49, 'Backtracking'),        -- Combination Sum
  (79, 50, 'Backtracking'),        -- Word Search
  -- Graphs
  (200, 51, 'Graphs'),             -- Number of Islands
  (133, 52, 'Graphs'),             -- Clone Graph
  (417, 53, 'Graphs'),             -- Pacific Atlantic Water Flow
  (207, 54, 'Graphs'),             -- Course Schedule
  (323, 55, 'Graphs'),             -- Number of Connected Components (Premium)
  (261, 56, 'Graphs'),             -- Graph Valid Tree (Premium)
  (269, 57, 'Graphs'),             -- Alien Dictionary (Premium)
  (127, 58, 'Graphs'),             -- Word Ladder
  -- Dynamic Programming
  (70, 59, 'Dynamic Programming'),    -- Climbing Stairs
  (198, 60, 'Dynamic Programming'),   -- House Robber
  (213, 61, 'Dynamic Programming'),   -- House Robber II
  (5, 62, 'Dynamic Programming'),     -- Longest Palindromic Substring
  (647, 63, 'Dynamic Programming'),   -- Palindromic Substrings
  (91, 64, 'Dynamic Programming'),    -- Decode Ways
  (322, 65, 'Dynamic Programming'),   -- Coin Change
  (152, 66, 'Dynamic Programming'),   -- Maximum Product Subarray
  (139, 67, 'Dynamic Programming'),   -- Word Break
  (300, 68, 'Dynamic Programming'),   -- Longest Increasing Subsequence
  (1143, 69, 'Dynamic Programming'),  -- Longest Common Subsequence
  -- Intervals
  (57, 70, 'Intervals'),           -- Insert Interval
  (56, 71, 'Intervals'),           -- Merge Intervals
  (435, 72, 'Intervals'),          -- Non-overlapping Intervals
  (252, 73, 'Intervals'),          -- Meeting Rooms (Premium)
  (253, 74, 'Intervals'),          -- Meeting Rooms II (Premium)
  -- Math & Geometry
  (48, 75, 'Math & Geometry'),     -- Rotate Image
  (54, 76, 'Math & Geometry'),     -- Spiral Matrix
  (73, 77, 'Math & Geometry')      -- Set Matrix Zeroes
) AS v(id, position, category)
WHERE EXISTS (SELECT 1 FROM problems p WHERE p.id = v.id)
ON CONFLICT (problem_set_id, problem_id) DO NOTHING;

-- =============================================================================
-- GRIND 75 PROBLEMS
-- =============================================================================

INSERT INTO problem_set_problems (problem_set_id, problem_id, position, category)
SELECT 'grind-75', id, position, category
FROM (VALUES
  -- Week 1-2: Easy problems
  (1, 1, 'Week 1'),                -- Two Sum
  (20, 2, 'Week 1'),               -- Valid Parentheses
  (21, 3, 'Week 1'),               -- Merge Two Sorted Lists
  (121, 4, 'Week 1'),              -- Best Time to Buy and Sell Stock
  (125, 5, 'Week 1'),              -- Valid Palindrome
  (226, 6, 'Week 1'),              -- Invert Binary Tree
  (242, 7, 'Week 1'),              -- Valid Anagram
  (704, 8, 'Week 1'),              -- Binary Search
  (733, 9, 'Week 1'),              -- Flood Fill
  (235, 10, 'Week 1'),             -- Lowest Common Ancestor of BST
  (110, 11, 'Week 1'),             -- Balanced Binary Tree
  (141, 12, 'Week 1'),             -- Linked List Cycle
  (232, 13, 'Week 1'),             -- Implement Queue using Stacks
  (278, 14, 'Week 2'),             -- First Bad Version
  (383, 15, 'Week 2'),             -- Ransom Note
  (70, 16, 'Week 2'),              -- Climbing Stairs
  (409, 17, 'Week 2'),             -- Longest Palindrome
  (206, 18, 'Week 2'),             -- Reverse Linked List
  (169, 19, 'Week 2'),             -- Majority Element
  (67, 20, 'Week 2'),              -- Add Binary
  (543, 21, 'Week 2'),             -- Diameter of Binary Tree
  (876, 22, 'Week 2'),             -- Middle of the Linked List
  (104, 23, 'Week 2'),             -- Maximum Depth of Binary Tree
  (217, 24, 'Week 2'),             -- Contains Duplicate
  (53, 25, 'Week 2'),              -- Maximum Subarray
  -- Week 3-4: Medium problems
  (57, 26, 'Week 3'),              -- Insert Interval
  (542, 27, 'Week 3'),             -- 01 Matrix
  (973, 28, 'Week 3'),             -- K Closest Points to Origin
  (3, 29, 'Week 3'),               -- Longest Substring Without Repeating Characters
  (15, 30, 'Week 3'),              -- 3Sum
  (102, 31, 'Week 3'),             -- Binary Tree Level Order Traversal
  (133, 32, 'Week 3'),             -- Clone Graph
  (150, 33, 'Week 3'),             -- Evaluate Reverse Polish Notation
  (207, 34, 'Week 3'),             -- Course Schedule
  (208, 35, 'Week 3'),             -- Implement Trie
  (322, 36, 'Week 4'),             -- Coin Change
  (238, 37, 'Week 4'),             -- Product of Array Except Self
  (155, 38, 'Week 4'),             -- Min Stack
  (98, 39, 'Week 4'),              -- Validate Binary Search Tree
  (200, 40, 'Week 4'),             -- Number of Islands
  (994, 41, 'Week 4'),             -- Rotting Oranges
  (33, 42, 'Week 4'),              -- Search in Rotated Sorted Array
  (39, 43, 'Week 4'),              -- Combination Sum
  (46, 44, 'Week 4'),              -- Permutations
  (56, 45, 'Week 4'),              -- Merge Intervals
  (236, 46, 'Week 4'),             -- Lowest Common Ancestor of Binary Tree
  (981, 47, 'Week 4'),             -- Time Based Key-Value Store
  (721, 48, 'Week 4'),             -- Accounts Merge
  (75, 49, 'Week 4'),              -- Sort Colors
  (139, 50, 'Week 4'),             -- Word Break
  -- Week 5-6: More Medium problems
  (416, 51, 'Week 5'),             -- Partition Equal Subset Sum
  (8, 52, 'Week 5'),               -- String to Integer (atoi)
  (54, 53, 'Week 5'),              -- Spiral Matrix
  (78, 54, 'Week 5'),              -- Subsets
  (199, 55, 'Week 5'),             -- Binary Tree Right Side View
  (5, 56, 'Week 5'),               -- Longest Palindromic Substring
  (62, 57, 'Week 5'),              -- Unique Paths
  (105, 58, 'Week 5'),             -- Construct Binary Tree from Preorder and Inorder
  (11, 59, 'Week 6'),              -- Container With Most Water
  (17, 60, 'Week 6'),              -- Letter Combinations of a Phone Number
  (79, 61, 'Week 6'),              -- Word Search
  (438, 62, 'Week 6'),             -- Find All Anagrams in a String
  (310, 63, 'Week 6'),             -- Minimum Height Trees
  (621, 64, 'Week 6'),             -- Task Scheduler
  (146, 65, 'Week 6'),             -- LRU Cache
  -- Week 7-8: Hard problems
  (230, 66, 'Week 7'),             -- Kth Smallest Element in a BST
  (76, 67, 'Week 7'),              -- Minimum Window Substring
  (297, 68, 'Week 7'),             -- Serialize and Deserialize Binary Tree
  (42, 69, 'Week 7'),              -- Trapping Rain Water
  (295, 70, 'Week 8'),             -- Find Median from Data Stream
  (127, 71, 'Week 8'),             -- Word Ladder
  (224, 72, 'Week 8'),             -- Basic Calculator
  (1235, 73, 'Week 8'),            -- Maximum Profit in Job Scheduling
  (23, 74, 'Week 8'),              -- Merge k Sorted Lists
  (84, 75, 'Week 8')               -- Largest Rectangle in Histogram
) AS v(id, position, category)
WHERE EXISTS (SELECT 1 FROM problems p WHERE p.id = v.id)
ON CONFLICT (problem_set_id, problem_id) DO NOTHING;

-- =============================================================================
-- NEETCODE 150 PROBLEMS
-- =============================================================================

INSERT INTO problem_set_problems (problem_set_id, problem_id, position, category)
SELECT 'neetcode-150', id, position, category
FROM (VALUES
  -- Arrays & Hashing
  (217, 1, 'Arrays & Hashing'),    -- Contains Duplicate
  (242, 2, 'Arrays & Hashing'),    -- Valid Anagram
  (1, 3, 'Arrays & Hashing'),      -- Two Sum
  (49, 4, 'Arrays & Hashing'),     -- Group Anagrams
  (347, 5, 'Arrays & Hashing'),    -- Top K Frequent Elements
  (238, 6, 'Arrays & Hashing'),    -- Product of Array Except Self
  (36, 7, 'Arrays & Hashing'),     -- Valid Sudoku
  (271, 8, 'Arrays & Hashing'),    -- Encode and Decode Strings (Premium)
  (128, 9, 'Arrays & Hashing'),    -- Longest Consecutive Sequence
  -- Two Pointers
  (125, 10, 'Two Pointers'),       -- Valid Palindrome
  (167, 11, 'Two Pointers'),       -- Two Sum II
  (15, 12, 'Two Pointers'),        -- 3Sum
  (11, 13, 'Two Pointers'),        -- Container With Most Water
  (42, 14, 'Two Pointers'),        -- Trapping Rain Water
  -- Sliding Window
  (121, 15, 'Sliding Window'),     -- Best Time to Buy and Sell Stock
  (3, 16, 'Sliding Window'),       -- Longest Substring Without Repeating Characters
  (424, 17, 'Sliding Window'),     -- Longest Repeating Character Replacement
  (567, 18, 'Sliding Window'),     -- Permutation in String
  (76, 19, 'Sliding Window'),      -- Minimum Window Substring
  (239, 20, 'Sliding Window'),     -- Sliding Window Maximum
  -- Stack
  (20, 21, 'Stack'),               -- Valid Parentheses
  (155, 22, 'Stack'),              -- Min Stack
  (150, 23, 'Stack'),              -- Evaluate Reverse Polish Notation
  (22, 24, 'Stack'),               -- Generate Parentheses
  (739, 25, 'Stack'),              -- Daily Temperatures
  (853, 26, 'Stack'),              -- Car Fleet
  (84, 27, 'Stack'),               -- Largest Rectangle in Histogram
  -- Binary Search
  (704, 28, 'Binary Search'),      -- Binary Search
  (74, 29, 'Binary Search'),       -- Search a 2D Matrix
  (875, 30, 'Binary Search'),      -- Koko Eating Bananas
  (33, 31, 'Binary Search'),       -- Search in Rotated Sorted Array
  (153, 32, 'Binary Search'),      -- Find Minimum in Rotated Sorted Array
  (981, 33, 'Binary Search'),      -- Time Based Key-Value Store
  (4, 34, 'Binary Search'),        -- Median of Two Sorted Arrays
  -- Linked List
  (206, 35, 'Linked List'),        -- Reverse Linked List
  (21, 36, 'Linked List'),         -- Merge Two Sorted Lists
  (143, 37, 'Linked List'),        -- Reorder List
  (19, 38, 'Linked List'),         -- Remove Nth Node From End of List
  (138, 39, 'Linked List'),        -- Copy List with Random Pointer
  (2, 40, 'Linked List'),          -- Add Two Numbers
  (141, 41, 'Linked List'),        -- Linked List Cycle
  (287, 42, 'Linked List'),        -- Find the Duplicate Number
  (146, 43, 'Linked List'),        -- LRU Cache
  (23, 44, 'Linked List'),         -- Merge k Sorted Lists
  (25, 45, 'Linked List'),         -- Reverse Nodes in k-Group
  -- Trees
  (226, 46, 'Trees'),              -- Invert Binary Tree
  (104, 47, 'Trees'),              -- Maximum Depth of Binary Tree
  (543, 48, 'Trees'),              -- Diameter of Binary Tree
  (110, 49, 'Trees'),              -- Balanced Binary Tree
  (100, 50, 'Trees'),              -- Same Tree
  (572, 51, 'Trees'),              -- Subtree of Another Tree
  (235, 52, 'Trees'),              -- Lowest Common Ancestor of a BST
  (102, 53, 'Trees'),              -- Binary Tree Level Order Traversal
  (199, 54, 'Trees'),              -- Binary Tree Right Side View
  (1448, 55, 'Trees'),             -- Count Good Nodes in Binary Tree
  (98, 56, 'Trees'),               -- Validate Binary Search Tree
  (230, 57, 'Trees'),              -- Kth Smallest Element in a BST
  (105, 58, 'Trees'),              -- Construct Binary Tree from Preorder and Inorder
  (124, 59, 'Trees'),              -- Binary Tree Maximum Path Sum
  (297, 60, 'Trees'),              -- Serialize and Deserialize Binary Tree
  -- Heap / Priority Queue
  (703, 61, 'Heap'),               -- Kth Largest Element in a Stream
  (1046, 62, 'Heap'),              -- Last Stone Weight
  (973, 63, 'Heap'),               -- K Closest Points to Origin
  (215, 64, 'Heap'),               -- Kth Largest Element in an Array
  (621, 65, 'Heap'),               -- Task Scheduler
  (355, 66, 'Heap'),               -- Design Twitter
  (295, 67, 'Heap'),               -- Find Median from Data Stream
  -- Backtracking
  (78, 68, 'Backtracking'),        -- Subsets
  (39, 69, 'Backtracking'),        -- Combination Sum
  (46, 70, 'Backtracking'),        -- Permutations
  (90, 71, 'Backtracking'),        -- Subsets II
  (40, 72, 'Backtracking'),        -- Combination Sum II
  (79, 73, 'Backtracking'),        -- Word Search
  (131, 74, 'Backtracking'),       -- Palindrome Partitioning
  (17, 75, 'Backtracking'),        -- Letter Combinations of a Phone Number
  (51, 76, 'Backtracking'),        -- N-Queens
  -- Tries
  (208, 77, 'Tries'),              -- Implement Trie
  (211, 78, 'Tries'),              -- Design Add and Search Words Data Structure
  (212, 79, 'Tries'),              -- Word Search II
  -- Graphs
  (200, 80, 'Graphs'),             -- Number of Islands
  (133, 81, 'Graphs'),             -- Clone Graph
  (695, 82, 'Graphs'),             -- Max Area of Island
  (417, 83, 'Graphs'),             -- Pacific Atlantic Water Flow
  (130, 84, 'Graphs'),             -- Surrounded Regions
  (994, 85, 'Graphs'),             -- Rotting Oranges
  (286, 86, 'Graphs'),             -- Walls and Gates (Premium)
  (207, 87, 'Graphs'),             -- Course Schedule
  (210, 88, 'Graphs'),             -- Course Schedule II
  (684, 89, 'Graphs'),             -- Redundant Connection
  (323, 90, 'Graphs'),             -- Number of Connected Components (Premium)
  (261, 91, 'Graphs'),             -- Graph Valid Tree (Premium)
  (127, 92, 'Graphs'),             -- Word Ladder
  -- Advanced Graphs
  (332, 93, 'Advanced Graphs'),    -- Reconstruct Itinerary
  (1584, 94, 'Advanced Graphs'),   -- Min Cost to Connect All Points
  (743, 95, 'Advanced Graphs'),    -- Network Delay Time
  (778, 96, 'Advanced Graphs'),    -- Swim in Rising Water
  (269, 97, 'Advanced Graphs'),    -- Alien Dictionary (Premium)
  (787, 98, 'Advanced Graphs'),    -- Cheapest Flights Within K Stops
  -- 1-D Dynamic Programming
  (70, 99, '1-D DP'),              -- Climbing Stairs
  (746, 100, '1-D DP'),            -- Min Cost Climbing Stairs
  (198, 101, '1-D DP'),            -- House Robber
  (213, 102, '1-D DP'),            -- House Robber II
  (5, 103, '1-D DP'),              -- Longest Palindromic Substring
  (647, 104, '1-D DP'),            -- Palindromic Substrings
  (91, 105, '1-D DP'),             -- Decode Ways
  (322, 106, '1-D DP'),            -- Coin Change
  (152, 107, '1-D DP'),            -- Maximum Product Subarray
  (139, 108, '1-D DP'),            -- Word Break
  (300, 109, '1-D DP'),            -- Longest Increasing Subsequence
  (416, 110, '1-D DP'),            -- Partition Equal Subset Sum
  -- 2-D Dynamic Programming
  (62, 111, '2-D DP'),             -- Unique Paths
  (1143, 112, '2-D DP'),           -- Longest Common Subsequence
  (309, 113, '2-D DP'),            -- Best Time to Buy and Sell Stock with Cooldown
  (518, 114, '2-D DP'),            -- Coin Change II
  (494, 115, '2-D DP'),            -- Target Sum
  (97, 116, '2-D DP'),             -- Interleaving String
  (329, 117, '2-D DP'),            -- Longest Increasing Path in a Matrix
  (115, 118, '2-D DP'),            -- Distinct Subsequences
  (72, 119, '2-D DP'),             -- Edit Distance
  (312, 120, '2-D DP'),            -- Burst Balloons
  (10, 121, '2-D DP'),             -- Regular Expression Matching
  -- Greedy
  (53, 122, 'Greedy'),             -- Maximum Subarray
  (55, 123, 'Greedy'),             -- Jump Game
  (45, 124, 'Greedy'),             -- Jump Game II
  (134, 125, 'Greedy'),            -- Gas Station
  (846, 126, 'Greedy'),            -- Hand of Straights
  (1899, 127, 'Greedy'),           -- Merge Triplets to Form Target Triplet
  (763, 128, 'Greedy'),            -- Partition Labels
  (678, 129, 'Greedy'),            -- Valid Parenthesis String
  -- Intervals
  (57, 130, 'Intervals'),          -- Insert Interval
  (56, 131, 'Intervals'),          -- Merge Intervals
  (435, 132, 'Intervals'),         -- Non-overlapping Intervals
  (252, 133, 'Intervals'),         -- Meeting Rooms (Premium)
  (253, 134, 'Intervals'),         -- Meeting Rooms II (Premium)
  (1851, 135, 'Intervals'),        -- Minimum Interval to Include Each Query
  -- Math & Geometry
  (48, 136, 'Math & Geometry'),    -- Rotate Image
  (54, 137, 'Math & Geometry'),    -- Spiral Matrix
  (73, 138, 'Math & Geometry'),    -- Set Matrix Zeroes
  (202, 139, 'Math & Geometry'),   -- Happy Number
  (66, 140, 'Math & Geometry'),    -- Plus One
  (50, 141, 'Math & Geometry'),    -- Pow(x, n)
  (43, 142, 'Math & Geometry'),    -- Multiply Strings
  (2013, 143, 'Math & Geometry'),  -- Detect Squares
  -- Bit Manipulation
  (136, 144, 'Bit Manipulation'),  -- Single Number
  (191, 145, 'Bit Manipulation'),  -- Number of 1 Bits
  (338, 146, 'Bit Manipulation'),  -- Counting Bits
  (190, 147, 'Bit Manipulation'),  -- Reverse Bits
  (268, 148, 'Bit Manipulation'),  -- Missing Number
  (371, 149, 'Bit Manipulation'),  -- Sum of Two Integers
  (7, 150, 'Bit Manipulation')     -- Reverse Integer
) AS v(id, position, category)
WHERE EXISTS (SELECT 1 FROM problems p WHERE p.id = v.id)
ON CONFLICT (problem_set_id, problem_id) DO NOTHING;

-- =============================================================================
-- Update problem counts based on actual mappings
-- =============================================================================

UPDATE problem_sets SET problem_count = (
  SELECT COUNT(*) FROM problem_set_problems WHERE problem_set_id = problem_sets.id
);
-- Add columns for pre-generated question caching
-- This enables generating the next question while the student is still reading/answering the current one

ALTER TABLE coaching_sessions
ADD COLUMN IF NOT EXISTS cached_next_question JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cached_question_phase TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN coaching_sessions.cached_next_question IS 'Pre-generated next question to reduce latency. Stored as QuestionMessage JSON.';
COMMENT ON COLUMN coaching_sessions.cached_question_phase IS 'Phase the cached question belongs to. Used to invalidate cache on phase transition.';
