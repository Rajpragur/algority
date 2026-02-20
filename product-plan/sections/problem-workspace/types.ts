// =============================================================================
// Data Types
// =============================================================================

export interface Pattern {
  id: string
  name: string
}

export type Difficulty = 'Easy' | 'Medium' | 'Hard'

export type CompletionStatus = 'Solved' | 'Attempted' | 'Untouched'

export interface Problem {
  id: string
  title: string
  description: string
  difficulty: Difficulty
  patterns: string[]
  completionStatus: CompletionStatus
}

// =============================================================================
// Component Props
// =============================================================================

export interface ProblemWorkspaceProps {
  /** List of all available problems */
  problems: Problem[]
  /** List of patterns for filtering */
  patterns: Pattern[]
  /** Called when user selects a problem to start a coaching session */
  onSelectProblem?: (problemId: string) => void
  /** Called when user types in the search bar */
  onSearch?: (query: string) => void
  /** Called when user selects patterns to filter by */
  onFilterByPattern?: (patternIds: string[]) => void
}
