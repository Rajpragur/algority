// Problem Workspace Types

export interface Pattern {
  id: string
  name: string
  slug: string
}

export type Difficulty = 'Easy' | 'Medium' | 'Hard'

export type CompletionStatus = 'Solved' | 'Attempted' | 'Untouched'

export interface Problem {
  id: number
  task_id: string
  title: string
  difficulty: Difficulty
  problem_description: string
  patterns: string[] // pattern IDs
  problemSets: string[] // problem set IDs
  completionStatus: CompletionStatus
  // Solution code for grounding AI responses
  solution?: string | null
  // Starter code template for the editor
  starter_code?: string
  // Test cases from database (JSONB) - legacy, kept for custom tests display
  test_cases?: unknown
  // Python test code with assertions (def check(candidate):...)
  test_code?: string | null
  // Test harness/preamble prepended to user code before execution
  // Contains imports, helper classes (ListNode, TreeNode), utility functions
  prompt?: string | null
  // Entry point function name (e.g., "twoSum")
  entry_point?: string | null
}

// Client-safe problem data - excludes solution, prompt, and other sensitive/unnecessary fields
// Used for coaching UI where we only need display information
export interface ClientProblem {
  id: number
  title: string
  difficulty: Difficulty
  problem_description: string
  patterns: string[]
  problemSets: string[]
  completionStatus: CompletionStatus
  // Note: solution is intentionally excluded from client-safe problem data
  // to prevent inspection before session completion.
}

// Database types (matching Supabase schema)
export interface DBProblem {
  id: number
  task_id: string
  title: string
  difficulty: string
  problem_description: string
  starter_code: string
  prompt: string | null
  completion: string | null
  entry_point: string | null
  test_code: string | null
  test_cases: unknown | null
  estimated_date: string | null
  created_at: string
  updated_at: string
}

export interface DBPattern {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
}

export interface DBProblemPattern {
  problem_id: number
  pattern_id: string
}

// =============================================================================
// Coaching Types
// =============================================================================

// Phase summary stored in database (cached to avoid regenerating)
export interface CachedPhaseSummary {
  phaseId: string
  conceptsCovered: string[]
  summary: string
}

// Cached question data (without id since it's not saved to messages yet)
// correctAnswer can be null if Pass 2 (verification) hasn't completed yet
export interface CachedQuestion {
  phase: string
  questionType: 'single-select' | 'multi-select'
  content: string
  options: Option[]
  correctAnswer: string[] | null  // null = Pass 2 pending
  intro?: string  // For first question cache, stores the intro message
}

export interface CoachingSession {
  id: string
  problemId: number
  currentPhase: string
  elapsedSeconds: number
  startedAt: string
  completedAt: string | null
  // User who owns this session (nullable for legacy sessions)
  userId: string | null
  // Cached phase summaries to avoid regenerating
  phaseSummaries?: Record<string, CachedPhaseSummary>
  // Pre-generated next question for latency optimization
  cachedNextQuestion?: CachedQuestion | null
  cachedQuestionPhase?: string | null
}

export interface Phase {
  id: string
  title: string
  description: string
  status: 'locked' | 'active' | 'completed'
  // Confidence-based progress (0-100) for adaptive UI
  // Represents how close the student is to completing this phase
  confidenceProgress: number
}

export interface Option {
  id: string
  label: string // A, B, C, D
  text: string
}

export interface CoachMessage {
  id: string
  type: 'coach'
  phase: string
  content: string
  isFlagged?: boolean
}

export interface QuestionMessage {
  id: string
  type: 'question'
  phase: string
  questionType: 'single-select' | 'multi-select'
  content: string
  options: Option[]
  correctAnswer: string[] // This should be stripped before sending to client for unanswered questions
}

export interface UserAnswerMessage {
  id: string
  type: 'user-answer'
  selectedOptions: string[]
}

// Algorithm stages for solution-building phase
export type AlgorithmStage = 'setup' | 'main-logic' | 'key-decisions' | 'termination'

export interface FeedbackMessage {
  id: string
  type: 'feedback'
  phase: string
  isCorrect: boolean
  content: string
  isFlagged?: boolean
  // These fields are only present in the AI response, not persisted to DB
  shouldAdvancePhase?: boolean
  nextPhase?: string | null
}

// User's free-form question to the coach
export interface UserQuestionMessage {
  id: string
  type: 'user-question'
  content: string
}

// Coach's conversational response to a user question
export interface CoachResponseMessage {
  id: string
  type: 'coach-response'
  content: string
  isFlagged?: boolean
  // These fields are only present in the AI response, not persisted to DB
  followUpQuiz?: boolean
  shouldAdvancePhase?: boolean
  nextPhase?: string | null
}

// Open-ended probe question from coach to verify understanding
export interface ProbeQuestionMessage {
  id: string
  type: 'probe-question'
  content: string // The open-ended question (e.g., "Why wouldn't a brute force approach work here?")
  probeType: 'short-answer' | 'explain-reasoning' | 'predict-behavior'
}

// Student's response to a probe question
export interface ProbeResponseMessage {
  id: string
  type: 'probe-response'
  content: string // Student's free-form answer
}

