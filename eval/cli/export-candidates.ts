#!/usr/bin/env node
import 'dotenv/config'
import { Command } from 'commander'
import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'yaml'
import { supabase } from '../lib/supabase'
import type { GoldenCandidate } from '../lib/types'

const CANDIDATES_DIR = path.join(process.cwd(), 'eval', 'golden', 'candidates')

const program = new Command()

interface SessionRow {
  id: string
  golden_labels: string[] | null
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

program
  .name('eval-export-candidates')
  .description('Export golden candidates for review')
  .option('-f, --format <format>', 'Output format: yaml, json', 'yaml')
  .option('--overwrite', 'Overwrite existing files')
  .action(async (options) => {
    try {
      // Fetch all golden candidates with full context
      const { data: sessions, error } = await supabase
        .from('coaching_sessions')
        .select(`
          id,
          golden_labels,
          started_at,
          completed_at,
          current_phase,
          problems (id, title, difficulty, problem_description),
          coaching_messages (type, phase, content, options, is_correct, created_at)
        `)
        .eq('is_golden_candidate', true)
        .order('started_at', { ascending: false })

      if (error) {
        console.error('Failed to fetch candidates:', error.message)
        process.exit(1)
      }

      if (!sessions || sessions.length === 0) {
        console.log('No golden candidates found.')
        console.log('Use eval:add-golden to flag sessions as candidates.')
        return
      }

      console.log(`Found ${sessions.length} golden candidate(s)\n`)

      // Ensure output directory exists
      if (!fs.existsSync(CANDIDATES_DIR)) {
        fs.mkdirSync(CANDIDATES_DIR, { recursive: true })
      }

      let exported = 0
      let skipped = 0

      for (const session of sessions as unknown as SessionRow[]) {
        const filename = `candidate-${session.id}.${options.format}`
        const filepath = path.join(CANDIDATES_DIR, filename)

        // Check if file exists
        if (fs.existsSync(filepath) && !options.overwrite) {
          console.log(`  Skipped: ${filename} (already exists, use --overwrite)`)
          skipped++
          continue
        }

        // Sort messages by created_at
        const sortedMessages = [...session.coaching_messages].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )

        // Extract unique phases from messages
        const phasesCompleted = [...new Set(sortedMessages.map(m => m.phase))]

        // Build candidate object
        const candidate: GoldenCandidate = {
          session_id: session.id,
          exported_at: new Date().toISOString(),
          labels: session.golden_labels || [],
          problem: {
            id: session.problems.id,
            title: session.problems.title,
            difficulty: session.problems.difficulty,
            description: session.problems.problem_description,
          },
          transcript: sortedMessages.map(m => ({
            type: m.type,
            phase: m.phase,
            content: m.content || '',
            ...(m.options && { options: m.options }),
            ...(m.is_correct !== null && { is_correct: m.is_correct }),
          })),
          metadata: {
            started_at: session.started_at,
            completed_at: session.completed_at,
            message_count: sortedMessages.length,
            phases_completed: phasesCompleted,
          },
        }

        // Write to file
        let content: string
        if (options.format === 'json') {
          content = JSON.stringify(candidate, null, 2)
        } else {
          content = yaml.stringify(candidate, { lineWidth: 0 })
        }

        fs.writeFileSync(filepath, content, 'utf-8')
        console.log(`  Exported: ${filename}`)
        exported++
      }

      console.log(`\nExport complete:`)
      console.log(`  Exported: ${exported}`)
      console.log(`  Skipped:  ${skipped}`)
      console.log(`  Location: ${CANDIDATES_DIR}`)
    } catch (error) {
      console.error('Export failed:', (error as Error).message)
      process.exit(1)
    }
  })

program.parse()
