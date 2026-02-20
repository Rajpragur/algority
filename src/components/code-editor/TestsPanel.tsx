'use client'

import { useState, useMemo, useCallback } from 'react'
import { ChevronDown, ChevronUp, Eye, EyeOff, Check, X, Clock, AlertTriangle, Plus } from 'lucide-react'
import type { TestCase, ExecutionResult, ExecutionErrorType } from '@/lib/types'

// Number of test cases visible for "Run" - rest are hidden for "Submit" only
const VISIBLE_TEST_COUNT = 3

// Map error types to user-friendly labels
const ERROR_TYPE_LABELS: Record<ExecutionErrorType, string> = {
  syntax: 'Syntax Error',
  runtime: 'Runtime Error',
  timeout: 'Time Limit Exceeded',
  compilation: 'Compilation Error',
}

interface TestsPanelProps {
  testCases: TestCase[]
  executionResults?: ExecutionResult[] | null
  // Whether results are from Submit (show all tests) vs Run (visible only)
  isSubmission?: boolean
  // Custom test management callbacks
  onAddCustomTest: (input: string, expectedOutput: string) => void
  onUpdateCustomTest: (testId: string, input: string, expectedOutput: string) => void
  onDeleteCustomTest: (testId: string) => void
}

interface TestFormState {
  input: string
  expectedOutput: string
}

