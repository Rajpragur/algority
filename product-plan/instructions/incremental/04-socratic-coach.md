# Milestone 4: Socratic Coach

Build the AI-powered quiz-based coaching interface.

## Overview

An AI-powered coaching session that guides users through understanding and solving a coding problem via targeted quizzes. Users work through four structured phases of questions, then transition to the Code Editor.

## User Flows

1. Enter coaching session with a pre-selected problem
2. Read the problem summary
3. Answer questions in 4 phases:
   - Problem Understanding
   - Approach Selection
   - Implementation
   - Edge Cases & Optimization
4. Receive adaptive feedback (Correct with explanation, or Not Quite with hints)
5. Review completed phases
6. Complete all phases and proceed to Code Editor

## Components to Build

### 4.1 SocraticCoach

Main container with sticky header and scrollable chat area.

**Props:**
```typescript
interface SocraticCoachProps {
  problem: Problem
  session: Session
  phases: Phase[]
  messages: Message[]
  onSelectOption?: (questionId: string, optionIds: string[]) => void
  onSubmitAnswer?: (questionId: string) => void
  onReviewPhase?: (phaseId: string) => void
  onProceedToEditor?: () => void
}
```

### 4.2 SessionHeader

Sticky header showing:
- Problem title and difficulty badge
- Problem summary (2-3 sentences)
- Pattern tags
- Session timer (monospace, MM:SS format)

### 4.3 PhaseProgress

Phase indicator showing all 4 phases:
- **Desktop:** Horizontal progress bar with phase names
- **Mobile:** Compact dots with current phase name
- Completed phases have checkmarks and are clickable for review
- Active phase has pulse animation
- Locked phases show lock icon

### 4.4 QuestionCard

Interactive question component:
- Single-select: Radio button style (A/B/C/D)
- Multi-select: Checkbox style with "Select all that apply"
- Submit button (disabled until selection made)
- Shows user's selection when submitted

### 4.5 MessageBubble

Coach message display:
- Coach messages have emerald avatar with lightbulb icon
- Feedback messages show "Correct!" (emerald) or "Not quite!" (amber)
- Feedback includes explanation text

## Data Types

```typescript
interface Phase {
  id: string
  title: string
  description: string
  status: 'locked' | 'active' | 'completed'
  questionsTotal: number
  questionsCompleted: number
}

interface Option {
  id: string
  label: string  // A, B, C, D
  text: string
}

interface QuestionMessage {
  id: string
  type: 'question'
  questionType: 'single-select' | 'multi-select'
  content: string
  options: Option[]
  correctAnswer: string[]
}

interface FeedbackMessage {
  id: string
  type: 'feedback'
  isCorrect: boolean
  content: string
}

type Message = CoachMessage | QuestionMessage | UserAnswerMessage | FeedbackMessage
```

## Layout

- Sticky header with problem info and phase progress
- Single-column chat interface (max-w-2xl centered)
- "Continue to Code Editor" button after all phases complete

## Acceptance Criteria

- [ ] Problem info displays correctly in header
- [ ] Timer updates every second
- [ ] Phase progress shows correct states
- [ ] Single-select questions allow only one selection
- [ ] Multi-select questions allow multiple selections
- [ ] Submit button is disabled until selection made
- [ ] Feedback appears after submission
- [ ] Completed phases can be reviewed
- [ ] "Continue to Code Editor" appears after all phases
- [ ] Dark mode works correctly
