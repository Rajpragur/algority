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
