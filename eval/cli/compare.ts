#!/usr/bin/env node
import 'dotenv/config'
import { Command } from 'commander'
import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'yaml'
import Table from 'cli-table3'
import { evaluateSession } from '../lib/judge'
import { loadConfigFromPath, type CriteriaWeights } from '../lib/config'
import type { GoldenExample, EvalSession, CriterionScore } from '../lib/types'

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

// Map criterion names to config weight keys
const CRITERION_TO_WEIGHT_KEY: Record<string, keyof CriteriaWeights> = {
  'phase-transition-timing': 'phase_transition_timing',
  'question-relevance': 'question_relevance',
  'difficulty-calibration': 'difficulty_calibration',
  'feedback-accuracy': 'feedback_accuracy',
  'recovery-quality': 'recovery_quality',
}

// Calculate weighted score with custom weights
function calculateWeightedScore(scores: CriterionScore[], weights: CriteriaWeights): number {
  let totalWeight = 0
  let weightedSum = 0

  for (const score of scores) {
    const weightKey = CRITERION_TO_WEIGHT_KEY[score.criterion]
    if (weightKey) {
      const weight = weights[weightKey]
      weightedSum += score.score * weight
      totalWeight += weight
    }
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0
}

program
  .name('eval-compare')
  .description('Compare two config versions against golden dataset')
  .requiredOption('-a, --config-a <path>', 'First config file')
  .requiredOption('-b, --config-b <path>', 'Second config file')
  .option('--holdout-only', 'Only use holdout set')
  .option('--training-only', 'Only use training set')
  .option('-j, --json', 'Output as JSON')
  .action(async (options) => {
    try {
      // Load both configs
      const configA = loadConfigFromPath(options.configA)
      const configB = loadConfigFromPath(options.configB)

      // Determine which sets to use
      let dirs: string[] = []
      if (options.holdoutOnly) {
        dirs = [HOLDOUT_DIR]
      } else if (options.trainingOnly) {
        dirs = [TRAINING_DIR]
      } else {
        dirs = [TRAINING_DIR, HOLDOUT_DIR]
      }

      // Collect all examples
      const examples: { filepath: string; example: GoldenExample }[] = []
      for (const dir of dirs) {
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
        console.log('No golden examples found.')
        return
      }

      if (!options.json) {
        console.log('\nA/B Config Comparison')
        console.log('=====================')
        console.log(`Config A: ${options.configA}`)
        console.log(`Config B: ${options.configB}`)
        console.log(`Sessions: ${examples.length} (${options.holdoutOnly ? 'holdout' : options.trainingOnly ? 'training' : 'all'})`)
        console.log('')
      }

      // Aggregate scores per criterion
      const criterionScoresA: Record<string, number[]> = {}
      const criterionScoresB: Record<string, number[]> = {}
      const overallScoresA: number[] = []
      const overallScoresB: number[] = []

      // Evaluate each example
      for (const { filepath, example } of examples) {
        if (!options.json) {
          console.log(`Evaluating: ${path.basename(filepath)}`)
        }

        const session = toEvalSession(example)
        const result = await evaluateSession(session)

        // Calculate weighted scores with each config's weights
        const scoreA = calculateWeightedScore(result.scores, configA.criteria_weights)
        const scoreB = calculateWeightedScore(result.scores, configB.criteria_weights)

        overallScoresA.push(scoreA)
        overallScoresB.push(scoreB)

        // Collect per-criterion scores (same for both configs since same evaluation)
        for (const score of result.scores) {
          if (!criterionScoresA[score.criterion]) {
            criterionScoresA[score.criterion] = []
            criterionScoresB[score.criterion] = []
          }
          criterionScoresA[score.criterion].push(score.score)
          criterionScoresB[score.criterion].push(score.score)
        }
      }

      // Calculate averages
      const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length

      const avgOverallA = avg(overallScoresA)
      const avgOverallB = avg(overallScoresB)

      // Build results
      const results: {
        criterion: string
        avgA: number
        avgB: number
        delta: number
        winner: 'A' | 'B' | 'tie'
      }[] = []

      for (const criterion of Object.keys(criterionScoresA)) {
        const avgA = avg(criterionScoresA[criterion])
        const avgB = avg(criterionScoresB[criterion])
        const delta = avgB - avgA
        const winner = Math.abs(delta) < 0.01 ? 'tie' : delta > 0 ? 'B' : 'A'
        results.push({ criterion, avgA, avgB, delta, winner })
      }

      // JSON output
      if (options.json) {
        console.log(JSON.stringify({
          configA: options.configA,
          configB: options.configB,
          sessions: examples.length,
          criteria: results,
          overall: {
            configA: avgOverallA,
            configB: avgOverallB,
            delta: avgOverallB - avgOverallA,
            winner: Math.abs(avgOverallB - avgOverallA) < 0.01 ? 'tie' : avgOverallB > avgOverallA ? 'B' : 'A',
          },
        }, null, 2))
        return
      }

      // Display table
      console.log('\nResults')
      const table = new Table({
        head: ['Criterion', 'Config A', 'Config B', 'Delta', 'Winner'],
        colWidths: [28, 10, 10, 10, 8],
      })

      for (const r of results) {
        table.push([
          r.criterion,
          r.avgA.toFixed(3),
          r.avgB.toFixed(3),
          (r.delta >= 0 ? '+' : '') + r.delta.toFixed(3),
          r.winner === 'tie' ? '-' : r.winner,
        ])
      }

      // Overall row
      const overallDelta = avgOverallB - avgOverallA
      const overallWinner = Math.abs(overallDelta) < 0.01 ? 'tie' : overallDelta > 0 ? 'B' : 'A'
      table.push([
        { content: 'OVERALL (weighted)', hAlign: 'left' },
        avgOverallA.toFixed(3),
        avgOverallB.toFixed(3),
        (overallDelta >= 0 ? '+' : '') + overallDelta.toFixed(3),
        overallWinner === 'tie' ? '-' : overallWinner,
      ])

      console.log(table.toString())

      // Summary
      if (overallWinner === 'tie') {
        console.log('\nSummary: Configs are equivalent (delta < 0.01)')
      } else {
        console.log(`\nSummary: Config ${overallWinner} scores higher overall (${overallDelta >= 0 ? '+' : ''}${overallDelta.toFixed(3)})`)
      }

      // Show weight differences
      console.log('\nWeight Comparison:')
      const weightTable = new Table({
        head: ['Criterion', 'Config A', 'Config B'],
        colWidths: [28, 12, 12],
      })

      for (const [name, key] of Object.entries(CRITERION_TO_WEIGHT_KEY)) {
        weightTable.push([
          name,
          configA.criteria_weights[key].toFixed(2),
          configB.criteria_weights[key].toFixed(2),
        ])
      }
      console.log(weightTable.toString())
    } catch (error) {
      console.error('Comparison failed:', (error as Error).message)
      process.exit(1)
    }
  })

program.parse()
