#!/usr/bin/env node
import 'dotenv/config'
import { Command } from 'commander'
import { supabase } from '../lib/supabase'

const program = new Command()

// Collect multiple --label options into an array
function collect(value: string, previous: string[]): string[] {
  return previous.concat([value])
}

program
  .name('eval-add-golden')
  .description('Flag a session as a golden dataset candidate')
  .requiredOption('-s, --session <id>', 'Session ID to flag')
  .option('-l, --label <label>', 'Add a label (can be used multiple times)', collect, [])
  .action(async (options) => {
    try {
      const sessionId = options.session
      const labels: string[] = options.label

      // Check if session exists
      const { data: session, error: fetchError } = await supabase
        .from('coaching_sessions')
        .select('id, is_golden_candidate, golden_labels, completed_at')
        .eq('id', sessionId)
        .single()

      if (fetchError || !session) {
        console.error(`Session not found: ${sessionId}`)
        process.exit(1)
      }

      // Check if already flagged
      if (session.is_golden_candidate) {
        const existingLabels = session.golden_labels || []
        console.log(`Session ${sessionId} is already a golden candidate`)
        if (existingLabels.length > 0) {
          console.log(`  Existing labels: ${existingLabels.join(', ')}`)
        }

        // If new labels provided, merge them
        if (labels.length > 0) {
          const mergedLabels = [...new Set([...existingLabels, ...labels])]
          const { error: updateError } = await supabase
            .from('coaching_sessions')
            .update({ golden_labels: mergedLabels })
            .eq('id', sessionId)

          if (updateError) {
            console.error('Failed to update labels:', updateError.message)
            process.exit(1)
          }

          const newLabels = labels.filter(l => !existingLabels.includes(l))
          if (newLabels.length > 0) {
            console.log(`  Added new labels: ${newLabels.join(', ')}`)
          } else {
            console.log('  No new labels to add')
          }
        }
        return
      }

      // Warn if session not completed
      if (!session.completed_at) {
        console.log('Warning: Session is not yet completed')
      }

      // Flag as golden candidate
      const { error: updateError } = await supabase
        .from('coaching_sessions')
        .update({
          is_golden_candidate: true,
          golden_labels: labels,
        })
        .eq('id', sessionId)

      if (updateError) {
        console.error('Failed to flag session:', updateError.message)
        process.exit(1)
      }

      console.log(`✓ Session ${sessionId} flagged as golden candidate`)
      if (labels.length > 0) {
        console.log(`  Labels: ${labels.join(', ')}`)
      }
    } catch (error) {
      console.error('Error:', (error as Error).message)
      process.exit(1)
    }
  })

program.parse()