export function TestsPanel({
  testCases,
  executionResults,
  isSubmission = false,
  onAddCustomTest,
  onUpdateCustomTest,
  onDeleteCustomTest,
}: TestsPanelProps) {
  const [activeTestIndex, setActiveTestIndex] = useState(0)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [formState, setFormState] = useState<TestFormState | null>(null)
  // Track if we're showing the "new test" tab
  const [showNewTestTab, setShowNewTestTab] = useState(false)

  // Split default tests into visible (for Run) and hidden (for Submit only)
  // Custom tests are always visible - must be calculated before callbacks that use it
  const defaultTests = testCases.filter((t) => !t.isCustom)
  const customTestsList = testCases.filter((t) => t.isCustom)

  const visibleDefaultTests = defaultTests.slice(0, VISIBLE_TEST_COUNT)
  const hiddenDefaultTests = defaultTests.slice(VISIBLE_TEST_COUNT)
  const hiddenTestCount = hiddenDefaultTests.length

  // Display tests = visible default tests + all custom tests
  const displayTests = [...visibleDefaultTests, ...customTestsList]
  const visibleTestCount = displayTests.length

  // Open add form as a new tab
  const handleOpenAddForm = useCallback(() => {
    setFormState({ input: '', expectedOutput: '' })
    setShowNewTestTab(true)
  }, [])

  // Close form and return to previous tab
  const handleCloseForm = useCallback(() => {
    setFormState(null)
    setShowNewTestTab(false)
  }, [])

  // Handle form submission - add new custom test
  const handleFormSubmit = useCallback(() => {
    if (!formState) return

    const input = formState.input.trim()
    const expectedOutput = formState.expectedOutput.trim()

    if (!input || !expectedOutput) return

    onAddCustomTest(input, expectedOutput)
    // Switch to the newly added test (will be at end of displayTests)
    setActiveTestIndex(visibleTestCount)

    setFormState(null)
    setShowNewTestTab(false)
  }, [formState, onAddCustomTest, visibleTestCount])

  // Handle delete
  const handleDelete = useCallback((testId: string) => {
    onDeleteCustomTest(testId)
    // Reset active index if needed
    setActiveTestIndex((prev) => Math.max(0, Math.min(prev, testCases.length - 2)))
  }, [onDeleteCustomTest, testCases.length])

  // Helper to get execution result for a test case
  const getResultForTest = (testId: string): ExecutionResult | undefined => {
    return executionResults?.find((r) => r.testId === testId)
  }

  // Calculate overall results summary
  const resultsSummary = useMemo(() => {
    if (!executionResults || executionResults.length === 0) {
      return null
    }
    const passed = executionResults.filter((r) => r.passed).length
    const total = executionResults.length
    const allPassed = passed === total
    return { passed, total, allPassed }
  }, [executionResults])

  if (testCases.length === 0) {
    return (
      <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4">
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
          No test cases available for this problem.
        </p>
      </div>
    )
  }

  const activeTest = displayTests[activeTestIndex]

  // Calculate hidden test results summary for submissions
  const hiddenTestsSummary = useMemo(() => {
    if (!isSubmission || !executionResults || hiddenTestCount === 0) return null

    const hiddenResults = hiddenDefaultTests
      .map(test => executionResults.find(r => r.testId === test.id))
      .filter((r): r is ExecutionResult => r !== undefined)

    if (hiddenResults.length === 0) return null

    const passed = hiddenResults.filter(r => r.passed).length
    const failed = hiddenResults.length - passed
    return { passed, failed, total: hiddenResults.length }
  }, [isSubmission, executionResults, hiddenDefaultTests, hiddenTestCount])

  return (
    <div className="h-full border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex flex-col overflow-hidden">
      {/* Header with collapse toggle */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Test Cases
            </span>
          </div>
          {/* Results summary */}
          {resultsSummary && (
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${
              resultsSummary.allPassed
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {resultsSummary.allPassed ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <X className="w-3.5 h-3.5" />
              )}
              <span>{resultsSummary.passed}/{resultsSummary.total} Passed</span>
            </div>
          )}
          {/* Hidden tests indicator */}
          {hiddenTestCount > 0 && !resultsSummary && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Eye className="w-3.5 h-3.5" />
              <span>{visibleTestCount}</span>
              <span className="mx-1">|</span>
              <EyeOff className="w-3.5 h-3.5" />
              <span>{hiddenTestCount} hidden</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? 'Expand test cases' : 'Collapse test cases'}
        >
          {isCollapsed ? (
            <ChevronUp className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          )}
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* Test tabs - visible tests + add button */}
          <div
            role="tablist"
            aria-label="Test cases"
            className="shrink-0 flex items-center gap-1 px-4 py-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto"
          >
            {displayTests.map((test, index) => {
              const result = getResultForTest(test.id)
              const hasResult = result !== undefined
              const isActive = !showNewTestTab && activeTestIndex === index

              return (
                <button
                  key={test.id}
                  role="tab"
                  id={`test-tab-${index}`}
                  aria-selected={isActive}
                  aria-controls={`test-panel-${index}`}
                  onClick={() => {
                    // Auto-save if switching away from new test with valid data
                    if (showNewTestTab && formState && formState.input.trim() && formState.expectedOutput.trim()) {
                      handleFormSubmit()
                    } else {
                      setShowNewTestTab(false)
                      setFormState(null)
                    }
                    setActiveTestIndex(index)
                  }}
                  className={`group flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {hasResult && (
                    result.passed ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                    )
                  )}
                  Test {index + 1}
                  {/* Delete X for custom tests - expands on hover */}
                  {test.isCustom && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(test.id)
                      }}
                      className="inline-flex items-center justify-center w-0 opacity-0 group-hover:w-4 group-hover:opacity-100 group-hover:ml-1 hover:text-red-500 dark:hover:text-red-400 transition-all duration-150 overflow-hidden"
                      aria-label="Delete custom test"
                    >
                      <X className="w-3 h-3 flex-shrink-0" />
                    </span>
                  )}
                </button>
              )
            })}
            {/* New Test tab - shown when adding */}
            {showNewTestTab && (
              <button
                role="tab"
                aria-selected={true}
                className="group flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              >
                Test {displayTests.length + 1}
                {/* Cancel X - expands on hover */}
                <span
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCloseForm()
                  }}
                  className="inline-flex items-center justify-center w-0 opacity-0 group-hover:w-4 group-hover:opacity-100 group-hover:ml-1 hover:text-red-500 dark:hover:text-red-400 transition-all duration-150 overflow-hidden"
                  aria-label="Cancel new test"
                >
                  <X className="w-3 h-3 flex-shrink-0" />
                </span>
              </button>
            )}
            {/* Add test button inline with tabs */}
            {!showNewTestTab && (
              <button
                onClick={handleOpenAddForm}
                className="flex items-center justify-center w-7 h-7 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                aria-label="Add custom test case"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Add Form - shown in New Test tab */}
          {showNewTestTab && formState && (
            <div className="flex-1 p-4 space-y-3 overflow-y-auto min-h-0">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Input
                </label>
                <textarea
                  value={formState.input}
                  onChange={(e) => setFormState({ ...formState, input: e.target.value })}
                  placeholder="nums = [1, 2, 3], target = 5"
                  className="w-full p-3 text-sm font-mono text-slate-100 bg-slate-900 dark:bg-slate-950 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none placeholder:text-slate-500"
                  rows={2}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Expected Output
                </label>
                <textarea
                  value={formState.expectedOutput}
                  onChange={(e) => setFormState({ ...formState, expectedOutput: e.target.value })}
                  placeholder="[0, 1]"
                  className="w-full p-3 text-sm font-mono text-slate-100 bg-slate-900 dark:bg-slate-950 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none placeholder:text-slate-500"
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Test content - hidden when new test tab is open */}
          {!showNewTestTab && (
          <div
            id={`test-panel-${activeTestIndex}`}
            role="tabpanel"
            aria-labelledby={`test-tab-${activeTestIndex}`}
            className="flex-1 p-4 space-y-3 overflow-y-auto min-h-0"
          >
            {activeTest ? (
              <>
                {/* Input */}
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Input
                    </label>
                    <pre className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-3 rounded-lg text-sm font-mono overflow-x-auto border border-slate-700">
                      {activeTest.input}
                    </pre>
                  </div>

                  {/* Actual Output - only show if we have results */}
                  {(() => {
                    const result = getResultForTest(activeTest.id)
                    if (result) {
                      return (
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <label className={`text-xs font-medium ${
                              result.passed
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {result.passed ? 'Output (Passed)' : 'Output (Failed)'}
                            </label>
                            {result.error && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                <AlertTriangle className="w-3 h-3" />
                                {ERROR_TYPE_LABELS[result.error.type]}
                              </span>
                            )}
                            {result.executionTime !== undefined && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                <Clock className="w-3 h-3" />
                                {result.executionTime}ms
                              </span>
                            )}
                          </div>
                          <pre className={`p-3 rounded-lg text-sm font-mono overflow-x-auto border ${
                            result.passed
                              ? 'bg-emerald-950 text-emerald-100 border-emerald-700'
                              : 'bg-red-950 text-red-100 border-red-700'
                          }`}>
                            {result.error ? result.error.message : result.actualOutput}
                          </pre>
                        </div>
                      )
                    }
                    return null
                  })()}

                  {/* Expected Output */}
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Expected Output
                    </label>
                    <pre className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-3 rounded-lg text-sm font-mono overflow-x-auto border border-slate-700">
                      {activeTest.expectedOutput}
                    </pre>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Select a test case to view details.
              </p>
            )}

            {/* Success message when all tests pass on submission */}
            {isSubmission && resultsSummary?.allPassed && (
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-medium text-emerald-700 dark:text-emerald-400">
                    All tests passed! Your solution is correct.
                  </span>
                </div>
              </div>
            )}

            {/* Hidden tests summary for submissions */}
            {isSubmission && hiddenTestsSummary && (
              <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Hidden tests: {hiddenTestsSummary.passed}/{hiddenTestsSummary.total} passed
                    {hiddenTestsSummary.failed > 0 && (
                      <span className="text-red-600 dark:text-red-400 ml-1">
                        ({hiddenTestsSummary.failed} failed)
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* Hidden tests hint - only show when not in submission mode */}
            {!isSubmission && hiddenTestCount > 0 && (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic pt-2 border-t border-slate-200 dark:border-slate-700">
                Run tests against these {visibleTestCount} cases. Submit to validate against all {testCases.length} tests including {hiddenTestCount} hidden.
              </p>
            )}
          </div>
          )}
        </>
      )}
    </div>
  )
}
