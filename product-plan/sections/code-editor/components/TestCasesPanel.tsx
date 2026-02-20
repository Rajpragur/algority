import { useState } from 'react'
import type { TestCase } from '../types'

interface TestCasesPanelProps {
  testCases: TestCase[]
  onAddTestCase?: (input: string, expectedOutput: string) => void
  onDeleteTestCase?: (testId: string) => void
}

export function TestCasesPanel({ testCases, onAddTestCase, onDeleteTestCase }: TestCasesPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isAddingTest, setIsAddingTest] = useState(false)
  const [newInput, setNewInput] = useState('')
  const [newExpected, setNewExpected] = useState('')

  const passedCount = testCases.filter(t => t.status === 'passed').length
  const failedCount = testCases.filter(t => t.status === 'failed').length

  const handleAddTest = () => {
    if (newInput.trim() && newExpected.trim()) {
      onAddTestCase?.(newInput.trim(), newExpected.trim())
      setNewInput('')
      setNewExpected('')
      setIsAddingTest(false)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Test Cases
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            ({testCases.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          {passedCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">
              {passedCount} passed
            </span>
          )}
          {failedCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
              {failedCount} failed
            </span>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-3 space-y-2">
          {testCases.map((testCase) => (
            <TestCaseRow
              key={testCase.id}
              testCase={testCase}
              onDelete={() => onDeleteTestCase?.(testCase.id)}
            />
          ))}

          {isAddingTest ? (
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Input
                  </label>
                  <input
                    type="text"
                    value={newInput}
                    onChange={(e) => setNewInput(e.target.value)}
                    placeholder="nums = [1, 2], target = 3"
                    className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 dark:text-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Expected Output
                  </label>
                  <input
                    type="text"
                    value={newExpected}
                    onChange={(e) => setNewExpected(e.target.value)}
                    placeholder="[0, 1]"
                    className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 dark:text-slate-300"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsAddingTest(false)}
                  className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTest}
                  className="px-3 py-1.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                >
                  Add Test
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingTest(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Test Case
            </button>
          )}
        </div>
      )}
    </div>
  )
}

interface TestCaseRowProps {
  testCase: TestCase
  onDelete?: () => void
}

function TestCaseRow({ testCase, onDelete }: TestCaseRowProps) {
  const statusConfig = {
    pending: { icon: '○', color: 'text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' },
    running: { icon: '◉', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    passed: { icon: '✓', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    failed: { icon: '✗', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' }
  }

  const config = statusConfig[testCase.status]

  return (
    <div className={`group flex items-start gap-3 p-3 rounded-lg ${config.bg}`}>
      <span className={`shrink-0 w-5 h-5 flex items-center justify-center text-sm font-bold ${config.color}`}>
        {config.icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
            {testCase.type === 'example' ? 'Example' : 'Custom'}
          </span>
          {testCase.runtime && (
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
              {testCase.runtime}
            </span>
          )}
        </div>
        <p className="text-sm font-mono text-slate-700 dark:text-slate-300 truncate">
          {testCase.input}
        </p>
        <div className="flex items-center gap-2 mt-1 text-xs">
          <span className="text-slate-500 dark:text-slate-400">Expected:</span>
          <span className="font-mono text-slate-600 dark:text-slate-300">{testCase.expectedOutput}</span>
          {testCase.actualOutput && testCase.status === 'failed' && (
            <>
              <span className="text-slate-400">|</span>
              <span className="text-slate-500 dark:text-slate-400">Got:</span>
              <span className="font-mono text-red-600 dark:text-red-400">{testCase.actualOutput}</span>
            </>
          )}
        </div>
      </div>
      {testCase.type === 'user' && (
        <button
          onClick={onDelete}
          className="shrink-0 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  )
}
