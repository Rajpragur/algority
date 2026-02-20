// =============================================================================
// Data Types
// =============================================================================

export interface Example {
  input: string
  output: string
  explanation: string
}

export interface Problem {
  id: string
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  patterns: string[]
  description: string
  summary: string
  examples: Example[]
  constraints: string[]
}

export interface Session {
  id: string
  problemId: string
  elapsedSeconds: number
  currentPhase: string
  startedAt: string
}

export interface Phase {
  id: string
  title: string
  description: string
  status: 'locked' | 'active' | 'completed'
  questionsTotal: number
  questionsCompleted: number
}

export interface Option {
  id: string
  label: string
  text: string
}

export interface CoachMessage {
  id: string
  type: 'coach'
  content: string
}

export interface QuestionMessage {
  id: string
  type: 'question'
  questionType: 'single-select' | 'multi-select'
  content: string
  options: Option[]
  correctAnswer: string[]
}

export interface UserAnswerMessage {
  id: string
  type: 'user-answer'
  selectedOptions: string[]
}

export interface FeedbackMessage {
  id: string
  type: 'feedback'
  isCorrect: boolean
  content: string
}

export type Message = CoachMessage | QuestionMessage | UserAnswerMessage | FeedbackMessage

// =============================================================================
// Component Props
// =============================================================================

export interface SocraticCoachProps {
  /** The problem being worked on */
  problem: Problem
  /** The current coaching session */
  session: Session
  /** The four coaching phases with their status */
  phases: Phase[]
  /** The dialogue messages (questions, answers, feedback) */
  messages: Message[]
  /** Called when user selects an answer option */
  onSelectOption?: (questionId: string, optionIds: string[]) => void
  /** Called when user submits their answer */
  onSubmitAnswer?: (questionId: string) => void
  /** Called when user clicks to review a completed phase */
  onReviewPhase?: (phaseId: string) => void
  /** Called when user completes all phases and proceeds to Code Editor */
  onProceedToEditor?: () => void
}
