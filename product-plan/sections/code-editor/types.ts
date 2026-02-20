// =============================================================================
// Data Types
// =============================================================================

export interface Example {
  input: string
  output: string
  explanation: string
}

export interface Problem {
  id: string
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  description: string
  examples: Example[]
}

export interface ApproachSummary {
  title: string
  steps: string[]
  timeComplexity: string
  spaceComplexity: string
}

export interface Code {
  language: 'python' | 'javascript' | 'typescript' | 'java' | 'cpp'
  content: string
}

export interface TestCase {
  id: string
  type: 'example' | 'user'
  input: string
  expectedOutput: string
  actualOutput?: string
  status: 'pending' | 'running' | 'passed' | 'failed'
  runtime?: string
}

export interface Suggestion {
  type: 'improvement' | 'style' | 'optimization' | 'bug'
  title: string
  description: string
}

export interface AICritique {
  isVisible: boolean
  overallAssessment: string
  suggestions: Suggestion[]
}

export interface SubmissionResult {
  score: number
  totalTests: number
  passedTests: number
  failedTests: number
  runtime: string
  memory: string
  status: 'accepted' | 'wrong_answer' | 'time_limit' | 'runtime_error'
}

// =============================================================================
// Component Props
// =============================================================================

export interface CodeEditorProps {
  /** The problem being solved */
  problem: Problem
  /** The approach summary from Socratic Coach */
  approachSummary: ApproachSummary
  /** The current code in the editor */
  code: Code
  /** Test cases (examples + user-created) */
  testCases: TestCase[]
  /** AI critique feedback (null if not requested yet) */
  aiCritique: AICritique | null
  /** Submission result (null if not submitted yet) */
  submissionResult: SubmissionResult | null
  /** Called when user updates code in the editor */
  onCodeChange?: (code: string) => void
  /** Called when user clicks Run Tests */
  onRunTests?: () => void
  /** Called when user adds a new test case */
  onAddTestCase?: (input: string, expectedOutput: string) => void
  /** Called when user deletes a test case */
  onDeleteTestCase?: (testId: string) => void
  /** Called when user requests AI critique */
  onRequestCritique?: () => void
  /** Called when user toggles critique panel visibility */
  onToggleCritique?: () => void
  /** Called when user submits the solution */
  onSubmit?: () => void
  /** Called when user continues to the next problem */
  onNextProblem?: () => void
}
