'use client'

import { useCallback, useState, useRef, useEffect } from 'react'
import type { editor } from 'monaco-editor'
import { GripHorizontal } from 'lucide-react'
import { CodeEditor } from './CodeEditor'
import { TestsPanel } from './TestsPanel'
import { RunButton } from './RunButton'
import { SubmitButton } from './SubmitButton'
import { EvaluateButton } from './EvaluateButton'
import { EvaluationBubble } from './EvaluationBubble'
import type { TestCase, ExecutionResult, CodeEvaluation } from '@/lib/types'

const MIN_PANEL_HEIGHT = 150
const MAX_PANEL_HEIGHT = 600
const DEFAULT_PANEL_HEIGHT = 280

interface CursorPosition {
  line: number
  column: number
}

interface RightPanelProps {
  code: string
  onCodeChange: (code: string) => void
  cursorPosition: CursorPosition
  onCursorChange: (position: CursorPosition) => void
  testCases: TestCase[]
  // Test harness/preamble prepended to user code before execution
  codePrompt?: string | null
  // Entry point function name (e.g., "twoSum")
  entryPoint?: string | null
  executionResults: ExecutionResult[] | null
  executionError: string | null
  // Whether results are from Submit (all tests) vs Run (visible only)
  isSubmission: boolean
  onExecutionResults: (results: ExecutionResult[], isSubmission?: boolean) => void
  onExecutionError: (error: string) => void
  // Monaco editor instance callback for selection API
  onEditorReady: (editor: editor.IStandaloneCodeEditor) => void
  // AI Evaluation props
  onEvaluate: () => void
  isEvaluating: boolean
  evaluationResult: CodeEvaluation | null
  evaluationError: string | null
  onDismissEvaluation: () => void
  onRetryEvaluation: () => void
  // Custom test management
  onAddCustomTest: (input: string, expectedOutput: string) => void
  onUpdateCustomTest: (testId: string, input: string, expectedOutput: string) => void
  onDeleteCustomTest: (testId: string) => void
}

export function RightPanel({
  code,
  onCodeChange,
  cursorPosition,
  onCursorChange,
  testCases,
  codePrompt,
  entryPoint,
  executionResults,
  executionError,
  isSubmission,
  onExecutionResults,
  onExecutionError,
  onEditorReady,
  onEvaluate,
  isEvaluating,
  evaluationResult,
  evaluationError,
  onDismissEvaluation,
  onRetryEvaluation,
  onAddCustomTest,
  onUpdateCustomTest,
  onDeleteCustomTest,
}: RightPanelProps) {
  // Wrapper for Run button - always passes false for isSubmission
  const handleRunResults = useCallback((results: ExecutionResult[]) => {
    onExecutionResults(results, false)
  }, [onExecutionResults])

  // Resizable panel state
  const [panelHeight, setPanelHeight] = useState(DEFAULT_PANEL_HEIGHT)
  const isDragging = useRef(false)
  const startY = useRef(0)
  const startHeight = useRef(0)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true
    startY.current = e.clientY
    startHeight.current = panelHeight
    document.body.style.cursor = 'ns-resize'
    document.body.style.userSelect = 'none'
  }, [panelHeight])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return

      // Dragging up (negative delta) increases height
      const delta = startY.current - e.clientY
      const newHeight = Math.min(MAX_PANEL_HEIGHT, Math.max(MIN_PANEL_HEIGHT, startHeight.current + delta))
      setPanelHeight(newHeight)
    }

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1e1e1e] min-h-0">
      {/* Editor */}
      <div className="flex-1 min-h-0 relative">
        <CodeEditor value={code} onChange={onCodeChange} onCursorChange={onCursorChange} onEditorReady={onEditorReady} />
      </div>

      {/* Action toolbar */}
      <div className="shrink-0 h-14 px-4 flex items-center justify-between border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black z-10">
        <div className="flex items-center gap-3">
          <RunButton
            code={code}
            testCases={testCases}
            codePrompt={codePrompt}
            entryPoint={entryPoint}
            onResults={handleRunResults}
            onError={onExecutionError}
          />
          <SubmitButton
            code={code}
            testCases={testCases}
            codePrompt={codePrompt}
            entryPoint={entryPoint}
            onResults={onExecutionResults}
            onError={onExecutionError}
          />
          <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-800 mx-1" />
          <EvaluateButton
            onEvaluate={onEvaluate}
            isLoading={isEvaluating}
          />
        </div>
        {executionError && (
          <span className="text-xs font-mono text-red-600 dark:text-red-400 max-w-xs truncate" title={executionError}>
            Error: {executionError}
          </span>
        )}
      </div>

      {/* Evaluation Bubble - shows when evaluation result or error exists */}
      {(evaluationResult || evaluationError) && (
        <div className="shrink-0 border-t border-neutral-200 dark:border-neutral-800">
          <EvaluationBubble
            evaluation={evaluationResult}
            error={evaluationError}
            onDismiss={onDismissEvaluation}
            onRetry={evaluationError ? onRetryEvaluation : undefined}
          />
        </div>
      )}

      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        className="shrink-0 h-1.5 flex items-center justify-center cursor-ns-resize bg-neutral-50 dark:bg-neutral-900 border-y border-neutral-200 dark:border-neutral-800 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 transition-colors group"
        title="Drag to resize"
      >
        <div className="w-8 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700 group-hover:bg-emerald-500/50 transition-colors" />
      </div>

      {/* Test Cases Panel - resizable */}
      <div className="shrink-0 overflow-hidden bg-white dark:bg-[#1e1e1e]" style={{ height: panelHeight }}>
        <TestsPanel
          testCases={testCases}
          executionResults={executionResults}
          isSubmission={isSubmission}
          onAddCustomTest={onAddCustomTest}
          onUpdateCustomTest={onUpdateCustomTest}
          onDeleteCustomTest={onDeleteCustomTest}
        />
      </div>

      {/* Status bar with cursor position */}
      <div
        className="h-6 shrink-0 px-4 flex items-center justify-end border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#007acc] text-[10px] text-neutral-500 dark:text-white font-medium"
        role="status"
        aria-label="Editor status"
      >
        <span aria-label={`Line ${cursorPosition.line}, Column ${cursorPosition.column}`}>
          Ln {cursorPosition.line}, Col {cursorPosition.column}
        </span>
      </div>
    </div>
  )
}
