# Data Models

> Database schema and TypeScript type definitions

## Database Schema

### Entity Relationship Diagram

```
┌─────────────┐       ┌──────────────────┐       ┌─────────────┐
│   patterns  │       │ problem_patterns │       │  problems   │
├─────────────┤       ├──────────────────┤       ├─────────────┤
│ id (UUID)   │◄──────│ pattern_id       │       │ id (INT)    │
│ name        │       │ problem_id       │──────►│ task_id     │
│ slug        │       └──────────────────┘       │ title       │
│ description │                                  │ difficulty  │
└─────────────┘                                  │ description │
                                                 └──────┬──────┘
                                                        │
                                                        ▼
                              ┌───────────────────────────────────────┐
                              │         coaching_sessions             │
                              ├───────────────────────────────────────┤
                              │ id (UUID)                             │
                              │ problem_id ────────────────────────►  │
                              │ current_phase                         │
                              │ elapsed_seconds                       │
                              │ is_initialized                        │
                              │ started_at, completed_at              │
                              └───────────────────┬───────────────────┘
                                                  │
                                                  ▼
                              ┌───────────────────────────────────────┐
                              │         coaching_messages             │
                              ├───────────────────────────────────────┤
                              │ id (UUID)                             │
                              │ session_id ───────────────────────►   │
                              │ type (coach|question|feedback|...)    │
                              │ phase                                 │
                              │ content, options, correct_answer...   │
                              └───────────────────────────────────────┘
```

---

## Table Definitions

### patterns

Algorithmic patterns (e.g., "Two Pointers", "Dynamic Programming").

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `name` | TEXT | NOT NULL, UNIQUE |
| `slug` | TEXT | NOT NULL, UNIQUE |
| `description` | TEXT | nullable |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() |

---

### problems

LeetCode problems with solutions and test cases.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INTEGER | PRIMARY KEY (LeetCode question_id) |
| `task_id` | TEXT | NOT NULL, UNIQUE (e.g., "two-sum") |
| `title` | TEXT | NOT NULL |
| `difficulty` | TEXT | CHECK (IN 'Easy', 'Medium', 'Hard') |
| `problem_description` | TEXT | NOT NULL |
| `starter_code` | TEXT | NOT NULL |
| `prompt` | TEXT | nullable |
| `completion` | TEXT | nullable (reference solution) |
| `entry_point` | TEXT | nullable |
| `test_code` | TEXT | nullable |
| `test_cases` | JSONB | nullable |
| `estimated_date` | DATE | nullable |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() |

---

### problem_patterns

Junction table for many-to-many relationship.

| Column | Type | Constraints |
|--------|------|-------------|
| `problem_id` | INTEGER | FK → problems(id) ON DELETE CASCADE |
| `pattern_id` | UUID | FK → patterns(id) ON DELETE CASCADE |
| | | PRIMARY KEY (problem_id, pattern_id) |

---

### coaching_sessions

User coaching sessions.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `problem_id` | INTEGER | NOT NULL, FK → problems(id) ON DELETE CASCADE |
| `current_phase` | TEXT | NOT NULL, DEFAULT 'understanding' |
| `elapsed_seconds` | INTEGER | NOT NULL, DEFAULT 0 |
| `is_initialized` | BOOLEAN | NOT NULL, DEFAULT FALSE |
| `started_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |
| `completed_at` | TIMESTAMPTZ | nullable |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |

**Trigger:** `updated_at` auto-updates on row modification.

---

### coaching_messages

Chat history per session.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `session_id` | UUID | NOT NULL, FK → coaching_sessions(id) ON DELETE CASCADE |
| `type` | TEXT | CHECK (IN 'coach', 'question', 'user-answer', 'feedback', 'user-question', 'coach-response') |
| `phase` | TEXT | NOT NULL |
| `content` | TEXT | nullable |
| `question_type` | TEXT | CHECK (IN 'single-select', 'multi-select') |
| `options` | JSONB | nullable |
| `correct_answer` | JSONB | nullable |
| `selected_options` | JSONB | nullable |
| `is_correct` | BOOLEAN | nullable |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |

---

## Row Level Security

All tables have RLS enabled with these policies:

```sql
-- Public read access
CREATE POLICY "Allow public read access" ON table_name
  FOR SELECT USING (true);

