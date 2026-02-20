#!/usr/bin/env node
import 'dotenv/config'
import { Command } from 'commander'
import Table from 'cli-table3'
import cliProgress from 'cli-progress'
import { getSessionWithMessages, supabase } from '../lib/supabase'
import { evaluateSession } from '../lib/judge'
import { saveResult, loadResult, hasResult } from '../lib/storage'
import type { EvalResult } from '../lib/types'

const program = new Command()

interface BatchResult {
  sessionId: string
  success: boolean
  error?: string
  skipped?: boolean
}

program
  .name('eval-check')
  .description('Evaluate a coaching session for quality')
  .option('-s, --session <id>', 'Session ID to evaluate (defaults to most recent)')
  .option('-a, --all', 'Evaluate all completed sessions')
  .option('-l, --limit <count>', 'Limit number of sessions to evaluate', parseInt)
  .option('-j, --json', 'Output as JSON')
  .option('-f, --force', 'Force re-evaluation even if result exists')
  .action(async (options) => {
    try {
      // Batch mode
      if (options.all) {
        await runBatchEvaluation(options)
        return
      }

      // Single session mode
      await runSingleEvaluation(options)
    } catch (error) {
      console.error('Evaluation failed:', (error as Error).message)
      process.exit(1)
    }
  })

async function runSingleEvaluation(options: {
  session?: string
  json?: boolean
  force?: boolean
}): Promise<void> {
  let sessionId: string | undefined = options.session

  // If no session ID provided, get the most recent completed session
  if (!sessionId) {
    const { data: sessions, error } = await supabase
      .from('coaching_sessions')
      .select('id')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(1)

    if (error || !sessions || sessions.length === 0) {
      console.error('No completed sessions found')
      process.exit(1)
    }

    sessionId = sessions[0].id
    if (!options.json) {
      console.log(`Using most recent session: ${sessionId}`)
    }
  }

  // At this point sessionId is guaranteed to be defined (process.exit above if not)
  const targetSessionId = sessionId as string

  // Check if we already have a result
  if (!options.force && hasResult(targetSessionId)) {
    const existingResult = loadResult(targetSessionId)
    if (existingResult) {
      if (!options.json) {
        console.log('Using cached evaluation result (use --force to re-evaluate)')
      }
      outputResult(existingResult, options.json)
      return
    }
  }

  // Fetch session data
  const session = await getSessionWithMessages(targetSessionId)
  if (!session) {
    console.error(`Session not found: ${targetSessionId}`)
    process.exit(1)
  }

  if (!options.json) {
    console.log(`\nEvaluating session: ${targetSessionId}`)
    console.log(`Problem: ${session.problem.title} (${session.problem.difficulty})`)
    console.log(`Messages: ${session.messages.length}\n`)
  }

  // Run evaluation
  const result = await evaluateSession(session)

  // Save result for future use
  saveResult(result)

  // Output result
  outputResult(result, options.json)
}

async function runBatchEvaluation(options: {
  limit?: number
  json?: boolean
  force?: boolean
}): Promise<void> {
  // Fetch all completed sessions
  let query = supabase
    .from('coaching_sessions')
    .select('id')
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })

  if (options.limit) {
    query = query.limit(options.limit)
  }

  const { data: sessions, error } = await query

  if (error || !sessions || sessions.length === 0) {
    console.error('No completed sessions found')
    process.exit(1)
  }

  const results: BatchResult[] = []
  let succeeded = 0
  let failed = 0
  let skipped = 0

  if (!options.json) {
    console.log(`\nFound ${sessions.length} completed session(s) to evaluate\n`)
  }

  // Create progress bar
  const progressBar = options.json
    ? null
    : new cliProgress.SingleBar(
        {
          format: 'Evaluating [{bar}] {percentage}% | {value}/{total} | {status}',
          hideCursor: true,
        },
        cliProgress.Presets.shades_classic
      )

  progressBar?.start(sessions.length, 0, { status: 'Starting...' })

  for (let i = 0; i < sessions.length; i++) {
    const sessionId = sessions[i].id

    // Check if already evaluated
    if (!options.force && hasResult(sessionId)) {
      results.push({ sessionId, success: true, skipped: true })
      skipped++
      progressBar?.update(i + 1, { status: `Skipped ${sessionId.slice(0, 8)}...` })
      continue
    }

    try {
      progressBar?.update(i, { status: `Evaluating ${sessionId.slice(0, 8)}...` })

      const session = await getSessionWithMessages(sessionId)
      if (!session) {
        results.push({ sessionId, success: false, error: 'Session not found' })
        failed++
        continue
      }

      const result = await evaluateSession(session)
      saveResult(result)

      results.push({ sessionId, success: true })
      succeeded++
      progressBar?.update(i + 1, { status: `Completed ${sessionId.slice(0, 8)}...` })
    } catch (err) {
      const errorMessage = (err as Error).message
      results.push({ sessionId, success: false, error: errorMessage })
      failed++
      progressBar?.update(i + 1, { status: `Failed ${sessionId.slice(0, 8)}...` })
    }
  }

  progressBar?.stop()

  // Output summary
  if (options.json) {
    console.log(
      JSON.stringify(
        {
          total: sessions.length,
          succeeded,
          failed,
          skipped,
          results,
        },
        null,
        2
      )
    )
  } else {
    outputBatchSummary(sessions.length, succeeded, failed, skipped, results)
  }

  // Exit with error code if any failed
  if (failed > 0) {
    process.exit(1)
  }
}

function outputResult(result: EvalResult, asJson?: boolean): void {
  if (asJson) {
    console.log(JSON.stringify(result, null, 2))
    return
  }

  // Create table for criterion scores
  const table = new Table({
    head: ['Criterion', 'Score', 'Summary'],
    colWidths: [28, 8, 50],
    wordWrap: true,
  })

  for (const score of result.scores) {
    // Truncate reasoning to fit in table
    const summary =
      score.reasoning.length > 45
        ? score.reasoning.substring(0, 45) + '...'
        : score.reasoning

    table.push([score.criterion, score.score.toFixed(2), summary])
  }

  // Add separator and overall score
  table.push([
    { content: 'OVERALL', hAlign: 'left' },
    { content: result.overallScore.toFixed(2), hAlign: 'left' },
    { content: 'Weighted aggregate', hAlign: 'left' },
  ])

  console.log(table.toString())
  console.log(`\nSession: ${result.sessionId}`)
  console.log(`Evaluated: ${result.evaluatedAt}`)
}

function outputBatchSummary(
  total: number,
  succeeded: number,
  failed: number,
  skipped: number,
  results: BatchResult[]
): void {
  console.log('\n')
  console.log('Batch Evaluation Complete')
  console.log('=========================')
  console.log(`Total:     ${total}`)
  console.log(`Succeeded: ${succeeded - skipped}`)
  console.log(`Skipped:   ${skipped} (already evaluated)`)
  console.log(`Failed:    ${failed}`)

  const failures = results.filter((r) => !r.success && !r.skipped)
  if (failures.length > 0) {
    console.log('\nFailed sessions:')
    for (const f of failures) {
      console.log(`  - ${f.sessionId}: ${f.error}`)
    }
  }
}

program.parse()
