import { useState } from 'react'
import type { CodeEditorProps } from '../types'
import { ApproachPanel } from './ApproachPanel'
import { EditorPanel } from './EditorPanel'
import { TestCasesPanel } from './TestCasesPanel'
import { CritiquePanel } from './CritiquePanel'
import { SubmissionModal } from './SubmissionModal'

export function CodeEditor({
  problem,
  approachSummary,
  code,
  testCases,
  aiCritique,
  submissionResult,
  onCodeChange,
  onRunTests,
  onAddTestCase,
  onDeleteTestCase,
  onRequestCritique,
  onToggleCritique,
  onSubmit,
  onNextProblem
}: CodeEditorProps) {
  const [showSubmissionModal, setShowSubmissionModal] = useState(false)

  const handleSubmit = () => {
    onSubmit?.()
    setShowSubmissionModal(true)
  }

  return (
    <div className="h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row">
      {/* Left Panel - Approach Summary */}
      <div className="w-full lg:w-80 xl:w-96 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 overflow-auto">
        <ApproachPanel
          problem={problem}
          approachSummary={approachSummary}
        />
      </div>

      {/* Right Panel - Editor + Tests + Critique */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Editor */}
        <div className="flex-1 min-h-0 flex flex-col">
          <EditorPanel
            code={code}
            onCodeChange={onCodeChange}
          />
        </div>

        {/* Test Cases */}
        <div className="shrink-0 border-t border-slate-200 dark:border-slate-800">
          <TestCasesPanel
            testCases={testCases}
            onAddTestCase={onAddTestCase}
            onDeleteTestCase={onDeleteTestCase}
          />
        </div>

        {/* AI Critique (collapsible) */}
        {aiCritique && (
          <div className="shrink-0 border-t border-slate-200 dark:border-slate-800">
            <CritiquePanel
              critique={aiCritique}
              onToggle={onToggleCritique}
            />
          </div>
        )}

        {/* Action Bar */}
        <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onRunTests?.()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Run Tests
              </button>

              <button
                onClick={() => onRequestCritique?.()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium text-sm rounded-lg transition-colors border border-amber-200 dark:border-amber-800"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Get AI Critique
              </button>
            </div>

            <button
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg shadow-sm hover:shadow transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Submit Solution
            </button>
          </div>
        </div>
      </div>

      {/* Submission Modal */}
      {showSubmissionModal && (
        <SubmissionModal
          result={submissionResult}
          onClose={() => setShowSubmissionModal(false)}
          onNextProblem={onNextProblem}
        />
      )}
    </div>
  )
}
