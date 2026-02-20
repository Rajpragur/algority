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
