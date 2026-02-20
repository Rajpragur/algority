/**
 * Judge0 API Wrapper
 * Server-side only - handles code execution via Judge0 CE API
 * Supports both RapidAPI (hosted) and self-hosted instances
 */

import { Judge0Result, JUDGE0_STATUS } from './types'

// Configuration from environment
const JUDGE0_API_URL = process.env.JUDGE0_API_URL || 'http://localhost:2358'
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || '' // RapidAPI key or self-hosted auth token

// Detect if using RapidAPI based on URL
const IS_RAPIDAPI = JUDGE0_API_URL.includes('rapidapi.com')

// Python 3 language ID in Judge0
// RapidAPI Judge0 CE uses older IDs - 71 = Python 3.8.1
// Self-hosted v1.13.1 uses: 71 = Python 3.8.1 (same), but can vary
// Use env var to override if needed
const PYTHON3_LANGUAGE_ID = parseInt(process.env.JUDGE0_PYTHON_ID || '71', 10)

// Execution configuration
const MAX_RETRIES = 2
const TIMEOUT_MS = 60000 // 60 seconds for self-hosted (80 tests with 2 workers takes ~30s)
const INITIAL_POLL_INTERVAL_MS = 100 // Faster polling for self-hosted
const MAX_POLL_INTERVAL_MS = 1000 // Slower max interval to reduce polling load
const MAX_BATCH_SIZE = 20 // Judge0 limit per batch request

interface SubmissionResponse {
  token: string
}

/**
 * Get headers for Judge0 API requests
 * RapidAPI requires special headers, self-hosted may use auth token
 */
function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (IS_RAPIDAPI) {
    // RapidAPI requires these specific headers
    if (!JUDGE0_API_KEY) {
      throw new Error('JUDGE0_API_KEY is required for RapidAPI')
    }
    headers['X-RapidAPI-Key'] = JUDGE0_API_KEY
    headers['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com'
  } else if (JUDGE0_API_KEY) {
    // Self-hosted with optional auth token (AUTHN_TOKEN in judge0.conf)
    headers['X-Auth-Token'] = JUDGE0_API_KEY
  }

  return headers
}

/**
 * Get headers for GET requests (no Content-Type needed)
 */
