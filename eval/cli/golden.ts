#!/usr/bin/env node
import 'dotenv/config'
import { Command } from 'commander'
import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'yaml'
import Table from 'cli-table3'
import { evaluateSession } from '../lib/judge'
import type { GoldenExample, EvalSession } from '../lib/types'

const GOLDEN_DIR = path.join(process.cwd(), 'eval', 'golden')
const TRAINING_DIR = path.join(GOLDEN_DIR, 'training')
const HOLDOUT_DIR = path.join(GOLDEN_DIR, 'holdout')

const program = new Command()

// Get all YAML files in a directory
function getYamlFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
}

// Load a golden example from file
function loadExample(filepath: string): GoldenExample | null {
  try {
    const content = fs.readFileSync(filepath, 'utf-8')
    return yaml.parse(content) as GoldenExample
  } catch {
    return null
  }
}

// Convert golden example to EvalSession format
function toEvalSession(example: GoldenExample): EvalSession {
  return {
    sessionId: example.session_id,
    problem: {
      id: example.problem.id,
      title: example.problem.title,
      difficulty: example.problem.difficulty,
      description: example.problem.description,
    },
    messages: example.transcript.map(m => ({
      type: m.type,
      content: m.content,
      isCorrect: m.is_correct,
    })),
    phases: {
      started: example.metadata.phases_completed,
      completed: example.metadata.phases_completed,
    },
  }
}

interface ValidationResult {
  filename: string
  example: GoldenExample
  scores: Record<string, { expected: number; actual: number; delta: number; passed: boolean }>
  overallPassed: boolean
}

program
  .name('eval-golden')
  .description('Evaluate against golden dataset')
  .option('--holdout-only', 'Only evaluate holdout set')
  .option('--training-only', 'Only evaluate training set')
  .option('-t, --tolerance <number>', 'Score tolerance for pass/fail', '0.1')
  .option('-j, --json', 'Output as JSON')
  .action(async (options) => {
    try {
      const tolerance = parseFloat(options.tolerance)

      // Determine which sets to evaluate
      let dirs: { dir: string; name: string }[] = []
      if (options.holdoutOnly) {
        dirs = [{ dir: HOLDOUT_DIR, name: 'holdout' }]
      } else if (options.trainingOnly) {
        dirs = [{ dir: TRAINING_DIR, name: 'training' }]
      } else {
        dirs = [
          { dir: TRAINING_DIR, name: 'training' },
          { dir: HOLDOUT_DIR, name: 'holdout' },
        ]
      }

      // Collect all examples to evaluate
      const examples: { filepath: string; example: GoldenExample }[] = []
      for (const { dir } of dirs) {
        const files = getYamlFiles(dir)
        for (const file of files) {
          const filepath = path.join(dir, file)
          const example = loadExample(filepath)
          if (example) {
            examples.push({ filepath, example })
          }
        }
      }

      if (examples.length === 0) {
        console.log('No golden examples found to evaluate.')
        console.log('Use eval:promote-golden to add examples to the golden dataset.')
        return
      }

      // Filter to only examples with expected scores
      const examplesWithScores = examples.filter(
        e => e.example.expected_scores && Object.keys(e.example.expected_scores).length > 0
      )

      if (!options.json) {
        console.log('\nGolden Dataset Validation')
        console.log('=========================')
        console.log(`Mode: ${options.holdoutOnly ? 'Holdout Only' : options.trainingOnly ? 'Training Only' : 'All'}`)
        console.log(`Tolerance: ${tolerance.toFixed(2)}`)
        console.log(`\nEvaluating ${examples.length} example(s)...`)
        if (examplesWithScores.length < examples.length) {
          console.log(`  (${examples.length - examplesWithScores.length} without expected scores - will evaluate but not compare)`)
        }
        console.log('')
      }

      const results: ValidationResult[] = []
      let totalPassed = 0
      let totalWithScores = 0

      for (const { filepath, example } of examples) {
        const filename = path.basename(filepath)
        const session = toEvalSession(example)

        if (!options.json) {
          console.log(`Evaluating: ${filename}`)
          console.log(`  Problem: ${example.problem.title} (${example.problem.difficulty})`)
        }

        // Run evaluation
        const evalResult = await evaluateSession(session)

        // Compare with expected scores if available
        const hasExpectedScores = example.expected_scores && Object.keys(example.expected_scores).length > 0
        const scores: Record<string, { expected: number; actual: number; delta: number; passed: boolean }> = {}
        let allPassed = true

        if (hasExpectedScores) {
          totalWithScores++

          for (const score of evalResult.scores) {
            const criterionKey = score.criterion.replace(/-/g, '_')
            const expected = example.expected_scores[criterionKey] ?? example.expected_scores[score.criterion]

            if (expected !== undefined) {
              const delta = score.score - expected
              const passed = Math.abs(delta) <= tolerance
              scores[score.criterion] = { expected, actual: score.score, delta, passed }
              if (!passed) allPassed = false
            }
          }

          if (allPassed) totalPassed++
        }

        results.push({
          filename,
          example,
          scores,
          overallPassed: hasExpectedScores ? allPassed : true,
        })

        // Display table for this example
        if (!options.json && hasExpectedScores) {
          const table = new Table({
            head: ['Criterion', 'Expected', 'Actual', 'Delta', 'Status'],
            colWidths: [28, 10, 10, 10, 8],
          })

          for (const [criterion, data] of Object.entries(scores)) {
            table.push([
              criterion,
              data.expected.toFixed(2),
              data.actual.toFixed(2),
              (data.delta >= 0 ? '+' : '') + data.delta.toFixed(2),
              data.passed ? '✓' : '✗',
            ])
          }

          console.log(table.toString())
          console.log(`  Result: ${allPassed ? 'PASS ✓' : 'FAIL ✗'}\n`)
        } else if (!options.json) {
          console.log(`  Overall score: ${evalResult.overallScore.toFixed(2)}`)
          console.log(`  (No expected scores to compare)\n`)
        }
      }

      // Summary
      if (options.json) {
        console.log(JSON.stringify({
          mode: options.holdoutOnly ? 'holdout' : options.trainingOnly ? 'training' : 'all',
          tolerance,
          total: examples.length,
          withExpectedScores: totalWithScores,
          passed: totalPassed,
          failed: totalWithScores - totalPassed,
          status: totalWithScores === 0 || totalPassed === totalWithScores ? 'PASS' : 'FAIL',
          results: results.map(r => ({
            filename: r.filename,
            sessionId: r.example.session_id,
            scores: r.scores,
            passed: r.overallPassed,
          })),
        }, null, 2))
      } else {
        console.log('Summary')
        console.log('=======')
        console.log(`Total evaluated: ${examples.length}`)
        if (totalWithScores > 0) {
          console.log(`With expected scores: ${totalWithScores}`)
          console.log(`Passed: ${totalPassed}/${totalWithScores}`)
          const overallPass = totalPassed === totalWithScores
          console.log(`Status: ${overallPass ? 'PASS ✓' : 'FAIL ✗'}`)

          // Exit with error if validation failed
          if (!overallPass) {
            process.exit(1)
          }
        } else {
          console.log('No examples have expected scores to validate against.')
          console.log('Add --expected-scores when promoting candidates to enable validation.')
        }
      }
    } catch (error) {
      console.error('Validation failed:', (error as Error).message)
      process.exit(1)
    }
  })

program.parse()
