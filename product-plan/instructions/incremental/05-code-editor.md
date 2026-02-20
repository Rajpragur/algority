# Milestone 5: Code Editor

Build the split-panel coding environment.

## Overview

A split-panel coding environment where users implement their solution based on the approach developed during coaching. The left panel shows the approach summary, while the right panel contains the code editor with testing and critique capabilities.

## User Flows

1. Enter from Socratic Coach with approach summary pre-populated
2. Write code in the editor
3. Add custom test cases
4. Run tests (user-created + problem examples)
5. Request AI critique
6. Submit solution for final scoring
7. After success, continue to next problem

## Components to Build

### 5.1 CodeEditor

Main split-panel container.

**Props:**
```typescript
interface CodeEditorProps {
  problem: Problem
  approachSummary: ApproachSummary
  code: Code
  testCases: TestCase[]
  aiCritique: AICritique | null
  submissionResult: SubmissionResult | null
  onCodeChange?: (code: string) => void
  onRunTests?: () => void
  onAddTestCase?: (input: string, expectedOutput: string) => void
  onDeleteTestCase?: (testId: string) => void
  onRequestCritique?: () => void
  onToggleCritique?: () => void
  onSubmit?: () => void
  onNextProblem?: () => void
}
```

### 5.2 ApproachPanel

Left panel showing:
- Problem title and difficulty
- Problem description
- Approach summary with numbered steps
- Time/space complexity

### 5.3 EditorPanel

Code editor with:
- File name header (e.g., "solution.py")
- Language indicator
- Line numbers
- Syntax highlighting (or plain monospace for MVP)
- Textarea for code input

### 5.4 TestCasesPanel

Collapsible test cases section:
- Header with pass/fail counts
- List of test cases showing input, expected output, actual output
- Status indicators (pending, running, passed, failed)
- Inline "Add Test Case" form
- Delete button for user-created tests

### 5.5 CritiquePanel

Collapsible AI feedback section:
- Overall assessment
- Suggestions with type icons:
  - Improvement (blue)
  - Style (purple)
  - Optimization (emerald)
  - Bug (red)

### 5.6 SubmissionModal

Modal showing submission results:
- Status icon and title (Accepted, Wrong Answer, Time Limit, Runtime Error)
- Score percentage
- Pass/fail breakdown
- Runtime and memory stats
- "Review Code" and "Next Problem" buttons

## Data Types

```typescript
interface ApproachSummary {
  title: string
  steps: string[]
  timeComplexity: string
  spaceComplexity: string
}

interface TestCase {
  id: string
  type: 'example' | 'user'
  input: string
  expectedOutput: string
  actualOutput?: string
  status: 'pending' | 'running' | 'passed' | 'failed'
  runtime?: string
}

interface Suggestion {
  type: 'improvement' | 'style' | 'optimization' | 'bug'
  title: string
  description: string
}

interface AICritique {
  isVisible: boolean
  overallAssessment: string
  suggestions: Suggestion[]
}

interface SubmissionResult {
  score: number
  totalTests: number
  passedTests: number
  failedTests: number
  runtime: string
  memory: string
  status: 'accepted' | 'wrong_answer' | 'time_limit' | 'runtime_error'
}
```

## Layout

- Split panel: left (320-384px), right (flexible)
- On mobile: stacked vertically with approach on top
- Action bar fixed at bottom of right panel

## Acceptance Criteria

- [ ] Split panel layout works on desktop
- [ ] Mobile stacked layout works
- [ ] Code textarea is editable with line numbers
- [ ] Test cases can be added and deleted
- [ ] Test status updates correctly after running
- [ ] AI critique panel toggles open/closed
- [ ] Submit shows modal with results
- [ ] "Next Problem" navigates correctly
- [ ] Dark mode works correctly