function getHeadersForGet(): HeadersInit {
  const headers: HeadersInit = {}

  if (IS_RAPIDAPI) {
    if (!JUDGE0_API_KEY) {
      throw new Error('JUDGE0_API_KEY is required for RapidAPI')
    }
    headers['X-RapidAPI-Key'] = JUDGE0_API_KEY
    headers['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com'
  } else if (JUDGE0_API_KEY) {
    headers['X-Auth-Token'] = JUDGE0_API_KEY
  }

  return headers
}

/**
 * Encode string to base64 (server-side)
 */
function toBase64(str: string): string {
  return Buffer.from(str, 'utf-8').toString('base64')
}

/**
 * Decode base64 string (server-side)
 */
function fromBase64(base64: string): string {
  return Buffer.from(base64, 'base64').toString('utf-8')
}

/**
 * Submit code to Judge0 for execution
 * @returns Token for polling results
 */
export async function submitCode(code: string, stdin: string): Promise<string> {
  // Base64 encode source code and stdin for reliable transmission
  const requestBody = {
    source_code: toBase64(code),
    language_id: PYTHON3_LANGUAGE_ID,
    stdin: toBase64(stdin),
  }

  const response = await fetch(`${JUDGE0_API_URL}/submissions?base64_encoded=true&wait=false&fields=*`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[Judge0] Submission failed:', response.status, errorText)
    throw new Error(`Judge0 submission failed: ${response.status} - ${errorText}`)
  }

  const data: SubmissionResponse = await response.json()
  console.log('[Judge0] Got token:', data.token)
  return data.token
}

/**
 * Execute code with wait=true (synchronous) - faster for small test counts
 * Runs tests in parallel, each waiting for its own result
 * @returns Array of results directly (no polling needed)
 */
export async function executeWithWait(code: string, stdinInputs: string[]): Promise<Judge0Result[]> {
  const encodedCode = toBase64(code)

  console.log(`[Judge0] Executing ${stdinInputs.length} tests with wait=true`)

  // Execute all tests in parallel with wait=true
  const promises = stdinInputs.map(async (stdin) => {
    const requestBody = {
      source_code: encodedCode,
      language_id: PYTHON3_LANGUAGE_ID,
      stdin: toBase64(stdin),
    }

    const response = await fetch(
      `${JUDGE0_API_URL}/submissions?base64_encoded=true&wait=true&fields=*`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(requestBody),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Judge0 submission failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    // Decode base64 fields
    return {
      ...data,
      stdout: data.stdout ? fromBase64(data.stdout) : null,
      stderr: data.stderr ? fromBase64(data.stderr) : null,
      compile_output: data.compile_output ? fromBase64(data.compile_output) : null,
      message: data.message ? fromBase64(data.message) : null,
    } as Judge0Result
  })

  return Promise.all(promises)
}

interface BatchSubmission {
  source_code: string
  language_id: number
  stdin: string
}

interface BatchSubmissionResponse {
  token: string
}

/**
 * Submit multiple test cases as a batch to Judge0
 * Handles chunking if more than MAX_BATCH_SIZE (20) submissions
 * @returns Array of tokens for polling results
 */
export async function submitBatch(code: string, stdinInputs: string[]): Promise<string[]> {
  const encodedCode = toBase64(code)

  const allSubmissions: BatchSubmission[] = stdinInputs.map((stdin) => ({
    source_code: encodedCode,
    language_id: PYTHON3_LANGUAGE_ID,
    stdin: toBase64(stdin),
  }))

  console.log(`[Judge0] Submitting ${allSubmissions.length} tests to ${IS_RAPIDAPI ? 'RapidAPI' : 'self-hosted'}`)

  // Chunk into batches of MAX_BATCH_SIZE
  const chunks: BatchSubmission[][] = []
  for (let i = 0; i < allSubmissions.length; i += MAX_BATCH_SIZE) {
    chunks.push(allSubmissions.slice(i, i + MAX_BATCH_SIZE))
  }

  // Submit all chunks in parallel
  const chunkPromises = chunks.map(async (submissions, chunkIndex) => {
    console.log(`[Judge0] Submitting chunk ${chunkIndex + 1}/${chunks.length} (${submissions.length} tests)`)

    const response = await fetch(`${JUDGE0_API_URL}/submissions/batch?base64_encoded=true`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ submissions }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Judge0] Batch submission failed:', response.status)
      console.error('[Judge0] Error details:', errorText)
      console.error('[Judge0] Request URL:', `${JUDGE0_API_URL}/submissions/batch?base64_encoded=true`)
      throw new Error(`Judge0 batch submission failed: ${response.status} - ${errorText}`)
    }

    const data: BatchSubmissionResponse[] = await response.json()
    return data.map((d) => d.token)
  })

  // Collect all tokens in order
  const tokenChunks = await Promise.all(chunkPromises)
  const allTokens = tokenChunks.flat()

  console.log(`[Judge0] Got ${allTokens.length} tokens`)
  return allTokens
}

/**
 * Fetch a batch of tokens (max 20) from Judge0
 */
