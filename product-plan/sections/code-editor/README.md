# Code Editor

Split-panel coding environment for implementing solutions.

## Components

- `CodeEditor` - Main split-panel container
- `ApproachPanel` - Left panel with approach summary
- `EditorPanel` - Code textarea with line numbers
- `TestCasesPanel` - Collapsible test cases with add/delete
- `CritiquePanel` - AI feedback with suggestions
- `SubmissionModal` - Results modal with score

## Props

See `types.ts` for full interface definitions.

## Usage

```tsx
import { CodeEditor } from './components'
import type { Problem, ApproachSummary, Code, TestCase, AICritique } from './types'

const problem: Problem = {...}
const approachSummary: ApproachSummary = {...}
const code: Code = { language: 'python', content: '...' }
const testCases: TestCase[] = [...]

<CodeEditor
  problem={problem}
  approachSummary={approachSummary}
  code={code}
  testCases={testCases}
  aiCritique={null}
  submissionResult={null}
  onCodeChange={(code) => console.log(code)}
  onRunTests={() => console.log('run tests')}
  onAddTestCase={(input, expected) => console.log(input, expected)}
  onDeleteTestCase={(id) => console.log(id)}
  onRequestCritique={() => console.log('critique')}
  onSubmit={() => console.log('submit')}
  onNextProblem={() => navigate('/problems')}
/>
```
