#!/usr/bin/env node
import 'dotenv/config'
import { Command } from 'commander'
import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'yaml'
import Table from 'cli-table3'
import { loadAllResults } from '../lib/storage'
import { mean } from '../lib/stats'
import { getProductionConfig } from '../lib/config'
import type { GoldenExample, CriterionDrift, DriftReport } from '../lib/types'

const GOLDEN_DIR = path.join(process.cwd(), 'eval', 'golden')
const TRAINING_DIR = path.join(GOLDEN_DIR, 'training')
const HOLDOUT_DIR = path.join(GOLDEN_DIR, 'holdout')

const CRITERIA = [
  'phase-transition-timing',
  'question-relevance',
  'difficulty-calibration',
  'feedback-accuracy',
  'recovery-quality',
] as const

const program = new Command()

// Get all YAML files in a directory
function getYamlFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
}

// Load a golden example from file
function loadGoldenExample(filepath: string): GoldenExample | null {
  try {
    const content = fs.readFileSync(filepath, 'utf-8')
    return yaml.parse(content) as GoldenExample
  } catch {
    return null
  }
}

// Load all golden examples (training + holdout)
function loadAllGoldenExamples(): GoldenExample[] {
  const examples: GoldenExample[] = []

  for (const dir of [TRAINING_DIR, HOLDOUT_DIR]) {
    const files = getYamlFiles(dir)
    for (const file of files) {
      const example = loadGoldenExample(path.join(dir, file))
      if (example) {
        examples.push(example)
      }
    }
  }

  return examples
}

// Calculate baseline stats from golden examples
function calculateGoldenBaseline(examples: GoldenExample[]): Map<string, number> {
  const scoresByCriterion = new Map<string, number[]>()

  for (const criterion of CRITERIA) {
    scoresByCriterion.set(criterion, [])
  }

  for (const example of examples) {
    if (example.expected_scores) {
      for (const [criterion, score] of Object.entries(example.expected_scores)) {
        const scores = scoresByCriterion.get(criterion)
        if (scores) {
          scores.push(score)
        }
      }
    }
  }

  const means = new Map<string, number>()
  for (const [criterion, scores] of scoresByCriterion) {
    means.set(criterion, scores.length > 0 ? mean(scores) : 0)
  }

  return means
}

// Calculate production stats from eval results
function calculateProductionStats(): Map<string, number> {
  const results = loadAllResults()
  const scoresByCriterion = new Map<string, number[]>()

  for (const criterion of CRITERIA) {
    scoresByCriterion.set(criterion, [])
  }

  for (const result of results) {
    for (const score of result.scores) {
      const scores = scoresByCriterion.get(score.criterion)
      if (scores) {
        scores.push(score.score)
      }
    }
  }

  const means = new Map<string, number>()
  for (const [criterion, scores] of scoresByCriterion) {
    means.set(criterion, scores.length > 0 ? mean(scores) : 0)
  }

  return means
}

// Calculate drift between baseline and production
function calculateDrift(
  baseline: Map<string, number>,
  production: Map<string, number>
): CriterionDrift[] {
  const drifts: CriterionDrift[] = []

  for (const criterion of CRITERIA) {
    const baselineScore = baseline.get(criterion) || 0
    const productionScore = production.get(criterion) || 0
    const drift = productionScore - baselineScore
    const relativeDrift = baselineScore !== 0
      ? (drift / baselineScore) * 100
      : 0

    drifts.push({
      criterion,
      baseline: baselineScore,
      production: productionScore,
      drift,
      relativeDrift,
    })
  }

  return drifts
}

// Calculate overall drift from criterion drifts
function calculateOverallDrift(drifts: CriterionDrift[]): CriterionDrift {
  const baseline = mean(drifts.map(d => d.baseline))
  const production = mean(drifts.map(d => d.production))
  const drift = production - baseline
  const relativeDrift = baseline !== 0 ? (drift / baseline) * 100 : 0

  return {
    criterion: 'OVERALL',
    baseline,
    production,
    drift,
    relativeDrift,
  }
}

// Send webhook alert when drift exceeds threshold
async function sendWebhookAlert(
  webhookUrl: string,
  report: DriftReport,
  exceedingCriteria: CriterionDrift[]
): Promise<void> {
  const payload = {
    type: 'drift_alert',
    timestamp: report.generatedAt,
    threshold: report.threshold,
    goldenCount: report.goldenCount,
    productionCount: report.productionCount,
    exceedingCriteria: exceedingCriteria.map(c => ({
      criterion: c.criterion,
      baseline: c.baseline,
      production: c.production,
      drift: c.drift,
      relativeDrift: c.relativeDrift,
    })),
    overallDrift: {
      baseline: report.overallDrift.baseline,
      production: report.overallDrift.production,
      drift: report.overallDrift.drift,
      relativeDrift: report.overallDrift.relativeDrift,
    },
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.error(`Webhook alert failed: ${response.status} ${response.statusText}`)
    } else {
      console.log(`Webhook alert sent to ${webhookUrl}`)
    }
  } catch (error) {
    console.error(`Webhook alert failed: ${(error as Error).message}`)
  }
}

