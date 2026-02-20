import type { EvalResult, CriterionStats, AggregateReport } from './types'
import { loadAllResults } from './storage'

// Calculate mean of an array of numbers
export function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

// Calculate median of an array of numbers
export function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2
}

// Calculate standard deviation of an array of numbers
export function stddev(values: number[]): number {
  if (values.length < 2) return 0
  const avg = mean(values)
  const squareDiffs = values.map(v => Math.pow(v - avg, 2))
  return Math.sqrt(mean(squareDiffs))
}

// Calculate stats for a single criterion across all results
function calculateCriterionStats(
  results: EvalResult[],
  criterionName: string
): CriterionStats {
  const scores = results
    .flatMap(r => r.scores)
    .filter(s => s.criterion === criterionName)
    .map(s => s.score)

  return {
    criterion: criterionName,
    mean: mean(scores),
    median: median(scores),
    stddev: stddev(scores),
    count: scores.length,
  }
}

// The five evaluation criteria
const CRITERIA = [
  'phase-transition-timing',
  'question-relevance',
  'difficulty-calibration',
  'feedback-accuracy',
  'recovery-quality',
] as const

// Generate aggregate report from all stored results
export function generateAggregateReport(): AggregateReport {
  const results = loadAllResults()

  // Calculate overall stats from overallScore
  const overallScores = results.map(r => r.overallScore)

  // Calculate per-criterion stats
  const criterionStats = CRITERIA.map(criterion =>
    calculateCriterionStats(results, criterion)
  )

  return {
    generatedAt: new Date().toISOString(),
    sessionCount: results.length,
    overallStats: {
      mean: mean(overallScores),
      median: median(overallScores),
      stddev: stddev(overallScores),
    },
    criterionStats,
  }
}

// Generate aggregate report from a subset of results (e.g., by date range)
export function generateAggregateReportFromResults(
  results: EvalResult[]
): AggregateReport {
  const overallScores = results.map(r => r.overallScore)

  const criterionStats = CRITERIA.map(criterion =>
    calculateCriterionStats(results, criterion)
  )

  return {
    generatedAt: new Date().toISOString(),
    sessionCount: results.length,
    overallStats: {
      mean: mean(overallScores),
      median: median(overallScores),
      stddev: stddev(overallScores),
    },
    criterionStats,
  }
}

// Filter results by date range
export function filterResultsByDate(
  results: EvalResult[],
  since?: Date,
  until?: Date
): EvalResult[] {
  return results.filter(r => {
    const date = new Date(r.evaluatedAt)
    if (since && date < since) return false
    if (until && date > until) return false
    return true
  })
}
