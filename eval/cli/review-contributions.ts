#!/usr/bin/env node
import 'dotenv/config'
import { Command } from 'commander'
import Table from 'cli-table3'
import { supabase } from '../lib/supabase'

const program = new Command()

interface ContributionRow {
  id: string
  contributor_notes: string | null
  submitted_as_golden_at: string
  review_status: string
  started_at: string
  completed_at: string | null
  problems: {
    id: number
    title: string
    difficulty: string
  }
}

// Truncate text for display
function truncate(text: string | null, maxLength: number): string {
  if (!text) return '-'
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

program
  .name('eval-review-contributions')
  .description('Review user-submitted golden dataset candidates')
  .option('-s, --status <status>', 'Filter by status: pending, approved, rejected, all', 'pending')
  .option('-j, --json', 'Output as JSON')
  .action(async (options) => {
    try {
      // Build query
      let query = supabase
        .from('coaching_sessions')
        .select(`
          id,
          contributor_notes,
          submitted_as_golden_at,
          review_status,
          started_at,
          completed_at,
          problems (id, title, difficulty)
        `)
        .eq('is_golden_candidate', true)
        .not('submitted_as_golden_at', 'is', null)
        .order('submitted_as_golden_at', { ascending: false })

      // Apply status filter
      if (options.status !== 'all') {
        query = query.eq('review_status', options.status)
      }

      const { data: contributions, error } = await query

      if (error) {
        console.error('Failed to fetch contributions:', error.message)
        process.exit(1)
      }

      if (!contributions || contributions.length === 0) {
        console.log(`No ${options.status === 'all' ? '' : options.status + ' '}contributions found.`)
        return
      }

      const typedContributions = contributions as unknown as ContributionRow[]

      // JSON output
      if (options.json) {
        console.log(JSON.stringify({
          count: typedContributions.length,
          status: options.status,
          contributions: typedContributions.map(c => ({
            sessionId: c.id,
            problem: {
              id: c.problems.id,
              title: c.problems.title,
              difficulty: c.problems.difficulty,
            },
            contributorNotes: c.contributor_notes,
            submittedAt: c.submitted_as_golden_at,
            reviewStatus: c.review_status,
          })),
        }, null, 2))
        return
      }

      // Table output
      console.log(`\nContributed Golden Candidates (${options.status})`)
      console.log('='.repeat(50))
      console.log(`Found ${typedContributions.length} contribution(s)\n`)

      const table = new Table({
        head: ['Session ID', 'Problem', 'Difficulty', 'Submitted', 'Status'],
        colWidths: [38, 22, 12, 12, 10],
      })

      for (const c of typedContributions) {
        const submittedDate = new Date(c.submitted_as_golden_at).toLocaleDateString()
        table.push([
          c.id,
          truncate(c.problems.title, 19),
          c.problems.difficulty,
          submittedDate,
          c.review_status,
        ])
      }

      console.log(table.toString())

      // Show details with notes
      console.log('\nDetails:')
      for (const c of typedContributions) {
        console.log(`\n  Session: ${c.id}`)
        console.log(`  Problem: ${c.problems.title}`)
        console.log(`  Notes: ${c.contributor_notes || '(none provided)'}`)
      }

      console.log('\nCommands:')
      console.log('  npm run eval:approve-golden -- --session <id>')
      console.log('  npm run eval:reject-golden -- --session <id> --reason "..."')
    } catch (error) {
      console.error('Review failed:', (error as Error).message)
      process.exit(1)
    }
  })

program.parse()
