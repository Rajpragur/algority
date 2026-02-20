#!/usr/bin/env node
import 'dotenv/config'
import { Command } from 'commander'
import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'yaml'
import Table from 'cli-table3'
import { getFlaggedMessages } from '../lib/supabase'
import type { FlaggedReviewExport } from '../lib/types'

const program = new Command()

// Truncate content for display
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

// Format message type for display
function formatType(type: string): string {
  const typeMap: Record<string, string> = {
    'coach': 'Coach',
    'question': 'Question',
    'feedback': 'Feedback',
    'coach-response': 'Response',
    'user-answer': 'Answer',
    'user-question': 'User Q',
  }
  return typeMap[type] || type
}

program
  .name('eval-flagged-review')
  .description('Review user-flagged coaching messages')
  .option('-j, --json', 'Output as JSON')
  .option('-e, --export', 'Export to flagged-review.yaml')
  .option('-o, --output <path>', 'Custom export path')
  .option('--context', 'Show surrounding context (2 messages before/after)')
  .action(async (options) => {
    try {
      const messages = await getFlaggedMessages()

      if (messages.length === 0) {
        console.log('No flagged messages found.')
        process.exit(0)
      }

      // Export to YAML
      if (options.export) {
        const exportData: FlaggedReviewExport = {
          exportedAt: new Date().toISOString(),
          count: messages.length,
          messages,
        }

        const outputPath = options.output || path.join(process.cwd(), 'eval', 'flagged-review.yaml')

        // Ensure directory exists
        const dir = path.dirname(outputPath)
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true })
        }

        fs.writeFileSync(outputPath, yaml.stringify(exportData), 'utf-8')
        console.log(`Exported ${messages.length} flagged message(s) to ${outputPath}`)
        process.exit(0)
      }

      // JSON output
      if (options.json) {
        console.log(JSON.stringify({
          count: messages.length,
          messages,
        }, null, 2))
        process.exit(0)
      }

      // Table output
      console.log('\nFlagged Messages Review')
      console.log('========================')
      console.log(`Found ${messages.length} flagged message(s)\n`)

      for (const msg of messages) {
        console.log(`Session: ${msg.sessionId}`)
        console.log(`Problem: ${msg.problem.title} (${msg.problem.difficulty})`)
        console.log(`Type: ${formatType(msg.type)}`)
        console.log(`Flagged: ${new Date(msg.flaggedAt).toLocaleString()}`)
        console.log('')

        if (options.context && msg.context.before.length > 0) {
          console.log('  Context Before:')
          for (const ctx of msg.context.before) {
            console.log(`    [${formatType(ctx.type)}] ${truncate(ctx.content, 60)}`)
          }
          console.log('')
        }

        console.log(`  [FLAGGED ${formatType(msg.type)}]`)
        // Show full content for flagged message
        const lines = msg.content.split('\n')
        for (const line of lines) {
          console.log(`    ${line}`)
        }
        console.log('')

        if (options.context && msg.context.after.length > 0) {
          console.log('  Context After:')
          for (const ctx of msg.context.after) {
            console.log(`    [${formatType(ctx.type)}] ${truncate(ctx.content, 60)}`)
          }
          console.log('')
        }

        console.log('-'.repeat(60))
        console.log('')
      }

      // Summary table
      const table = new Table({
        head: ['Session', 'Problem', 'Type', 'Flagged At'],
        colWidths: [38, 25, 12, 22],
      })

      for (const msg of messages) {
        table.push([
          msg.sessionId,
          truncate(msg.problem.title, 22),
          formatType(msg.type),
          new Date(msg.flaggedAt).toLocaleDateString(),
        ])
      }

      console.log('\nSummary:')
      console.log(table.toString())

    } catch (error) {
      console.error('Failed to fetch flagged messages:', (error as Error).message)
      process.exit(1)
    }
  })

program.parse()
