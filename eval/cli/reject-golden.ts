#!/usr/bin/env node
import 'dotenv/config'
import { Command } from 'commander'
import { supabase } from '../lib/supabase'

const program = new Command()

program
  .name('eval-reject-golden')
  .description('Reject a contributed session')
  .requiredOption('-s, --session <id>', 'Session ID to reject')
  .requiredOption('-r, --reason <reason>', 'Reason for rejection')
  .action(async (options) => {
    try {
      const sessionId = options.session
      const reason = options.reason

      // Fetch the session to verify it exists and check status
      const { data: session, error: fetchError } = await supabase
        .from('coaching_sessions')
        .select(`
          id,
          submitted_as_golden_at,
          review_status,
          problems (title)
        `)
        .eq('id', sessionId)
        .single()

      if (fetchError || !session) {
        console.error(`Session not found: ${sessionId}`)
        process.exit(1)
      }

      const typedSession = session as unknown as {
        id: string
        submitted_as_golden_at: string | null
        review_status: string | null
        problems: { title: string }
      }

      // Check if it's a golden candidate
      if (!typedSession.submitted_as_golden_at) {
        console.error('This session was not submitted as a golden candidate.')
        process.exit(1)
      }

      // Check if already reviewed
      if (typedSession.review_status === 'approved') {
        console.error('This session has already been approved. Cannot reject an approved contribution.')
        process.exit(1)
      }

      if (typedSession.review_status === 'rejected') {
        console.error('This session has already been rejected.')
        process.exit(1)
      }

      // Update session in database
      const { error: updateError } = await supabase
        .from('coaching_sessions')
        .update({
          review_status: 'rejected',
          review_notes: reason,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', sessionId)

      if (updateError) {
        console.error('Failed to update review status:', updateError.message)
        process.exit(1)
      }

      // Success output
      console.log(`\n✗ Rejected contribution: ${sessionId}`)
      console.log(`  Problem: ${typedSession.problems.title}`)
      console.log(`  Reason: ${reason}`)
    } catch (error) {
      console.error('Rejection failed:', (error as Error).message)
      process.exit(1)
    }
  })

program.parse()
