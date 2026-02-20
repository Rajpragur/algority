'use client'

import { useTransition } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { executeCode } from '@/app/actions'
import type { TestCase, ExecutionResult } from '@/lib/types'

interface SubmitButtonProps {
  code: string
  testCases: TestCase[]
  // Test harness/preamble prepended to user code before execution
  codePrompt?: string | null
  // Entry point function name (e.g., "twoSum")
  entryPoint?: string | null
  onResults: (results: ExecutionResult[], isSubmission: boolean) => void
  onError?: (error: string) => void
}

export function SubmitButton({ code, testCases, codePrompt, entryPoint, onResults, onError }: SubmitButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleSubmit = () => {
    if (testCases.length === 0) {
      onError?.('No test cases available.')
      return
    }

    if (!code.trim()) {
      onError?.('Please write some code before submitting.')
      return
    }

    startTransition(async () => {
      try {
        // Submit runs ALL test cases (including hidden ones)
        const results = await executeCode(
          code,
          testCases,
          codePrompt ?? undefined,
          entryPoint ?? undefined
        )
        onResults(results, true) // true = isSubmission
      } catch (err) {
        console.error('Submit failed:', err)
        onError?.('Submission failed. Please try again.')
      }
    })
  }

  return (
    <button
      onClick={handleSubmit}
      disabled={isPending}
      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
    >
      {isPending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Submitting...</span>
        </>
      ) : (
        <>
          <Send className="w-4 h-4" />
          <span>Submit</span>
        </>
      )}
    </button>
  )
}
