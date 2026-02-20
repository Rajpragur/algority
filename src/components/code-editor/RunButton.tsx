'use client'

import { useTransition } from 'react'
import { Play, Loader2 } from 'lucide-react'
import { executeCode } from '@/app/actions'
import type { TestCase, ExecutionResult } from '@/lib/types'

interface RunButtonProps {
  code: string
  testCases: TestCase[]
  // Test harness/preamble prepended to user code before execution
  codePrompt?: string | null
  // Entry point function name (e.g., "twoSum")
  entryPoint?: string | null
  onResults: (results: ExecutionResult[]) => void
  onError?: (error: string) => void
}

export function RunButton({ code, testCases, codePrompt, entryPoint, onResults, onError }: RunButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleRun = () => {
    // Run visible test cases: first 3 default tests + all custom tests
    const defaultTests = testCases.filter((t) => !t.isCustom)
    const customTests = testCases.filter((t) => t.isCustom)
    const visibleTests = [...defaultTests.slice(0, 3), ...customTests]

    if (visibleTests.length === 0) {
      onError?.('No test cases available to run.')
      return
    }

    if (!code.trim()) {
      onError?.('Please write some code before running.')
      return
    }

    startTransition(async () => {
      try {
        const results = await executeCode(
          code,
          visibleTests,
          codePrompt ?? undefined,
          entryPoint ?? undefined
        )
        onResults(results)
      } catch (err) {
        console.error('Run failed:', err)
        onError?.('Execution failed. Please try again.')
      }
    })
  }

  return (
    <button
      onClick={handleRun}
      disabled={isPending}
      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 disabled:cursor-not-allowed text-white rounded-md transition-colors"
    >
      {isPending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Running...</span>
        </>
      ) : (
        <>
          <Play className="w-4 h-4" />
          <span>Run</span>
        </>
      )}
    </button>
  )
}