// Coach's evaluation of the probe response
export interface ProbeEvaluationMessage {
  id: string
  type: 'probe-evaluation'
  content: string // Feedback on student's explanation
  understandingLevel: 'strong' | 'partial' | 'unclear' | 'incorrect'
  isFlagged?: boolean
  // These fields are only present in the AI response, not persisted to DB
  needsClarification?: boolean
  shouldAdvancePhase?: boolean
  nextPhase?: string | null
}

export type Message =
  | CoachMessage
  | QuestionMessage
  | UserAnswerMessage
  | FeedbackMessage
  | UserQuestionMessage
  | CoachResponseMessage
  | ProbeQuestionMessage
  | ProbeResponseMessage
  | ProbeEvaluationMessage

// Phase configuration
export const COACHING_PHASES = [
  { id: 'understanding', title: 'Problem Understanding', description: 'Verify comprehension of the problem' },
  { id: 'solution-building', title: 'Solution Building', description: 'Construct the algorithm step-by-step' },
  { id: 'algorithm-steps', title: 'Algorithm Steps', description: 'Verify pseudocode understanding' },
] as const

// Session with problem details for sessions list
export interface SessionWithProblem extends CoachingSession {
  problem: {
    id: number
    title: string
    difficulty: Difficulty
    patterns: string[]
  }
  phasesCompleted: number
  updatedAt: string
  isGoldenCandidate?: boolean
  submittedAsGoldenAt?: string | null
}

// =============================================================================
// Code Execution Types
// =============================================================================

export interface TestCase {
  id: string
  input: string
  expectedOutput: string
  isCustom?: boolean
}

export type ExecutionErrorType = 'syntax' | 'runtime' | 'timeout' | 'compilation'

export interface ExecutionError {
  type: ExecutionErrorType
  message: string
}

export interface ExecutionResult {
  testId: string
  passed: boolean
  actualOutput: string
  expectedOutput: string
  executionTime?: number
  memoryUsed?: number
  error?: ExecutionError
}

// Judge0 API Response Types
export interface Judge0Status {
  id: number
  description: string
}

export interface Judge0Result {
  token: string
  status: Judge0Status
  stdout: string | null
  stderr: string | null
  compile_output: string | null
  time: string | null
  memory: number | null
  message: string | null
}

// Judge0 Status IDs
export const JUDGE0_STATUS = {
  IN_QUEUE: 1,
  PROCESSING: 2,
  ACCEPTED: 3,
  WRONG_ANSWER: 4,
  TIME_LIMIT_EXCEEDED: 5,
  COMPILATION_ERROR: 6,
  RUNTIME_ERROR_SIGSEGV: 7,
  RUNTIME_ERROR_SIGXFSZ: 8,
  RUNTIME_ERROR_SIGFPE: 9,
  RUNTIME_ERROR_SIGABRT: 10,
  RUNTIME_ERROR_NZEC: 11,
  RUNTIME_ERROR_OTHER: 12,
  INTERNAL_ERROR: 13,
  EXEC_FORMAT_ERROR: 14,
} as const

// =============================================================================
// Code Editor Coaching Insights Types
// =============================================================================

export interface CoachingInsights {
  hasSession: boolean
  sessionId?: string
  phaseSummaries?: Record<string, CachedPhaseSummary>
  completedAt?: string
}

// =============================================================================
// AI Code Evaluation Types
// =============================================================================

export type EvaluationIssueType = 'syntax' | 'logic' | 'edge-case' | 'efficiency' | 'none'

export interface CodeEvaluation {
  isOnTrack: boolean
  issueType: EvaluationIssueType | null
  hint: string | null
  feedback: string
  suggestedImprovement: string | null
}

// =============================================================================
// Problem Sets Types (Blind 75, Grind 75, NeetCode 150)
// =============================================================================

export interface ProblemSet {
  id: string // e.g., 'blind-75', 'grind-75', 'neetcode-150'
  name: string // Display name: "Blind 75"
  description: string | null
  sourceUrl: string | null // Original source URL for attribution
  problemCount: number
}

export interface ProblemSetProblem {
  problemSetId: string
  problemId: number
  position: number // Order within the set (1-based)
  category: string | null // Category within the set (e.g., "Arrays & Hashing")
}

// Problem with problem set information for display
export interface ProblemWithSets extends Omit<Problem, 'problemSets'> {
  problemSets: Array<{
    id: string
    name: string
    position: number
    category: string | null
  }>
}

// User Profile Types
export interface UserProfile {
  id: string
  fullName: string | null
  email: string
  avatarUrl: string | null
  college: string | null
  bio: string | null
  githubUrl: string | null
  rank: number
  totalSolved: number
  joinedAt: string
}

export interface UserStats {
  easySolved: number
  mediumSolved: number
  hardSolved: number
  totalEasy: number
  totalMedium: number
  totalHard: number
  problemSetStats: {
    setId: string
    setName: string
    total: number
    solved: number
  }[]
  recentSubmissions: {
    problemId: number
    title: string
    difficulty: Difficulty
    submittedAt: string
    status: 'Solved' | 'Attempted'
  }[]
}
