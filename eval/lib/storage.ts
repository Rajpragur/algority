import * as fs from 'fs'
import * as path from 'path'
import type { EvalResult } from './types'

// Results directory path
const RESULTS_DIR = path.join(process.cwd(), 'eval', 'results')

// Ensure results directory exists
function ensureResultsDir(): void {
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true })
  }
}

// Get result file path for a session
function getResultPath(sessionId: string): string {
  return path.join(RESULTS_DIR, `${sessionId}.json`)
}

// Save an evaluation result
export function saveResult(result: EvalResult): void {
  ensureResultsDir()
  const filePath = getResultPath(result.sessionId)
  fs.writeFileSync(filePath, JSON.stringify(result, null, 2), 'utf-8')
}

// Load a single evaluation result by session ID
export function loadResult(sessionId: string): EvalResult | null {
  const filePath = getResultPath(sessionId)
  if (!fs.existsSync(filePath)) {
    return null
  }
  const content = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(content) as EvalResult
}

// Load all evaluation results
export function loadAllResults(): EvalResult[] {
  ensureResultsDir()

  const files = fs.readdirSync(RESULTS_DIR)
    .filter(f => f.endsWith('.json'))

  const results: EvalResult[] = []

  for (const file of files) {
    const filePath = path.join(RESULTS_DIR, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    try {
      results.push(JSON.parse(content) as EvalResult)
    } catch {
      console.warn(`Failed to parse result file: ${file}`)
    }
  }

  // Sort by evaluatedAt date (newest first)
  return results.sort((a, b) =>
    new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime()
  )
}

// Check if a result exists for a session
export function hasResult(sessionId: string): boolean {
  return fs.existsSync(getResultPath(sessionId))
}

// Delete a result
export function deleteResult(sessionId: string): boolean {
  const filePath = getResultPath(sessionId)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
    return true
  }
  return false
}

// Get count of stored results
export function getResultCount(): number {
  ensureResultsDir()
  return fs.readdirSync(RESULTS_DIR).filter(f => f.endsWith('.json')).length
}
