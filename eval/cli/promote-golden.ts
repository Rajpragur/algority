#!/usr/bin/env node
import 'dotenv/config'
import { Command } from 'commander'
import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'yaml'
import type { GoldenCandidate, GoldenExample } from '../lib/types'

const GOLDEN_DIR = path.join(process.cwd(), 'eval', 'golden')
const CANDIDATES_DIR = path.join(GOLDEN_DIR, 'candidates')
const TRAINING_DIR = path.join(GOLDEN_DIR, 'training')
const HOLDOUT_DIR = path.join(GOLDEN_DIR, 'holdout')

const program = new Command()

// Count files in a directory (excluding .gitkeep)
function countFiles(dir: string): number {
  if (!fs.existsSync(dir)) return 0
  return fs.readdirSync(dir).filter(f => !f.startsWith('.')).length
}

// Determine which set to assign based on current 80/20 ratio
function determineSet(): 'training' | 'holdout' {
  const trainingCount = countFiles(TRAINING_DIR)
  const holdoutCount = countFiles(HOLDOUT_DIR)
  const total = trainingCount + holdoutCount

  if (total === 0) return 'training'

  const holdoutRatio = holdoutCount / total
  // If holdout is under 20%, add to holdout; otherwise add to training
  return holdoutRatio < 0.2 ? 'holdout' : 'training'
}

program
  .name('eval-promote-golden')
  .description('Promote a candidate to the golden dataset')
  .requiredOption('-f, --file <filename>', 'Candidate file to promote (in eval/golden/candidates/)')
  .option('-e, --expected-scores <json>', 'Expected scores as JSON object')
  .option('-s, --set <set>', 'Target set: training or holdout (default: auto-assign)')
  .action(async (options) => {
    try {
      const filename = options.file
      const candidatePath = path.join(CANDIDATES_DIR, filename)

      // Check if candidate file exists
      if (!fs.existsSync(candidatePath)) {
        // Try without path prefix
        const altPath = path.join(CANDIDATES_DIR, path.basename(filename))
        if (!fs.existsSync(altPath)) {
          console.error(`Candidate file not found: ${filename}`)
          console.error(`Expected location: ${candidatePath}`)
          process.exit(1)
        }
      }

      const actualPath = fs.existsSync(candidatePath)
        ? candidatePath
        : path.join(CANDIDATES_DIR, path.basename(filename))

      // Read candidate file
      const content = fs.readFileSync(actualPath, 'utf-8')
      const candidate: GoldenCandidate = actualPath.endsWith('.json')
        ? JSON.parse(content)
        : yaml.parse(content)

      // Parse expected scores if provided
      let expectedScores: Record<string, number> = {}
      if (options.expectedScores) {
        try {
          expectedScores = JSON.parse(options.expectedScores)
        } catch {
          console.error('Invalid JSON for --expected-scores')
          console.error('Example: --expected-scores \'{"relevance": 0.9, "timing": 0.85}\'')
          process.exit(1)
        }
      }

      // Determine target set
      let targetSet: 'training' | 'holdout'
      if (options.set) {
        if (options.set !== 'training' && options.set !== 'holdout') {
          console.error('--set must be "training" or "holdout"')
          process.exit(1)
        }
        targetSet = options.set
      } else {
        targetSet = determineSet()
      }

      const targetDir = targetSet === 'training' ? TRAINING_DIR : HOLDOUT_DIR

      // Ensure target directory exists
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true })
      }

      // Create golden example
      const goldenExample: GoldenExample = {
        ...candidate,
        set: targetSet,
        expected_scores: expectedScores,
        added_at: new Date().toISOString(),
        promoted_from: path.basename(actualPath),
      }

      // Write to target directory
      const outputFilename = `golden-${candidate.session_id}.yaml`
      const outputPath = path.join(targetDir, outputFilename)

      if (fs.existsSync(outputPath)) {
        console.error(`Golden example already exists: ${outputPath}`)
        console.error('Delete it first if you want to re-promote')
        process.exit(1)
      }

      fs.writeFileSync(outputPath, yaml.stringify(goldenExample, { lineWidth: 0 }), 'utf-8')

      // Remove from candidates
      fs.unlinkSync(actualPath)

      // Output success
      console.log(`✓ Promoted ${path.basename(actualPath)} to golden dataset`)
      console.log(`  Set: ${targetSet}`)
      if (Object.keys(expectedScores).length > 0) {
        const scoresStr = Object.entries(expectedScores)
          .map(([k, v]) => `${k}=${v.toFixed(2)}`)
          .join(', ')
        console.log(`  Expected scores: ${scoresStr}`)
      }
      console.log(`  Location: ${outputPath}`)

      // Show current split
      const trainingCount = countFiles(TRAINING_DIR)
      const holdoutCount = countFiles(HOLDOUT_DIR)
      const total = trainingCount + holdoutCount
      const splitPct = total > 0 ? ((trainingCount / total) * 100).toFixed(0) : '0'
      console.log(`\n  Current split: ${trainingCount} training / ${holdoutCount} holdout (${splitPct}/${100 - parseInt(splitPct)})`)
    } catch (error) {
      console.error('Promote failed:', (error as Error).message)
      process.exit(1)
    }
  })

program.parse()
