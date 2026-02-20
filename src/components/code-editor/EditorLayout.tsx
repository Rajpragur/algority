'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { editor } from 'monaco-editor'
import { GripVertical } from 'lucide-react'
import { Problem, CoachingInsights, TestCase, ExecutionResult, CodeEvaluation } from '@/lib/types'
import { EditorHeader } from './EditorHeader'
import { LeftPanel } from './LeftPanel'
import { RightPanel } from './RightPanel'

// Panel width constraints (in pixels)
const MIN_LEFT_PANEL_WIDTH = 280
const MAX_LEFT_PANEL_WIDTH = 700
const DEFAULT_LEFT_PANEL_WIDTH = 420

interface CursorPosition {
  line: number
  column: number
}

interface EditorLayoutProps {
  problem: Problem
  activeTab: 'problem' | 'solution' | 'insights'
  onTabChange: (tab: 'problem' | 'solution' | 'insights') => void
  code: string
  onCodeChange: (code: string) => void
  cursorPosition: CursorPosition
  onCursorChange: (position: CursorPosition) => void
  // Solution reveal props
  solutionRevealed: boolean
  showRevealDialog: boolean
  onCancelReveal: () => void
  onConfirmReveal: () => void
  // Coaching insights
  insights: CoachingInsights | null
  // Test cases for code execution
  testCases: TestCase[]
  // Code execution results
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

export function EditorLayout({
  problem,
  activeTab,
  onTabChange,
  code,
  onCodeChange,
  cursorPosition,
  onCursorChange,
  solutionRevealed,
  showRevealDialog,
  onCancelReveal,
  onConfirmReveal,
  insights,
  testCases,
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
}: EditorLayoutProps) {
  // Resizable left panel state
  const [leftPanelWidth, setLeftPanelWidth] = useState(DEFAULT_LEFT_PANEL_WIDTH)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true
    startX.current = e.clientX
    startWidth.current = leftPanelWidth
    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'
  }, [leftPanelWidth])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return

      // Dragging right (positive delta) increases width
      const delta = e.clientX - startX.current
      const newWidth = Math.min(MAX_LEFT_PANEL_WIDTH, Math.max(MIN_LEFT_PANEL_WIDTH, startWidth.current + delta))
      setLeftPanelWidth(newWidth)
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
    <div className="h-full flex flex-col bg-white dark:bg-black">
      <EditorHeader problem={problem} />

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Panel - Resizable width */}
        <div
          className="shrink-0 flex flex-col min-h-0"
          style={{ width: leftPanelWidth }}
        >
          <LeftPanel
            problem={problem}
            activeTab={activeTab}
            onTabChange={onTabChange}
            solutionRevealed={solutionRevealed}
            showRevealDialog={showRevealDialog}
            onCancelReveal={onCancelReveal}
            onConfirmReveal={onConfirmReveal}
            insights={insights}
          />
        </div>

        {/* Resize Handle */}
        <div
          onMouseDown={handleMouseDown}
          className="shrink-0 w-1.5 flex flex-col items-center justify-center cursor-ew-resize bg-neutral-50 dark:bg-neutral-900 border-x border-neutral-200 dark:border-neutral-800 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 transition-colors group"
          title="Drag to resize"
        >
          <div className="h-8 w-1 rounded-full bg-neutral-300 dark:bg-neutral-700 group-hover:bg-emerald-500/50 transition-colors" />
        </div>

        {/* Right Panel - Remaining width */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          <RightPanel
            code={code}
            onCodeChange={onCodeChange}
            cursorPosition={cursorPosition}
            onCursorChange={onCursorChange}
            testCases={testCases}
            codePrompt={problem.prompt}
            entryPoint={problem.entry_point}
            executionResults={executionResults}
            executionError={executionError}
            isSubmission={isSubmission}
            onExecutionResults={onExecutionResults}
            onExecutionError={onExecutionError}
            onEditorReady={onEditorReady}
            onEvaluate={onEvaluate}
            isEvaluating={isEvaluating}
            evaluationResult={evaluationResult}
            evaluationError={evaluationError}
            onDismissEvaluation={onDismissEvaluation}
            onRetryEvaluation={onRetryEvaluation}
            onAddCustomTest={onAddCustomTest}
            onUpdateCustomTest={onUpdateCustomTest}
            onDeleteCustomTest={onDeleteCustomTest}
          />
        </div>
      </div>
    </div>
  )
}