async function fetchBatchResults(tokenList: string[]): Promise<Judge0Result[]> {
  const response = await fetch(
    `${JUDGE0_API_URL}/submissions/batch?tokens=${tokenList.join(',')}&base64_encoded=true&fields=*`,
    {
      method: 'GET',
      headers: getHeadersForGet(),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[Judge0] Batch poll failed:', response.status, errorText)
    throw new Error(`Judge0 batch poll failed: ${response.status}`)
  }

  const batchResults = await response.json()
  const submissions = batchResults.submissions || batchResults

  return submissions.map((data: Record<string, unknown>) => ({
    ...data,
    stdout: data.stdout ? fromBase64(data.stdout as string) : null,
    stderr: data.stderr ? fromBase64(data.stderr as string) : null,
    compile_output: data.compile_output ? fromBase64(data.compile_output as string) : null,
    message: data.message ? fromBase64(data.message as string) : null,
  })) as Judge0Result[]
}

/**
 * Poll multiple tokens using Judge0's batch GET endpoint
 * Chunks into groups of 20 (Judge0 limit) and polls in parallel
 */
export async function pollResultsBatch(tokens: string[]): Promise<Judge0Result[]> {
  const startTime = Date.now()
  let pollInterval = INITIAL_POLL_INTERVAL_MS

  // Track results by token for ordering
  const resultsByToken: Map<string, Judge0Result> = new Map()
  let pendingTokens = [...tokens]

  while (Date.now() - startTime < TIMEOUT_MS && pendingTokens.length > 0) {
    try {
      // Chunk pending tokens into groups of 20
      const chunks: string[][] = []
      for (let i = 0; i < pendingTokens.length; i += MAX_BATCH_SIZE) {
        chunks.push(pendingTokens.slice(i, i + MAX_BATCH_SIZE))
      }

      // Fetch all chunks in parallel
      const chunkResults = await Promise.all(chunks.map(fetchBatchResults))
      const allResults = chunkResults.flat()

      // Process results and track completed ones
      const stillPending: string[] = []

      for (const data of allResults) {
        if (!data || !data.token) continue

        // Check if still processing
        if (
          data.status?.id === JUDGE0_STATUS.IN_QUEUE ||
          data.status?.id === JUDGE0_STATUS.PROCESSING
        ) {
          stillPending.push(data.token)
        } else {
          resultsByToken.set(data.token, data)
        }
      }

      pendingTokens = stillPending
      console.log(`[Judge0] Poll: ${resultsByToken.size}/${tokens.length} complete, ${pendingTokens.length} pending`)

    } catch (error) {
      console.error('[Judge0] Batch poll error:', error)
    }

    // If still pending, wait before next poll
    if (pendingTokens.length > 0) {
      await sleep(pollInterval)
      pollInterval = Math.min(pollInterval * 1.5, MAX_POLL_INTERVAL_MS)
    }
  }

  // Build final results array in original token order
  return tokens.map((token) => {
    const result = resultsByToken.get(token)
    if (result) return result

    // Timeout for any that didn't complete
    return {
      token,
      status: { id: JUDGE0_STATUS.TIME_LIMIT_EXCEEDED, description: 'Polling timeout' },
      stdout: null,
      stderr: null,
      compile_output: null,
      message: 'Code execution timed out',
      time: null,
      memory: null,
    }
  })
}

/**
 * Poll Judge0 for execution results with exponential backoff
 * @returns Execution result when complete
 */
export async function pollResults(token: string): Promise<Judge0Result> {
  const startTime = Date.now()
  let pollInterval = INITIAL_POLL_INTERVAL_MS
  let retries = 0

  while (Date.now() - startTime < TIMEOUT_MS) {
    try {
      const result = await fetchSubmission(token)

      // Check if execution is still in progress
      if (
        result.status.id === JUDGE0_STATUS.IN_QUEUE ||
        result.status.id === JUDGE0_STATUS.PROCESSING
      ) {
        // Wait before next poll with exponential backoff
        await sleep(pollInterval)
        pollInterval = Math.min(pollInterval * 1.5, MAX_POLL_INTERVAL_MS)
        continue
      }

      // Execution complete (success or error)
      return result
    } catch (error) {
      // Retry on transient failures
      if (retries < MAX_RETRIES) {
        retries++
        await sleep(pollInterval)
        continue
      }
      throw error
    }
  }

  // Timeout reached
  throw new Error('Code execution timed out after 15 seconds')
}

/**
 * Fetch submission result from Judge0
 */
async function fetchSubmission(token: string): Promise<Judge0Result> {
  const response = await fetch(
    `${JUDGE0_API_URL}/submissions/${token}?base64_encoded=true&fields=*`,
    {
      method: 'GET',
      headers: getHeadersForGet(),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Judge0 fetch failed: ${response.status} - ${errorText}`)
  }

  const data = await response.json()

  // Decode base64 fields from Judge0 response
  return {
    ...data,
    stdout: data.stdout ? fromBase64(data.stdout) : null,
    stderr: data.stderr ? fromBase64(data.stderr) : null,
    compile_output: data.compile_output ? fromBase64(data.compile_output) : null,
    message: data.message ? fromBase64(data.message) : null,
  }
}

/**
 * Check if a Judge0 status indicates an error
 */
export function isErrorStatus(statusId: number): boolean {
  return (
    statusId === JUDGE0_STATUS.TIME_LIMIT_EXCEEDED ||
    statusId === JUDGE0_STATUS.COMPILATION_ERROR ||
    statusId >= JUDGE0_STATUS.RUNTIME_ERROR_SIGSEGV
  )
}

/**
 * Get error type from Judge0 status
 */
export function getErrorType(statusId: number): 'syntax' | 'runtime' | 'timeout' | 'compilation' {
  switch (statusId) {
    case JUDGE0_STATUS.TIME_LIMIT_EXCEEDED:
      return 'timeout'
    case JUDGE0_STATUS.COMPILATION_ERROR:
      return 'compilation'
    default:
      // Runtime errors (status 7-14)
      return 'runtime'
  }
}

/**
 * Sleep helper for polling
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
