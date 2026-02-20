'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import type { editor } from 'monaco-editor'
import { Problem, CoachingInsights, ExecutionResult, CodeEvaluation, TestCase } from '@/lib/types'
import { EditorLayout } from './EditorLayout'
import {
  saveDraft,
  loadDraft,
  loadCustomTests,
  addCustomTest,
  updateCustomTest,
  deleteCustomTest,
  CustomTestCase,
} from '@/lib/storage'
import { parseTestCases } from './parseTestCases'
import { evaluateCode } from '@/app/actions'

type TabType = 'problem' | 'solution' | 'insights'

interface CursorPosition {
  line: number
  column: number
}

interface EditorClientProps {
  problem: Problem
  insights: CoachingInsights | null
}

const DEBOUNCE_MS = 500

export function EditorClient({ problem, insights }: EditorClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('problem')
  // Initialize with starter_code, will be replaced by draft if exists (in useEffect)
  const [code, setCode] = useState(problem.starter_code ?? '')

  // Parse default test cases from problem data (memoized to avoid re-parsing on every render)
  const defaultTestCases = useMemo(() => parseTestCases(problem.test_cases), [problem.test_cases])

  // Custom test cases from localStorage
  const [customTests, setCustomTests] = useState<CustomTestCase[]>([])

  // Merge default and custom tests for display
  const testCases: TestCase[] = useMemo(() => {
    const customAsTestCases: TestCase[] = customTests.map((ct) => ({
      id: ct.id,
      input: ct.input,
      expectedOutput: ct.expectedOutput,
      isCustom: true,
    }))
    return [...defaultTestCases, ...customAsTestCases]
  }, [defaultTestCases, customTests])

  const [cursorPosition, setCursorPosition] = useState<CursorPosition>({ line: 1, column: 1 })
  const isInitialMount = useRef(true)

  // Load draft and custom tests from localStorage on mount (client-side only)
  useEffect(() => {
    const draft = loadDraft(problem.id)
    if (draft !== null) {
      setCode(draft)
    }

    // Load custom tests
    const storedCustomTests = loadCustomTests(problem.id)
    setCustomTests(storedCustomTests)

    // Mark initial mount complete after a tick to avoid saving the loaded draft
    const timer = setTimeout(() => {
      isInitialMount.current = false
    }, 0)
    return () => clearTimeout(timer)
  }, [problem.id])

  // Auto-save draft with debounce
  useEffect(() => {
    // Skip saving on initial mount (when loading draft)
    if (isInitialMount.current) return

    const timer = setTimeout(() => {
      saveDraft(problem.id, code)
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [code, problem.id])

  // Solution reveal state (session-scoped)
  const [solutionRevealed, setSolutionRevealed] = useState(false)
  const [showRevealDialog, setShowRevealDialog] = useState(false)

  // Code execution results
  const [executionResults, setExecutionResults] = useState<ExecutionResult[] | null>(null)
  const [executionError, setExecutionError] = useState<string | null>(null)
  // Track if results are from Submit (all tests) vs Run (visible tests only)
  const [isSubmission, setIsSubmission] = useState(false)

  // Monaco editor reference for selection API
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  // AI Evaluation state
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluationResult, setEvaluationResult] = useState<CodeEvaluation | null>(null)
  const [evaluationError, setEvaluationError] = useState<string | null>(null)

  // Handler for run/submit button results
  const handleExecutionResults = useCallback((results: ExecutionResult[], submission = false) => {
    setExecutionResults(results)
    setExecutionError(null)
    setIsSubmission(submission)
  }, [])

  const handleExecutionError = useCallback((error: string) => {
    setExecutionError(error)
  }, [])

  // Custom test handlers
  const handleAddCustomTest = useCallback(
    (input: string, expectedOutput: string) => {
      const newTest = addCustomTest(problem.id, input, expectedOutput)
      setCustomTests((prev) => [...prev, newTest])
    },
    [problem.id]
  )

  const handleUpdateCustomTest = useCallback(
    (testId: string, input: string, expectedOutput: string) => {
      updateCustomTest(problem.id, testId, input, expectedOutput)
      setCustomTests((prev) =>
        prev.map((t) => (t.id === testId ? { ...t, input, expectedOutput } : t))
      )
    },
    [problem.id]
  )

  const handleDeleteCustomTest = useCallback(
    (testId: string) => {
      deleteCustomTest(problem.id, testId)
      setCustomTests((prev) => prev.filter((t) => t.id !== testId))
    },
    [problem.id]
  )

  // Intercept tab changes to handle solution reveal confirmation
  const handleTabChange = useCallback(
    (tab: TabType) => {
      if (tab === 'solution' && !solutionRevealed) {
        setShowRevealDialog(true)
        return // Don't switch tab yet
      }
      setActiveTab(tab)
    },
    [solutionRevealed]
  )

  const handleCancelReveal = useCallback(() => {
    setShowRevealDialog(false)
  }, [])

  const handleConfirmReveal = useCallback(() => {
    setSolutionRevealed(true)
    setShowRevealDialog(false)
    setActiveTab('solution')
  }, [])

  // Store Monaco editor instance when ready
  const handleEditorReady = useCallback((monacoEditor: editor.IStandaloneCodeEditor) => {
    editorRef.current = monacoEditor
  }, [])

  // Get code for evaluation (selected text or full code)
  const getCodeForEvaluation = useCallback((): { code: string; isSelection: boolean } => {
    const monacoEditor = editorRef.current
    if (!monacoEditor) return { code: code, isSelection: false }

    const selection = monacoEditor.getSelection()
    if (selection && !selection.isEmpty()) {
      const model = monacoEditor.getModel()
      const selectedText = model?.getValueInRange(selection) ?? ''
      if (selectedText.trim()) {
        return { code: selectedText, isSelection: true }
      }
    }

    return { code: code, isSelection: false }
  }, [code])

  // Handle evaluate button click
  const handleEvaluate = useCallback(async () => {
    setIsEvaluating(true)
    setEvaluationError(null)
    setEvaluationResult(null)

    try {
      const { code: codeToEvaluate, isSelection } = getCodeForEvaluation()
      const result = await evaluateCode(codeToEvaluate, problem.id, isSelection)

      if (result.success && result.evaluation) {
        setEvaluationResult(result.evaluation)
      } else {
        setEvaluationError(result.error ?? 'Evaluation failed')
      }
    } catch (error) {
      console.error('Evaluation failed:', error)
      setEvaluationError('AI evaluation temporarily unavailable')
    } finally {
      setIsEvaluating(false)
    }
  }, [problem.id, getCodeForEvaluation])

  // Dismiss evaluation bubble
  const handleDismissEvaluation = useCallback(() => {
    setEvaluationResult(null)
    setEvaluationError(null)
  }, [])

  // Retry evaluation after error
  const handleRetryEvaluation = useCallback(() => {
    setEvaluationError(null)
    handleEvaluate()
  }, [handleEvaluate])

  return (
    <EditorLayout
      problem={problem}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      code={code}
      onCodeChange={setCode}
      cursorPosition={cursorPosition}
      onCursorChange={setCursorPosition}
      solutionRevealed={solutionRevealed}
      showRevealDialog={showRevealDialog}
      onCancelReveal={handleCancelReveal}
      onConfirmReveal={handleConfirmReveal}
      insights={insights}
      testCases={testCases}
      executionResults={executionResults}
      executionError={executionError}
      isSubmission={isSubmission}
      onExecutionResults={handleExecutionResults}
      onExecutionError={handleExecutionError}
      onEditorReady={handleEditorReady}
      onEvaluate={handleEvaluate}
      isEvaluating={isEvaluating}
      evaluationResult={evaluationResult}
      evaluationError={evaluationError}
      onDismissEvaluation={handleDismissEvaluation}
      onRetryEvaluation={handleRetryEvaluation}
      onAddCustomTest={handleAddCustomTest}
      onUpdateCustomTest={handleUpdateCustomTest}
      onDeleteCustomTest={handleDeleteCustomTest}
    />
  )
}