program
  .name('eval-drift-check')
  .description('Detect drift between production and golden baseline')
  .option('-j, --json', 'Output as JSON')
  .option('-t, --threshold <number>', 'Drift threshold to trigger warning (default: from config)', parseFloat)
  .action(async (options) => {
    try {
      // Load golden examples
      const goldenExamples = loadAllGoldenExamples()
      if (goldenExamples.length === 0) {
        console.log('No golden examples found. Add examples to eval/golden/training/ or eval/golden/holdout/')
        process.exit(0)
      }

      // Load production results
      const results = loadAllResults()
      if (results.length === 0) {
        console.log('No production evaluation results found. Run eval:check first.')
        process.exit(0)
      }

      // Calculate stats
      const baseline = calculateGoldenBaseline(goldenExamples)
      const production = calculateProductionStats()
      const criterionDrifts = calculateDrift(baseline, production)
      const overallDrift = calculateOverallDrift(criterionDrifts)

      // Get config
      const productionConfig = getProductionConfig()
      const threshold = options.threshold ?? productionConfig.drift_threshold

      // Check if any criterion exceeds threshold
      const exceedingCriteria = criterionDrifts.filter(d => Math.abs(d.drift) > threshold)
      const exceedsThreshold = exceedingCriteria.length > 0 || Math.abs(overallDrift.drift) > threshold

      // Build report
      const report: DriftReport = {
        generatedAt: new Date().toISOString(),
        goldenCount: goldenExamples.length,
        productionCount: results.length,
        criterionDrifts,
        overallDrift,
        exceedsThreshold,
        threshold,
      }

      // JSON output
      if (options.json) {
        console.log(JSON.stringify(report, null, 2))

        // Send webhook alert if configured and threshold exceeded
        if (exceedsThreshold && productionConfig.alert_webhook_url) {
          await sendWebhookAlert(productionConfig.alert_webhook_url, report, exceedingCriteria)
        }

        process.exit(exceedsThreshold ? 1 : 0)
      }

      // Table output
      console.log('\nProduction Drift Check')
      console.log('======================')
      console.log(`Golden baseline: ${goldenExamples.length} examples`)
      console.log(`Production samples: ${results.length} sessions`)
      console.log(`Drift threshold: ${threshold}`)
      console.log('')

      const table = new Table({
        head: ['Criterion', 'Baseline', 'Production', 'Drift', 'Relative'],
        colWidths: [28, 10, 12, 10, 10],
      })

      for (const d of criterionDrifts) {
        const driftStr = (d.drift >= 0 ? '+' : '') + d.drift.toFixed(3)
        const relStr = (d.relativeDrift >= 0 ? '+' : '') + d.relativeDrift.toFixed(1) + '%'
        const exceedsMarker = Math.abs(d.drift) > threshold ? ' ⚠' : ''
        table.push([
          d.criterion + exceedsMarker,
          d.baseline.toFixed(3),
          d.production.toFixed(3),
          driftStr,
          relStr,
        ])
      }

      // Overall row
      const overallDriftStr = (overallDrift.drift >= 0 ? '+' : '') + overallDrift.drift.toFixed(3)
      const overallRelStr = (overallDrift.relativeDrift >= 0 ? '+' : '') + overallDrift.relativeDrift.toFixed(1) + '%'
      const overallExceeds = Math.abs(overallDrift.drift) > threshold ? ' ⚠' : ''
      table.push([
        'OVERALL' + overallExceeds,
        overallDrift.baseline.toFixed(3),
        overallDrift.production.toFixed(3),
        overallDriftStr,
        overallRelStr,
      ])

      console.log(table.toString())
      console.log('')

      // Status summary
      if (exceedsThreshold) {
        const count = exceedingCriteria.length + (Math.abs(overallDrift.drift) > threshold ? 1 : 0)
        console.log(`Status: ⚠ WARNING - drift exceeds threshold (${threshold}) on ${count} criterion(s)`)

        // Send webhook alert if configured
        if (productionConfig.alert_webhook_url) {
          await sendWebhookAlert(productionConfig.alert_webhook_url, report, exceedingCriteria)
        }

        process.exit(1)
      } else {
        console.log(`Status: ✓ OK - all criteria within threshold (${threshold})`)
        process.exit(0)
      }
    } catch (error) {
      console.error('Drift check failed:', (error as Error).message)
      process.exit(1)
    }
  })

program.parse()
