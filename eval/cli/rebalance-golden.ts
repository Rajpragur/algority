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

const program = new Command()

// Get all YAML files in a directory
function getYamlFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
}

// Calculate rebalance moves
function calculateRebalance(training: number, holdout: number): {
  moveToHoldout: number
  moveToTraining: number
} {
  const total = training + holdout
  if (total === 0) return { moveToHoldout: 0, moveToTraining: 0 }

  const targetHoldout = Math.round(total * 0.2)
  const targetTraining = total - targetHoldout

  return {
    moveToHoldout: Math.max(0, training - targetTraining),
    moveToTraining: Math.max(0, holdout - targetHoldout),
  }
}

// Move a file and update its 'set' field
function moveExample(
  filename: string,
  fromDir: string,
  toDir: string,
  newSet: 'training' | 'holdout'
): void {
  const fromPath = path.join(fromDir, filename)
  const toPath = path.join(toDir, filename)

  // Read and update the example
  const content = fs.readFileSync(fromPath, 'utf-8')
  const example = yaml.parse(content) as GoldenExample
  example.set = newSet

  // Write to new location
  fs.writeFileSync(toPath, yaml.stringify(example, { lineWidth: 0 }), 'utf-8')

  // Remove from old location
  fs.unlinkSync(fromPath)
}

program
  .name('eval-rebalance-golden')
  .description('Rebalance golden dataset to restore 80/20 split')
  .option('-d, --dry-run', 'Show what would be moved without making changes')
  .action(async (options) => {
    try {
      const trainingFiles = getYamlFiles(TRAINING_DIR)
      const holdoutFiles = getYamlFiles(HOLDOUT_DIR)

      const trainingCount = trainingFiles.length
      const holdoutCount = holdoutFiles.length
      const total = trainingCount + holdoutCount

      if (total === 0) {
        console.log('No golden examples to rebalance.')
        return
      }

      const currentTrainingPct = (trainingCount / total) * 100
      const currentHoldoutPct = (holdoutCount / total) * 100

      console.log('\nCurrent Split')
      console.log('=============')
      console.log(`Training: ${trainingCount} (${currentTrainingPct.toFixed(0)}%)`)
      console.log(`Holdout:  ${holdoutCount} (${currentHoldoutPct.toFixed(0)}%)`)

      const { moveToHoldout, moveToTraining } = calculateRebalance(trainingCount, holdoutCount)

      if (moveToHoldout === 0 && moveToTraining === 0) {
        console.log('\n✓ Dataset is already balanced (within target range)')
        return
      }

      // Calculate target
      const targetHoldout = Math.round(total * 0.2)
      const targetTraining = total - targetHoldout

      console.log(`\nTarget Split`)
      console.log(`============`)
      console.log(`Training: ${targetTraining} (${((targetTraining / total) * 100).toFixed(0)}%)`)
      console.log(`Holdout:  ${targetHoldout} (${((targetHoldout / total) * 100).toFixed(0)}%)`)

      if (moveToHoldout > 0) {
        console.log(`\nAction: Move ${moveToHoldout} example(s) from training → holdout`)

        // Select files to move (oldest first based on filename sort)
        const filesToMove = trainingFiles.slice(0, moveToHoldout)

        if (options.dryRun) {
          console.log('\n[DRY RUN] Would move:')
          for (const file of filesToMove) {
            console.log(`  ${file}`)
          }
        } else {
          console.log('\nMoving:')
          for (const file of filesToMove) {
            moveExample(file, TRAINING_DIR, HOLDOUT_DIR, 'holdout')
            console.log(`  ✓ ${file}`)
          }
        }
      }

      if (moveToTraining > 0) {
        console.log(`\nAction: Move ${moveToTraining} example(s) from holdout → training`)

        // Select files to move
        const filesToMove = holdoutFiles.slice(0, moveToTraining)

        if (options.dryRun) {
          console.log('\n[DRY RUN] Would move:')
          for (const file of filesToMove) {
            console.log(`  ${file}`)
          }
        } else {
          console.log('\nMoving:')
          for (const file of filesToMove) {
            moveExample(file, HOLDOUT_DIR, TRAINING_DIR, 'training')
            console.log(`  ✓ ${file}`)
          }
        }
      }

      if (!options.dryRun) {
        // Show final state
        const newTraining = getYamlFiles(TRAINING_DIR).length
        const newHoldout = getYamlFiles(HOLDOUT_DIR).length
        console.log(`\n✓ Rebalance complete`)
        console.log(`  Training: ${newTraining} (${((newTraining / total) * 100).toFixed(0)}%)`)
        console.log(`  Holdout:  ${newHoldout} (${((newHoldout / total) * 100).toFixed(0)}%)`)
      } else {
        console.log('\n[DRY RUN] No changes made. Remove --dry-run to apply.')
      }
    } catch (error) {
      console.error('Rebalance failed:', (error as Error).message)
      process.exit(1)
    }
  })

program.parse()
