// Criterion score returned by judge
export interface CriterionScore {
  criterion: string
  score: number           // 0-1 float
  reasoning: string       // Explanation for the score
  evidence: string[]      // Quotes from transcript supporting the score
}

// Full evaluation result for a session
export interface EvalResult {
  sessionId: string
  evaluatedAt: string
  scores: CriterionScore[]
  overallScore: number    // Weighted aggregate
}

// Session data passed to judge for evaluation
export interface EvalSession {
  sessionId: string
  problem: {
    id: number
    title: string
    difficulty: string
    description: string
  }
  messages: Array<{
    type: string
    content: string
    isCorrect?: boolean
  }>
  phases: {
    started: string[]
    completed: string[]
  }
}

// Statistics for a single criterion across multiple sessions
export interface CriterionStats {
  criterion: string
  mean: number
  median: number
  stddev: number
  count: number
}

// Aggregate report across multiple evaluation results
export interface AggregateReport {
  generatedAt: string
  sessionCount: number
  overallStats: {
    mean: number
    median: number
    stddev: number
  }
  criterionStats: CriterionStats[]
}

// Golden dataset candidate export format
export interface GoldenCandidate {
  session_id: string
  exported_at: string
  labels: string[]
  problem: {
    id: number
    title: string
    difficulty: string
    description: string
  }
  transcript: Array<{
    type: string
    phase: string
    content: string
    options?: string[]
    is_correct?: boolean
  }>
  metadata: {
    started_at: string
    completed_at: string | null
    message_count: number
    phases_completed: string[]
  }
}

// Golden dataset example with expected scores (for training/holdout)
export interface GoldenExample extends GoldenCandidate {
  set: 'training' | 'holdout'
  expected_scores: {
    [criterion: string]: number
  }
  added_at: string
  promoted_from?: string  // Original candidate filename
}

// Drift analysis result per criterion
export interface CriterionDrift {
  criterion: string
  baseline: number      // Golden dataset mean
  production: number    // Production mean
  drift: number         // Absolute difference (production - baseline)
  relativeDrift: number // Relative difference as percentage
}

// Full drift report
export interface DriftReport {
  generatedAt: string
  goldenCount: number
  productionCount: number
  criterionDrifts: CriterionDrift[]
  overallDrift: CriterionDrift
  exceedsThreshold: boolean
  threshold: number
}

// Flagged message with surrounding context
export interface FlaggedMessage {
  id: string
  sessionId: string
  type: string
  content: string
  flaggedAt: string
  problem: {
    id: number
    title: string
    difficulty: string
  }
  context: {
    before: Array<{ type: string; content: string }>
    after: Array<{ type: string; content: string }>
  }
}

// Export format for flagged messages review
export interface FlaggedReviewExport {
  exportedAt: string
  count: number
  messages: FlaggedMessage[]
}
