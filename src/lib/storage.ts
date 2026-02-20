/**
 * localStorage helpers for editor draft and custom test persistence
 */

const STORAGE_KEYS = {
  draft: (problemId: number) => `algority:editor:draft:${problemId}`,
  customTests: (problemId: number) => `algority:editor:tests:${problemId}`,
}

interface EditorDraft {
  code: string
  timestamp: number
}

/**
 * Save code draft to localStorage
 */
export function saveDraft(problemId: number, code: string): void {
  if (typeof window === 'undefined') return

  try {
    const draft: EditorDraft = {
      code,
      timestamp: Date.now(),
    }
    localStorage.setItem(STORAGE_KEYS.draft(problemId), JSON.stringify(draft))
  } catch (error) {
    // localStorage might be full or disabled - fail silently
    console.warn('Failed to save draft:', error)
  }
}

/**
 * Load code draft from localStorage
 * @returns The saved code, or null if no draft exists
 */
export function loadDraft(problemId: number): string | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.draft(problemId))
    if (!stored) return null

    const draft: EditorDraft = JSON.parse(stored)
    return draft.code
  } catch (error) {
    // Invalid JSON or other error - fail silently
    console.warn('Failed to load draft:', error)
    return null
  }
}

/**
 * Clear draft from localStorage
 */
export function clearDraft(problemId: number): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(STORAGE_KEYS.draft(problemId))
  } catch (error) {
    console.warn('Failed to clear draft:', error)
  }
}

/**
 * Get draft timestamp (for potential future "last saved" display)
 * @returns Timestamp in milliseconds, or null if no draft exists
 */
export function getDraftTimestamp(problemId: number): number | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.draft(problemId))
    if (!stored) return null

    const draft: EditorDraft = JSON.parse(stored)
    return draft.timestamp
  } catch (error) {
    return null
  }
}

/**
 * Get all problem IDs that have saved drafts
 * @returns Array of { problemId, timestamp } sorted by most recent first
 */
export function getAllDrafts(): Array<{ problemId: number; timestamp: number }> {
  if (typeof window === 'undefined') return []

  const drafts: Array<{ problemId: number; timestamp: number }> = []
  const prefix = 'algority:editor:draft:'

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(prefix)) {
        const problemId = parseInt(key.slice(prefix.length), 10)
        if (!isNaN(problemId)) {
          const stored = localStorage.getItem(key)
          if (stored) {
            const draft: EditorDraft = JSON.parse(stored)
            drafts.push({ problemId, timestamp: draft.timestamp })
          }
        }
      }
    }
  } catch (error) {
    console.warn('Failed to get all drafts:', error)
  }

  // Sort by most recent first
  return drafts.sort((a, b) => b.timestamp - a.timestamp)
}

// ============================================
// Custom Test Case Storage
// ============================================

export interface CustomTestCase {
  id: string
  input: string
  expectedOutput: string
}

/**
 * Generate a unique ID for custom test cases
 */
function generateTestId(): string {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Save custom test cases to localStorage
 */
export function saveCustomTests(problemId: number, tests: CustomTestCase[]): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEYS.customTests(problemId), JSON.stringify(tests))
  } catch (error) {
    console.warn('Failed to save custom tests:', error)
  }
}

/**
 * Load custom test cases from localStorage
 */
export function loadCustomTests(problemId: number): CustomTestCase[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.customTests(problemId))
    if (!stored) return []

    return JSON.parse(stored) as CustomTestCase[]
  } catch (error) {
    console.warn('Failed to load custom tests:', error)
    return []
  }
}

/**
 * Add a new custom test case
 */
export function addCustomTest(
  problemId: number,
  input: string,
  expectedOutput: string
): CustomTestCase {
  const tests = loadCustomTests(problemId)
  const newTest: CustomTestCase = {
    id: generateTestId(),
    input,
    expectedOutput,
  }
  tests.push(newTest)
  saveCustomTests(problemId, tests)
  return newTest
}

/**
 * Update an existing custom test case
 */
export function updateCustomTest(
  problemId: number,
  testId: string,
  input: string,
  expectedOutput: string
): void {
  const tests = loadCustomTests(problemId)
  const index = tests.findIndex((t) => t.id === testId)
  if (index !== -1) {
    tests[index] = { ...tests[index], input, expectedOutput }
    saveCustomTests(problemId, tests)
  }
}

/**
 * Delete a custom test case
 */
export function deleteCustomTest(problemId: number, testId: string): void {
  const tests = loadCustomTests(problemId)
  const filtered = tests.filter((t) => t.id !== testId)
  saveCustomTests(problemId, filtered)
}

/**
 * Clear all custom tests for a problem
 */
export function clearCustomTests(problemId: number): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(STORAGE_KEYS.customTests(problemId))
  } catch (error) {
    console.warn('Failed to clear custom tests:', error)
  }
}