-- Service role full access (for import scripts)
CREATE POLICY "Allow service role full access" ON table_name
  FOR ALL USING (auth.role() = 'service_role');

-- Coaching tables: Allow all (no auth yet)
CREATE POLICY "Allow all operations" ON coaching_sessions
  FOR ALL USING (true) WITH CHECK (true);
```

---

## TypeScript Types

**Location:** `src/lib/types.ts`

### Problem Types

```typescript
export type Difficulty = 'Easy' | 'Medium' | 'Hard'
export type CompletionStatus = 'Solved' | 'Attempted' | 'Untouched'

export interface Pattern {
  id: string
  name: string
  slug: string
}

export interface Problem {
  id: number
  task_id: string
  title: string
  difficulty: Difficulty
  problem_description: string
  patterns: string[]  // pattern IDs
  completionStatus: CompletionStatus
}
```

### Coaching Types

```typescript
export interface CoachingSession {
  id: string
  problemId: number
  currentPhase: string
  elapsedSeconds: number
  startedAt: string
  completedAt: string | null
}

export interface Phase {
  id: string
  title: string
  description: string
  status: 'locked' | 'active' | 'completed'
  questionsTotal: number
  questionsCompleted: number
}

// Phase configuration constant
export const COACHING_PHASES = [
  { id: 'understanding', title: 'Problem Understanding', ... },
  { id: 'approach', title: 'Approach Selection', ... },
  { id: 'implementation', title: 'Implementation', ... },
  { id: 'edge-cases', title: 'Edge Cases & Optimization', ... },
] as const
```

### Message Types

```typescript
export interface Option {
  id: string    // 'a', 'b', 'c', 'd'
  label: string // 'A', 'B', 'C', 'D'
  text: string
}

export interface CoachMessage {
  id: string
  type: 'coach'
  content: string
}

export interface QuestionMessage {
  id: string
  type: 'question'
  questionType: 'single-select' | 'multi-select'
  content: string
  options: Option[]
  correctAnswer: string[]
}

export interface UserAnswerMessage {
  id: string
  type: 'user-answer'
  selectedOptions: string[]
}

export interface FeedbackMessage {
  id: string
  type: 'feedback'
  isCorrect: boolean
  content: string
  shouldAdvancePhase?: boolean  // AI response only
  nextPhase?: string | null     // AI response only
}

export interface UserQuestionMessage {
  id: string
  type: 'user-question'
  content: string
}

export interface CoachResponseMessage {
  id: string
  type: 'coach-response'
  content: string
}

export type Message =
  | CoachMessage
  | QuestionMessage
  | UserAnswerMessage
  | FeedbackMessage
  | UserQuestionMessage
  | CoachResponseMessage
```

### Session with Problem (for lists)

```typescript
export interface SessionWithProblem extends CoachingSession {
  problem: {
    id: number
    title: string
    difficulty: Difficulty
    patterns: string[]
  }
  phasesCompleted: number
  updatedAt: string
}
```

---

## Indexes

| Table | Index | Columns |
|-------|-------|---------|
| patterns | idx_patterns_name | name |
| patterns | idx_patterns_slug | slug |
| problems | idx_problems_task_id | task_id |
| problems | idx_problems_difficulty | difficulty |
| problem_patterns | idx_problem_patterns_pattern_id | pattern_id |
| coaching_sessions | idx_coaching_sessions_problem_id | problem_id |
| coaching_messages | idx_coaching_messages_session_id | session_id |
| coaching_messages | idx_coaching_messages_phase | phase |
