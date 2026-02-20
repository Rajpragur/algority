#!/usr/bin/env node
import 'dotenv/config'
import { Command } from 'commander'
import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'yaml'
import type { GoldenExample } from '../lib/types'

const GOLDEN_DIR = path.join(process.cwd(), 'eval', 'golden')
const TRAINING_DIR = path.join(GOLDEN_DIR, 'training')
const HOLDOUT_DIR = path.join(GOLDEN_DIR, 'holdout')
const CANDIDATES_DIR = path.join(GOLDEN_DIR, 'candidates')

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

program
  .name('eval-golden-stats')
  .description('Show golden dataset statistics')
  .option('-j, --json', 'Output as JSON')
  .action(async (options) => {
    try {
      const trainingFiles = getYamlFiles(TRAINING_DIR)
      const holdoutFiles = getYamlFiles(HOLDOUT_DIR)
      const candidateFiles = getYamlFiles(CANDIDATES_DIR)

      const trainingCount = trainingFiles.length
      const holdoutCount = holdoutFiles.length
      const candidateCount = candidateFiles.length
      const total = trainingCount + holdoutCount

      // Calculate split percentages
      const trainingPct = total > 0 ? (trainingCount / total) * 100 : 0
      const holdoutPct = total > 0 ? (holdoutCount / total) * 100 : 0

      // Check for drift (target is 80/20, warn if beyond 85/15 or 75/25)
      const hasDrift = total > 0 && (trainingPct > 85 || trainingPct < 75)

      // Collect labels from all examples
      const labelCounts: Record<string, number> = {}
      const allFiles = [
        ...trainingFiles.map(f => path.join(TRAINING_DIR, f)),
        ...holdoutFiles.map(f => path.join(HOLDOUT_DIR, f)),
      ]

      for (const filepath of allFiles) {
        const example = loadExample(filepath)
        if (example?.labels) {
          for (const label of example.labels) {
            labelCounts[label] = (labelCounts[label] || 0) + 1
          }
        }
      }

      // JSON output
      if (options.json) {
        console.log(JSON.stringify({
          training: trainingCount,
          holdout: holdoutCount,
          candidates: candidateCount,
          total,
          split: {
            training: trainingPct,
            holdout: holdoutPct,
          },
          hasDrift,
          labels: labelCounts,
        }, null, 2))
        return
      }

      // Human-readable output
      console.log('\nGolden Dataset Statistics')
      console.log('=========================')
      console.log(`Training:   ${trainingCount} examples`)
      console.log(`Holdout:    ${holdoutCount} examples`)
      console.log(`Total:      ${total} examples`)
      console.log(`Candidates: ${candidateCount} pending`)

      if (total > 0) {
        const splitStatus = hasDrift ? '⚠' : '✓'
        console.log(`\nSplit: ${trainingPct.toFixed(0)}% / ${holdoutPct.toFixed(0)}% ${splitStatus}`)

        if (hasDrift) {
          console.log(`\n⚠ Warning: Split has drifted from target 80/20`)
          console.log(`  Run 'npm run eval:rebalance-golden' to restore balance`)
        }
      } else {
        console.log('\nNo golden examples yet. Use eval:promote-golden to add some.')
      }

      // Show label distribution if any
      const sortedLabels = Object.entries(labelCounts).sort((a, b) => b[1] - a[1])
      if (sortedLabels.length > 0) {
        console.log('\nLabels distribution:')
        for (const [label, count] of sortedLabels) {
          console.log(`  ${label}: ${count}`)
        }
      }

      console.log('')
    } catch (error) {
      console.error('Stats failed:', (error as Error).message)
      process.exit(1)
    }
  })

program.parse()
