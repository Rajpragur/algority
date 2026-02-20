import type { TestCase } from '@/lib/types'

/**
 * Parses test cases from JSONB database format to TestCase array.
 *
 * Expected DB format (LeetCode style):
 * [
 *   {"input": "nums = [2,7,11,15], target = 9", "output": "[0,1]"},
 *   {"input": "nums = [3,2,4], target = 6", "output": "[1,2]"}
 * ]
 */
interface DBTestCase {
  input: string
  output: string
}

export function parseTestCases(testCasesJson: unknown): TestCase[] {
  // Handle null/undefined
  if (!testCasesJson) {
    return []
  }

  // Handle if it's already an array
  let testCases: DBTestCase[]
  if (Array.isArray(testCasesJson)) {
    testCases = testCasesJson as DBTestCase[]
  } else if (typeof testCasesJson === 'string') {
    // Handle if it's a JSON string that needs parsing
    try {
      testCases = JSON.parse(testCasesJson) as DBTestCase[]
    } catch {
      console.error('Failed to parse test_cases JSON string:', testCasesJson)
      return []
    }
  } else {
    console.error('Unexpected test_cases format:', typeof testCasesJson)
    return []
  }

  // Validate and transform to TestCase[]
  if (!Array.isArray(testCases)) {
    return []
  }

  return testCases
    .filter((tc): tc is DBTestCase => {
      return (
        tc !== null &&
        typeof tc === 'object' &&
        typeof tc.input === 'string' &&
        typeof tc.output === 'string'
      )
    })
    .map((tc, index) => ({
      id: `test-${index + 1}`,
      input: tc.input,
      expectedOutput: tc.output,
      isCustom: false,
    }))
}
