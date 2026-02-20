// =============================================================================
// Data Types
// =============================================================================

export interface SummaryStats {
  totalProblemsSolved: number
  totalProblemsAttempted: number
  overallAccuracy: number
  patternsMastered: number
  patternsInProgress: number
  patternsNotStarted: number
  totalPracticeTime: string
  currentStreak: number
}

export interface PatternProgress {
  id: string
  name: string
  description: string
  problemsCompleted: number
  problemsTotal: number
  successRate: number
  status: 'mastered' | 'in-progress' | 'not-started'
}

export interface RecentSession {
  id: string
  problemName: string
  problemId: string
  pattern: string
  date: string
  outcome: 'solved' | 'not-solved'
  duration: string
}

// =============================================================================
// Component Props
// =============================================================================

export interface ProgressDashboardProps {
  /** Aggregate stats for the summary section */
  summaryStats: SummaryStats
  /** Progress for each algorithmic pattern */
  patternProgress: PatternProgress[]
  /** Recent practice sessions */
  recentSessions: RecentSession[]
}
