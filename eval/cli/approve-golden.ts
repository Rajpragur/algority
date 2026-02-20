#!/usr/bin/env node
import 'dotenv/config'
import { Command } from 'commander'
import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'yaml'
import { supabase } from '../lib/supabase'
import type { GoldenCandidate, GoldenExample } from '../lib/types'

const GOLDEN_DIR = path.join(process.cwd(), 'eval', 'golden')
const TRAINING_DIR = path.join(GOLDEN_DIR, 'training')
const HOLDOUT_DIR = path.join(GOLDEN_DIR, 'holdout')

const program = new Command()

interface SessionRow {
  id: string
  golden_labels: string[] | null
  contributor_notes: string | null
  submitted_as_golden_at: string | null
  review_status: string | null
  started_at: string
  completed_at: string | null
  current_phase: string
  problems: {
    id: number
    title: string
    difficulty: string
    problem_description: string
  }
  coaching_messages: Array<{
    type: string
    phase: string
    content: string
    options: string[] | null
    is_correct: boolean | null
    created_at: string
  }>
}

// Count files in a directory (excluding hidden files)
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
  return holdoutRatio < 0.2 ? 'holdout' : 'training'
}

program
  .name('eval-approve-golden')
  .description('Approve a contributed session and add to golden dataset')
  .requiredOption('-s, --session <id>', 'Session ID to approve')
  .option('-e, --expected-scores <json>', 'Expected scores as JSON object')
  .option('--set <set>', 'Target set: training or holdout (default: auto-assign)')
  .option('-n, --notes <notes>', 'Review notes')
  .action(async (options) => {
    try {
      const sessionId = options.session

      // Fetch the session with full context
      const { data: session, error } = await supabase
        .from('coaching_sessions')
        .select(`
          id,
          golden_labels,
          contributor_notes,
          submitted_as_golden_at,
          review_status,
          started_at,
          completed_at,
          current_phase,
          problems (id, title, difficulty, problem_description),
          coaching_messages (type, phase, content, options, is_correct, created_at)
        `)
        .eq('id', sessionId)
        .single()

      if (error || !session) {
        console.error(`Session not found: ${sessionId}`)
        process.exit(1)
      }

      const typedSession = session as unknown as SessionRow

      // Check if it's a golden candidate
      if (!typedSession.submitted_as_golden_at) {
        console.error('This session was not submitted as a golden candidate.')
        process.exit(1)
      }

      // Check if already reviewed
      if (typedSession.review_status === 'approved') {
        console.error('This session has already been approved.')
        process.exit(1)
      }

      if (typedSession.review_status === 'rejected') {
        console.error('This session was rejected. Unset review_status first if you want to approve.')
        process.exit(1)
      }

      // Parse expected scores
      let expectedScores: Record<string, number> = {}
      if (options.expectedScores) {
        try {
          expectedScores = JSON.parse(options.expectedScores)
        } catch {
          console.error('Invalid JSON for --expected-scores')
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

      // Sort messages by created_at
      const sortedMessages = [...typedSession.coaching_messages].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )

      // Extract unique phases
      const phasesCompleted = [...new Set(sortedMessages.map(m => m.phase))]

      // Build candidate object
      const candidate: GoldenCandidate = {
        session_id: typedSession.id,
        exported_at: new Date().toISOString(),
        labels: typedSession.golden_labels || [],
        problem: {
          id: typedSession.problems.id,
          title: typedSession.problems.title,
          difficulty: typedSession.problems.difficulty,
          description: typedSession.problems.problem_description,
        },
        transcript: sortedMessages.map(m => ({
          type: m.type,
          phase: m.phase,
          content: m.content || '',
          ...(m.options && { options: m.options }),
          ...(m.is_correct !== null && { is_correct: m.is_correct }),
        })),
        metadata: {
          started_at: typedSession.started_at,
          completed_at: typedSession.completed_at,
          message_count: sortedMessages.length,
          phases_completed: phasesCompleted,
        },
      }

      // Create golden example
      const goldenExample: GoldenExample = {
        ...candidate,
        set: targetSet,
        expected_scores: expectedScores,
        added_at: new Date().toISOString(),
        promoted_from: `contribution-${typedSession.id}`,
      }

      // Write to golden dataset
      const outputFilename = `golden-${typedSession.id}.yaml`
      const outputPath = path.join(targetDir, outputFilename)

      if (fs.existsSync(outputPath)) {
        console.error(`Golden example already exists: ${outputPath}`)
        process.exit(1)
      }

      fs.writeFileSync(outputPath, yaml.stringify(goldenExample, { lineWidth: 0 }), 'utf-8')

      // Update session in database
      const { error: updateError } = await supabase
        .from('coaching_sessions')
        .update({
          review_status: 'approved',
          review_notes: options.notes || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', sessionId)

      if (updateError) {
        console.error('Failed to update review status:', updateError.message)
        // Clean up the file we just wrote
        fs.unlinkSync(outputPath)
        process.exit(1)
      }

      // Success output
      console.log(`\n✓ Approved contribution: ${sessionId}`)
      console.log(`  Problem: ${typedSession.problems.title}`)
      console.log(`  Set: ${targetSet}`)
      console.log(`  Location: ${outputPath}`)
      if (typedSession.contributor_notes) {
        console.log(`  Contributor notes: ${typedSession.contributor_notes}`)
      }

      // Show current split
      const trainingCount = countFiles(TRAINING_DIR)
      const holdoutCount = countFiles(HOLDOUT_DIR)
      const total = trainingCount + holdoutCount
      const splitPct = total > 0 ? ((trainingCount / total) * 100).toFixed(0) : '0'
      console.log(`\n  Current split: ${trainingCount} training / ${holdoutCount} holdout (${splitPct}/${100 - parseInt(splitPct)})`)
    } catch (error) {
      console.error('Approval failed:', (error as Error).message)
      process.exit(1)
    }
  })

program.parse()
