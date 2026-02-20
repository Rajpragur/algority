import * as ai from 'ai'
import { Output } from 'ai'
import type { LanguageModel } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { wrapAISDK } from 'langsmith/experimental/vercel'
import { z } from 'zod'
import type { Problem, ClientProblem, Message, QuestionMessage, FeedbackMessage, Phase, COACHING_PHASES } from './types'
import { getCoachingConfig } from './coaching-config'

// =============================================================================
// OpenRouter Configuration
// =============================================================================

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const QWEN_MODEL = 'qwen/qwen3.5-397b-a17b'
const BACKUP_MODEL = 'arcee-ai/trinity-large-preview:free'

const openrouter = createOpenAI({
  apiKey: OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  headers: {
    'HTTP-Referer': 'https://algority.com',
    'X-Title': 'AlgoRity',
  },
})

type Provider = 'qwen' | 'backup'

function getModel(provider: Provider = 'qwen'): LanguageModel {
  return openrouter(provider === 'qwen' ? QWEN_MODEL : BACKUP_MODEL)
}

// =============================================================================
// Wrap AI SDK with LangSmith tracing
// =============================================================================

const { generateText: wrappedGenerateText } = wrapAISDK(ai)

/**
 * Executes a dual-request to both Qwen and Trinity, returning the first one to succeed.
 * This significantly reduces latency by hedging against model-specific stalls.
 */
async function fastGenerateText(params: any): Promise<any> {
  const primaryModel = getModel('qwen')
  const backupModel = getModel('backup')

  // Prepare parameters for both with limits
  const baseParams = {
    ...params,
    maxTokens: 2000,
    temperature: 0.7,
  }

  const primaryParams = { ...baseParams, model: primaryModel }
  const backupParams = { ...baseParams, model: backupModel }

  try {
    // Race them! Use Promise.any to get the first SUCCESSFUL response.
    return await Promise.any([
      wrappedGenerateText(primaryParams),
      wrappedGenerateText(backupParams)
    ])
  } catch (e) {
    console.error('Both models failed:', e)
    // Fallback to primary if everything exploded
    return wrappedGenerateText(primaryParams)
  }
}

// =============================================================================
// Minimal problem data for LLM calls - excludes solution, prompt, starter_code, etc.
// =============================================================================

interface LLMProblem {
  title: string
  difficulty: string
  problem_description: string
}

export function toLLMProblem(problem: Problem): LLMProblem {
  return {
    title: problem.title,
    difficulty: problem.difficulty,
    problem_description: problem.problem_description,
  }
}

// =============================================================================
// Client-safe problem data - excludes solution, prompt, and other sensitive fields
// =============================================================================

export function toClientProblem(problem: Problem): ClientProblem {
  return {
    id: problem.id,
    title: problem.title,
    difficulty: problem.difficulty,
    problem_description: problem.problem_description,
    patterns: problem.patterns,
    problemSets: problem.problemSets,
    completionStatus: problem.completionStatus,
  }
}

// =============================================================================
// LangSmith Metadata Helper
// =============================================================================

interface TraceContext {
  sessionId: string
  phase: string
  problemDifficulty: string
  questionIndex: number
}

function langsmithOptions(runName: string, context: TraceContext) {
  return {
    name: runName,
    metadata: {
      session_id: context.sessionId,
      phase: context.phase,
      problem_difficulty: context.problemDifficulty,
      question_index: context.questionIndex,
      run_type: 'production',
    },
  }
}

// =============================================================================
// Zod Schemas
// =============================================================================

const QuestionGenerationSchema = z.object({
  content: z.string().describe('The question text'),
  questionType: z.enum(['single-select', 'multi-select']).describe('single-select: one correct answer, multi-select: multiple correct answers (use "select all that apply" phrasing)'),
  optionA: z.string().describe('Option A text'),
  optionB: z.string().describe('Option B text'),
  optionC: z.string().describe('Option C text'),
  optionD: z.string().describe('Option D text'),
  correctOptionIds: z.array(z.enum(['a', 'b', 'c', 'd'])).describe('Array of correct option IDs (1 for single-select, 1+ for multi-select)'),
})

const AnswerVerificationSchema = z.object({
  correctOptionIds: z.array(z.enum(['a', 'b', 'c', 'd'])).describe('Array of correct option IDs (1 for single-select, 1+ for multi-select)'),
  explanation: z.string().describe('Brief explanation of why these are correct'),
})

// Valid phase IDs for schema constraints
const VALID_PHASE_IDS = ['understanding', 'solution-building', 'algorithm-steps'] as const

const FeedbackSchema = z.object({
  isCorrect: z.boolean(),
  feedback: z.string(),
  shouldAdvancePhase: z.boolean(),
  nextPhase: z.enum(VALID_PHASE_IDS).nullable().describe('Must be one of: understanding, solution-building, algorithm-steps'),
})

const CoachResponseSchema = z.object({
  response: z.string(),
  shouldAdvancePhase: z.boolean(),
  nextPhase: z.enum(VALID_PHASE_IDS).nullable().describe('Must be one of: understanding, solution-building, algorithm-steps'),
  shouldFollowUpWithQuiz: z.boolean(),
  quizTopic: z.string().nullable(),
})

// =============================================================================
// Phase Objectives
// =============================================================================

type PhaseId = typeof COACHING_PHASES[number]['id']

const PHASE_OBJECTIVES: Record<PhaseId, string> = {
  understanding: 'Test problem comprehension: input/output format, constraints.',
  'solution-building': 'Build solution step-by-step: setup → logic → decisions → termination.',
  'algorithm-steps': 'Test pseudocode understanding: read/understand code, fill in blanks, identify bugs, order steps.',
}

// =============================================================================
// Format Previous Messages (concise summary for context)
// =============================================================================

function formatPreviousQA(messages: Message[], currentPhaseId?: string): string {
  const qaPairs: string[] = []

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    if (msg.type === 'question') {
      const q = msg as QuestionMessage

      const feedback = messages.slice(i + 1).find(m => m.type === 'feedback') as FeedbackMessage | undefined
      const result = feedback ? (feedback.isCorrect ? '✓' : '✗') : '?'

      // Show phase label and question content (truncated for brevity)
      const phaseLabel = q.phase === currentPhaseId ? '[current]' : `[${q.phase}]`
      qaPairs.push(`${result} ${phaseLabel} ${q.content.slice(0, 150)}${q.content.length > 150 ? '...' : ''}`)
    }
  }

  if (qaPairs.length === 0) return ''
  return `\nPREVIOUS QUESTIONS THIS SESSION:\n${qaPairs.join('\n')}\n`
}

// Format full conversation for functions that need complete context
function formatConversation(messages: Message[]): string {
  const lines: string[] = []

  for (const msg of messages) {
    switch (msg.type) {
      case 'coach':
        lines.push(`Coach: ${msg.content}`)
        break
      case 'question': {
        const q = msg as QuestionMessage
        lines.push(`Q [${q.phase}]: ${q.content}`)
        break
      }
      case 'feedback': {
        const f = msg as FeedbackMessage
        lines.push(`${f.isCorrect ? '✓' : '✗'} ${f.content}`)
        break
      }
      case 'user-question':
        lines.push(`Student asks: ${msg.content}`)
        break
      case 'coach-response':
        lines.push(`Coach: ${msg.content}`)
        break
      case 'probe-question':
        lines.push(`Probe: ${msg.content}`)
        break
      case 'probe-response':
        lines.push(`Student: ${msg.content}`)
        break
      case 'probe-evaluation':
        lines.push(`Coach: ${msg.content}`)
        break
      // Skip user-answer (redundant with feedback) and other types
    }
  }

  if (lines.length === 0) return ''
  return `\nCONVERSATION SO FAR:\n${lines.join('\n')}\n`
}

// Find the current unanswered quiz question (question with no following user-answer/feedback)
function findCurrentUnansweredQuestion(messages: Message[]): QuestionMessage | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (msg.type === 'question') {
      // Check if there's a user-answer or feedback after this question
      const hasAnswer = messages.slice(i + 1).some(m => m.type === 'user-answer' || m.type === 'feedback')
      if (!hasAnswer) {
        return msg as QuestionMessage
      }
      // If this question was answered, no need to look further back
      break
    }
  }
  return null
}

// Format the current unanswered question for context
function formatCurrentQuestion(question: QuestionMessage | null): string {
  if (!question) return ''

  const optionsText = question.options.map(o => `  ${o.label}: ${o.text}`).join('\n')
  return `\nCURRENT UNANSWERED QUIZ QUESTION:
"${question.content}"
Options:
${optionsText}
(Student has NOT answered this yet - they may be asking for help with it)\n`
}

// =============================================================================
// Verify Correct Answer (Second Pass) - Exported for background verification
// =============================================================================

export interface VerifyAnswerParams {
  problem: LLMProblem
  question: string
  questionType: 'single-select' | 'multi-select'
  options: { id: string; label: string; text: string }[]
  sessionId: string
}

export async function verifyCorrectAnswer({
  problem,
  question,
  questionType,
  options,
  sessionId,
}: VerifyAnswerParams): Promise<{ correctOptionIds: string[]; explanation: string }> {
  const optionsText = options.map(o => `${o.id.toUpperCase()}: ${o.text}`).join('\n')

  const isMulti = questionType === 'multi-select'
  const systemPrompt = `You are verifying the correct answer(s) for a coding interview question.

PROBLEM: ${problem.title} (${problem.difficulty})
${problem.problem_description}

QUESTION: ${question}
TYPE: ${questionType}

OPTIONS:
${optionsText}

Carefully analyze each option against the problem.
${isMulti ? 'This is a multi-select question - there may be MULTIPLE correct answers. Select ALL that are correct.' : 'This is single-select - determine which ONE option is correct.'}
Think step-by-step before answering.`

  const { output: result } = await fastGenerateText({
    output: Output.object({ schema: AnswerVerificationSchema }),
    system: systemPrompt,
    prompt: isMulti ? 'Which options are correct and why?' : 'Which option is correct and why?',
    providerOptions: {
      langsmith: langsmithOptions('verifyCorrectAnswer', {
        sessionId,
        phase: 'verification',
        problemDifficulty: problem.difficulty,
        questionIndex: 0,
      }),
    },
  })

  if (!result) {
    throw new Error('Failed to verify correct answer - no output returned')
  }

  return {
    correctOptionIds: result.correctOptionIds,
    explanation: result.explanation,
  }
}

// =============================================================================
// Generate Coaching Question (Two-Pass System)
// =============================================================================
// Pass 1: Generate question content and options (~4-5s)
// Pass 2: Verify correct answer(s) (~3-4s)
// For latency optimization, Pass 1 can be shown immediately while Pass 2 runs in background

interface GenerateQuestionParams {
  problem: LLMProblem
  phase: Phase
  previousMessages: Message[]
  sessionId: string
  questionIndex: number
}

// Question generation result type - single pass includes correctAnswer
export interface QuestionPass1Result {
  phase: string
  questionType: 'single-select' | 'multi-select'
  content: string
  options: { id: string; label: string; text: string }[]
  correctAnswer: string[]  // Now included in single pass
}

/**
 * Generate a complete question with content, options, and correct answer in a single pass.
 * Single-pass generation is simpler and just as accurate as two-pass verification.
 */
// Phase-specific instructions for solution-building
const SOLUTION_BUILDING_INSTRUCTIONS = `
This phase focuses on STRATEGY and REASONING, not pseudocode execution.

GOOD question types for Solution Building:
1. **Strategy Selection**: "Which approach would be most efficient for this problem?"
   - Compare brute force vs optimized approaches
   - Ask about time/space complexity trade-offs

2. **Key Insight**: "What is the key observation that makes the hash map approach work?"
   - Test understanding of WHY the solution works, not HOW to execute it

3. **Data Structure Choice**: "What should we store in our hash map?"
   - Options: values, indices, counts, complements, etc.
   - Ask WHAT to store, not how to iterate

4. **Correctness Reasoning**: "Why do we check for the complement BEFORE adding the current element?"
   - Test understanding of edge cases and ordering

5. **Complexity Analysis**: "What is the time complexity of the hash map approach?"
   - Compare different approaches

AVOID these (save for Algorithm Steps phase):
- "What does this pseudocode return for input X?" (that's pseudocode tracing)
- "What indices will this algorithm return?" (that's execution)
- Showing full pseudocode and asking to trace through it

Keep questions conceptual and focused on understanding the approach, not mechanical execution.`

// Phase-specific instructions for algorithm-steps (pseudocode questions)
const ALGORITHM_STEPS_INSTRUCTIONS = `
For this phase, generate pseudocode-based questions. Choose ONE of these question types:

1. **READ & UNDERSTAND**: Show pseudocode and ask what it does, what value it returns, or which approach it implements.
   Example: "What does this pseudocode return for input [2,7,11,15] with target=9?"

2. **FILL IN THE BLANK**: Show pseudocode with a missing line (marked as ___) and ask which option completes it correctly.
   Example: "Which line correctly completes this hash map lookup?"

3. **IDENTIFY THE BUG**: Show pseudocode with a subtle bug and ask which line is incorrect or what edge case it fails.
   Example: "This pseudocode has a bug. Which line causes it to fail for duplicate elements?"

4. **ORDER THE STEPS**: Show scrambled algorithm steps and ask for the correct order (options like "1,3,2,4" or "2,1,4,3").
   Example: "Put these steps in the correct order for the two-pointer approach."

PSEUDOCODE FORMATTING (CRITICAL):
- Put ALL pseudocode inside ONE markdown code block using triple backticks
- Do NOT use numbered lists (1. 2. 3.) for pseudocode lines
- Use indentation (spaces) to show nesting, not line numbers

CORRECT format:
\`\`\`
map = new Map()
for each i from 0 to nums.length - 1:
    complement = target - nums[i]
    if map.has(complement):
        return [map.get(complement), i]
    map.set(nums[i], i)
\`\`\`

WRONG format (do NOT do this):
1. map = new Map()
2. for each i...

Guidelines:
- Use "for each", "while", "if/else"
- Use "map.set(key, value)", "map.get(key)", "map.has(key)"
- Keep it readable pseudocode, not actual code

Vary the question type across the 3 questions in this phase.`

export async function generateQuestionPass1({
  problem,
  phase,
  previousMessages,
  sessionId,
  questionIndex,
}: GenerateQuestionParams): Promise<QuestionPass1Result> {
  const phaseObjective = PHASE_OBJECTIVES[phase.id as PhaseId]
  const previousQA = formatPreviousQA(previousMessages, phase.id)

  // Add phase-specific instructions
  let phaseSpecificInstructions = ''
  if (phase.id === 'algorithm-steps') {
    phaseSpecificInstructions = ALGORITHM_STEPS_INSTRUCTIONS
  } else if (phase.id === 'solution-building') {
    phaseSpecificInstructions = SOLUTION_BUILDING_INSTRUCTIONS
  }

  // No code interpreter for OpenRouter models
  const useCodeInterpreter = false
  const codeInterpreterInstruction = ''

  const systemPrompt = `You are a Socratic coding coach generating a multiple-choice question.

PROBLEM: ${problem.title} (${problem.difficulty})
${problem.problem_description}

CURRENT PHASE: ${phase.id}
PHASE OBJECTIVE: ${phaseObjective}
${phaseSpecificInstructions}
${previousQA}
CRITICAL: You MUST generate a COMPLETELY NEW question that is DIFFERENT from any question listed above.
- Do NOT ask about the same concept twice
- Do NOT rephrase a previous question
- Each question must test a DIFFERENT aspect of the phase objective

Generate ONE question with exactly 4 options (A, B, C, D).

Before finalizing, verify each option: if multiple options are correct, use multi-select. If exactly one is correct, use single-select.

The question must directly test the phase objective above.

IMPORTANT: The "content" field should contain ONLY the question text and any code/context.
Do NOT include "A.", "B.", "C.", "D." options in the content - those go in the separate option fields.`

  const startTime = Date.now()
  const prevQuestionCount = previousMessages.filter(m => m.type === 'question' && (m as QuestionMessage).phase === phase.id).length
  console.log(`[generateQuestionPass1] Generating - model: OpenRouter Dual Call (Qwen + Trinity Backup), phase: ${phase.id}, prevQuestions: ${prevQuestionCount}`)

  const { output: questionData } = await fastGenerateText({
    output: Output.object({ schema: QuestionGenerationSchema }),
    system: systemPrompt,
    prompt: 'Generate question.',
    providerOptions: {
      langsmith: langsmithOptions('generateQuestionPass1', {
        sessionId,
        phase: phase.id,
        problemDifficulty: problem.difficulty,
        questionIndex,
      }),
    },
  })

  if (!questionData) {
    throw new Error('Failed to generate question - no output returned')
  }

  console.log(`[generateQuestionPass1] Completed in ${Date.now() - startTime}ms - type: ${questionData.questionType}, correct: ${questionData.correctOptionIds.join(', ')}`)

  return {
    phase: phase.id,
    questionType: questionData.questionType,
    content: questionData.content,
    options: [
      { id: 'a', label: 'A', text: questionData.optionA },
      { id: 'b', label: 'B', text: questionData.optionB },
      { id: 'c', label: 'C', text: questionData.optionC },
      { id: 'd', label: 'D', text: questionData.optionD },
    ],
    correctAnswer: questionData.correctOptionIds,
  }
}

/**
 * Generate a complete coaching question with content, options, and correct answer.
 * Uses single-pass generation which is simpler and just as accurate.
 */
export async function generateCoachingQuestion({
  problem,
  phase,
  previousMessages,
  sessionId,
  questionIndex,
}: GenerateQuestionParams): Promise<QuestionMessage> {
  const result = await generateQuestionPass1({
    problem,
    phase,
    previousMessages,
    sessionId,
    questionIndex,
  })

  return {
    id: crypto.randomUUID(),
    type: 'question',
    phase: result.phase,
    questionType: result.questionType,
    content: result.content,
    options: result.options,
    correctAnswer: result.correctAnswer,
  }
}

// =============================================================================
// Evaluate Answer with Phase Transition Logic
// =============================================================================

interface EvaluateAnswerParams {
  question: QuestionMessage
  selectedOptions: string[]
  problem: LLMProblem
  phase: Phase
  currentPhaseMessages: Message[]
  previousPhaseSummaries: PhaseSummaryResult[]
  sessionId: string
  questionIndex: number
}

// Per-phase minimum questions before allowing transition
const PHASE_MIN_QUESTIONS: Record<string, number> = {
  'understanding': 2,
  'solution-building': 2,
  'algorithm-steps': 3,
}

export async function evaluateAnswer({
  question,
  selectedOptions,
  problem,
  phase,
  currentPhaseMessages,
  previousPhaseSummaries: _previousPhaseSummaries,
  sessionId,
  questionIndex,
}: EvaluateAnswerParams): Promise<FeedbackMessage> {
  void _previousPhaseSummaries

  // Determine correctness deterministically from stored correct answer
  const isCorrect = question.correctAnswer.length > 0
    ? selectedOptions.every(s => question.correctAnswer.includes(s)) &&
    question.correctAnswer.every(c => selectedOptions.includes(c))
    : false // If no correct answer stored, default to false (shouldn't happen with two-pass)

  const phaseOrder = ['understanding', 'solution-building', 'algorithm-steps', 'you-explain-it']
  const nextPhaseId = phaseOrder[phaseOrder.indexOf(phase.id) + 1] || null
  const correctInPhase = currentPhaseMessages.filter(m => m.type === 'feedback' && m.isCorrect).length
  const newCorrectCount = correctInPhase + (isCorrect ? 1 : 0)

  // Use per-phase minimums instead of global config
  const minForPhase = PHASE_MIN_QUESTIONS[phase.id] || 2

  const selectedTexts = question.options.filter(o => selectedOptions.includes(o.id)).map(o => o.text).join(', ')
  const correctTexts = question.options.filter(o => question.correctAnswer.includes(o.id)).map(o => o.text).join(', ')
  const phaseObjective = PHASE_OBJECTIVES[phase.id as PhaseId]

  const systemPrompt = `You are a Socratic coding coach providing feedback on a student's answer.

PHASE: ${phase.id} | OBJECTIVE: ${phaseObjective}

QUESTION: ${question.content}
STUDENT SELECTED: ${selectedTexts}
CORRECT ANSWER: ${correctTexts}
RESULT: ${isCorrect ? 'CORRECT' : 'INCORRECT'}

PROGRESS: ${newCorrectCount}/${minForPhase} correct in this phase

Provide brief, encouraging feedback (1-2 sentences).
IMPORTANT: Do NOT start with "Correct!", "That's right!", "Incorrect", or any correctness indicator - the UI already shows this visually.
${isCorrect ? 'Jump straight into acknowledging what they understood or reinforcing the concept.' : 'Jump straight into a gentle explanation of why the correct answer is right.'}
Set shouldAdvancePhase=true only if ${newCorrectCount} >= ${minForPhase}.`

  const startTime = Date.now()
  console.log(`[evaluateAnswer] Starting Dual-Model API call, phase: ${phase.id}, isCorrect: ${isCorrect}`)

  const { output: parsed } = await fastGenerateText({
    output: Output.object({ schema: FeedbackSchema }),
    system: systemPrompt,
    prompt: 'Generate feedback.',
    providerOptions: {
      langsmith: langsmithOptions('evaluateAnswer', {
        sessionId,
        phase: phase.id,
        problemDifficulty: problem.difficulty,
        questionIndex,
      }),
    },
  })

  if (!parsed) {
    throw new Error('Failed to evaluate answer - no output returned')
  }

  console.log(`[evaluateAnswer] API call completed in ${Date.now() - startTime}ms`)

  return {
    id: crypto.randomUUID(),
    type: 'feedback',
    phase: phase.id,
    isCorrect, // Use deterministic value, not AI's
    content: parsed.feedback,
    shouldAdvancePhase: parsed.shouldAdvancePhase,
    nextPhase: parsed.nextPhase,
  }
}

// =============================================================================
// Generate Probe Question (Open-ended)
// =============================================================================

const ProbeQuestionSchema = z.object({
  question: z.string().describe('The open-ended probe question to ask the student.'),
  probeType: z.enum(['short-answer', 'explain-reasoning', 'predict-behavior']),
})

interface GenerateProbeQuestionParams {
  problem: LLMProblem
  phase: Phase
  probeContext: string
  previousMessages: Message[]
  sessionId: string
}

export async function generateProbeQuestion({
  problem,
  phase,
  probeContext,
  previousMessages,
  sessionId,
}: GenerateProbeQuestionParams): Promise<{ question: string; probeType: 'short-answer' | 'explain-reasoning' | 'predict-behavior' }> {
  const phaseObjective = PHASE_OBJECTIVES[phase.id as PhaseId]
  const previousQA = formatPreviousQA(previousMessages, phase.id)

  const systemPrompt = `You are a Socratic coding coach generating a follow-up probe question.

PROBLEM: ${problem.title} (${problem.difficulty})
CURRENT PHASE: ${phase.id}
PHASE OBJECTIVE: ${phaseObjective}
CONTEXT: ${probeContext}
${previousQA}
Generate ONE open-ended probe question that:
- Tests understanding related to the phase objective
- Requires explanation (not yes/no)
- Is focused on a single concept
- Does NOT repeat topics already covered above

probeType options:
- short-answer: expects 1-2 sentence response
- explain-reasoning: expects 2-3 sentence explanation
- predict-behavior: asks "what would happen if..."`

  const { output: parsed } = await fastGenerateText({
    output: Output.object({ schema: ProbeQuestionSchema }),
    system: systemPrompt,
    prompt: 'Generate probe.',
    providerOptions: {
      langsmith: langsmithOptions('generateProbeQuestion', {
        sessionId,
        phase: phase.id,
        problemDifficulty: problem.difficulty,
        questionIndex: previousMessages.filter(m => m.type === 'question').length,
      }),
    },
  })

  if (!parsed) {
    throw new Error('Failed to generate probe question - no output returned')
  }

  return {
    question: parsed.question,
    probeType: parsed.probeType,
  }
}

// =============================================================================
// Evaluate Probe Response (Free-form)
// =============================================================================

const ProbeEvaluationSchema = z.object({
  evaluation: z.string(),
  understandingLevel: z.enum(['strong', 'partial', 'unclear', 'incorrect']),
  needsClarification: z.boolean(),
  clarificationQuestion: z.string().nullable(),
  shouldAdvancePhase: z.boolean(),
  nextPhase: z.enum(VALID_PHASE_IDS).nullable().describe('Must be one of: understanding, solution-building, algorithm-steps'),
})

interface EvaluateProbeResponseParams {
  problem: LLMProblem
  phase: Phase
  probeQuestion: string
  studentResponse: string
  previousMessages: Message[]
  sessionId: string
}

export async function evaluateProbeResponse({
  problem,
  phase,
  probeQuestion,
  studentResponse,
  previousMessages,
  sessionId,
}: EvaluateProbeResponseParams): Promise<{
  evaluation: string
  understandingLevel: 'strong' | 'partial' | 'unclear' | 'incorrect'
  needsClarification: boolean
  clarificationQuestion: string | null
  shouldAdvancePhase: boolean
  nextPhase: string | null
}> {
  const config = getCoachingConfig()

  const phaseOrder = ['understanding', 'solution-building', 'algorithm-steps', 'you-explain-it']
  const nextPhaseId = phaseOrder[phaseOrder.indexOf(phase.id) + 1] || null
  const correctInPhase = previousMessages.filter(m => m.type === 'feedback' && m.isCorrect).length
  const phaseObjective = PHASE_OBJECTIVES[phase.id as PhaseId]

  const systemPrompt = `You are a Socratic coding coach evaluating a student's free-form response.

PROBLEM: ${problem.title} (${problem.difficulty})
CURRENT PHASE: ${phase.id}
PHASE OBJECTIVE: ${phaseObjective}

PROBE QUESTION: ${probeQuestion}
STUDENT'S RESPONSE: ${studentResponse}

PROGRESS: ${correctInPhase}/${config.min_questions_per_phase} correct answers in this phase

Evaluate the response. Be lenient - accept the right general idea even if imperfectly stated.

Understanding levels:
- strong: demonstrates clear grasp of the concept
- partial: shows understanding with some gaps
- unclear: response is vague or incomplete
- incorrect: shows misconception

Set shouldAdvancePhase=true only if student has ${config.min_questions_per_phase}+ correct AND shows strong/partial understanding.
Set needsClarification=false by default.`

  const { output: parsed } = await fastGenerateText({
    output: Output.object({ schema: ProbeEvaluationSchema }),
    system: systemPrompt,
    prompt: 'Evaluate.',
    providerOptions: {
      langsmith: langsmithOptions('evaluateProbeResponse', {
        sessionId,
        phase: phase.id,
        problemDifficulty: problem.difficulty,
        questionIndex: previousMessages.filter(m => m.type === 'question').length,
      }),
    },
  })

  if (!parsed) {
    throw new Error('Failed to evaluate probe response - no output returned')
  }

  return {
    evaluation: parsed.evaluation,
    understandingLevel: parsed.understandingLevel,
    needsClarification: parsed.needsClarification,
    clarificationQuestion: parsed.clarificationQuestion,
    shouldAdvancePhase: parsed.shouldAdvancePhase,
    nextPhase: parsed.nextPhase,
  }
}

// =============================================================================
// Generate Phase Intro WITH First Question
// =============================================================================

interface GeneratePhaseIntroWithQuestionParams {
  problem: LLMProblem
  phase: Phase
  previousMessages?: Message[]
  sessionId: string
  questionIndex: number
}

export interface PhaseIntroWithQuestionResult {
  intro: string
  question: QuestionMessage
}

export async function generatePhaseIntroWithQuestion({
  problem,
  phase,
  previousMessages: _previousMessages = [],
  sessionId,
  questionIndex,
}: GeneratePhaseIntroWithQuestionParams): Promise<PhaseIntroWithQuestionResult> {
  void _previousMessages

  const phaseObjective = PHASE_OBJECTIVES[phase.id as PhaseId]

  // Updated schema to include correctOptionIds for single-pass generation
  const PhaseIntroWithAnswerSchema = z.object({
    intro: z.string().describe('1-2 sentence phase intro'),
    questionContent: z.string().describe('The question text'),
    questionType: z.enum(['single-select', 'multi-select']).describe('single-select: one correct answer, multi-select: multiple correct answers'),
    optionA: z.string().describe('Option A text'),
    optionB: z.string().describe('Option B text'),
    optionC: z.string().describe('Option C text'),
    optionD: z.string().describe('Option D text'),
    correctOptionIds: z.array(z.enum(['a', 'b', 'c', 'd'])).describe('Array of correct option IDs (1 for single-select, 1+ for multi-select)'),
  })

  // No code interpreter for OpenRouter models
  const useCodeInterpreter = false
  const codeInterpreterInstruction = ''

  const systemPrompt = `You are a Socratic coding coach transitioning to a new phase.

PROBLEM: ${problem.title} (${problem.difficulty})
${problem.problem_description}

NEW PHASE: ${phase.id}
PHASE OBJECTIVE: ${phaseObjective}

Generate:
1. A brief intro (1-2 sentences) explaining what this phase will focus on
2. A question with exactly 4 options (A, B, C, D)
3. The correct answer(s) - use multi-select if multiple options are correct

The question must directly test the phase objective above.

IMPORTANT: The "questionContent" field should contain ONLY the question text and any code/context.
Do NOT include "A.", "B.", "C.", "D." options in questionContent - those go in the separate option fields.`

  const startTime = Date.now()
  console.log(`[generatePhaseIntroWithQuestion] Generating - model: OpenRouter Dual Call, phase: ${phase.id}`)

  const { output: questionData } = await fastGenerateText({
    output: Output.object({ schema: PhaseIntroWithAnswerSchema }),
    system: systemPrompt,
    prompt: 'Generate intro and question with correct answer.',
    providerOptions: {
      langsmith: langsmithOptions('generatePhaseIntroWithQuestion', {
        sessionId,
        phase: phase.id,
        problemDifficulty: problem.difficulty,
        questionIndex,
      }),
    },
  })

  if (!questionData) {
    throw new Error('Failed to generate phase intro with question - no output returned')
  }

  console.log(`[generatePhaseIntroWithQuestion] Completed in ${Date.now() - startTime}ms - type: ${questionData.questionType}, correct: ${questionData.correctOptionIds.join(', ')}`)

  return {
    intro: questionData.intro,
    question: {
      id: crypto.randomUUID(),
      type: 'question',
      phase: phase.id,
      questionType: questionData.questionType,
      content: questionData.questionContent,
      options: [
        { id: 'a', label: 'A', text: questionData.optionA },
        { id: 'b', label: 'B', text: questionData.optionB },
        { id: 'c', label: 'C', text: questionData.optionC },
        { id: 'd', label: 'D', text: questionData.optionD },
      ],
      correctAnswer: questionData.correctOptionIds,
    },
  }
}

// =============================================================================
// Generate First Question
// =============================================================================

const FirstQuestionGenerationSchema = z.object({
  intro: z.string().describe('1-sentence encouraging intro'),
  content: z.string().describe('The question text'),
  questionType: z.enum(['single-select', 'multi-select']).describe('single-select: one correct answer, multi-select: multiple correct answers'),
  optionA: z.string().describe('Option A text'),
  optionB: z.string().describe('Option B text'),
  optionC: z.string().describe('Option C text'),
  optionD: z.string().describe('Option D text'),
  correctOptionIds: z.array(z.enum(['a', 'b', 'c', 'd'])).describe('Array of correct option IDs (1 for single-select, 1+ for multi-select)'),
})

interface GenerateFirstQuestionParams {
  problem: LLMProblem
  sessionId: string
}

export interface FirstQuestionResult {
  intro: string
  question: QuestionMessage
}

export async function generateFirstQuestion({
  problem,
  sessionId,
}: GenerateFirstQuestionParams): Promise<FirstQuestionResult> {
  const systemPrompt = `You are a Socratic coding coach starting a new coaching session.

PROBLEM: ${problem.title} (${problem.difficulty})
${problem.problem_description}

PHASE: understanding
PHASE OBJECTIVE: ${PHASE_OBJECTIVES['understanding']}

Generate:
1. A brief, encouraging intro (1 sentence) welcoming the student to this problem
2. A question with exactly 4 options (A, B, C, D)
3. The correct answer(s) - use multi-select if multiple options are correct

The question must test problem comprehension - ensure the student understands inputs, outputs, and constraints.

IMPORTANT: The "content" field should contain ONLY the question text.
Do NOT include "A.", "B.", "C.", "D." options in content - those go in the separate option fields.`

  const startTime = Date.now()
  console.log(`[generateFirstQuestion] Generating - model: OpenRouter Dual Call`)

  const { output: questionData } = await fastGenerateText({
    output: Output.object({ schema: FirstQuestionGenerationSchema }),
    system: systemPrompt,
    prompt: 'Generate intro and question with correct answer.',
    providerOptions: {
      langsmith: langsmithOptions('generateFirstQuestion', {
        sessionId,
        phase: 'understanding',
        problemDifficulty: problem.difficulty,
        questionIndex: 0,
      }),
    },
  })

  if (!questionData) {
    throw new Error('Failed to generate first question - no output returned')
  }

  console.log(`[generateFirstQuestion] Completed in ${Date.now() - startTime}ms - type: ${questionData.questionType}, correct: ${questionData.correctOptionIds.join(', ')}`)

  return {
    intro: questionData.intro,
    question: {
      id: crypto.randomUUID(),
      type: 'question',
      phase: 'understanding',
      questionType: questionData.questionType,
      content: questionData.content,
      options: [
        { id: 'a', label: 'A', text: questionData.optionA },
        { id: 'b', label: 'B', text: questionData.optionB },
        { id: 'c', label: 'C', text: questionData.optionC },
        { id: 'd', label: 'D', text: questionData.optionD },
      ],
      correctAnswer: questionData.correctOptionIds,
    },
  }
}

// =============================================================================
// Respond to User Question
// =============================================================================

interface RespondToQuestionParams {
  problem: LLMProblem
  phase: Phase
  userQuestion: string
  previousMessages: Message[]
  sessionId: string
  questionIndex: number
}

export interface CoachResponseResult {
  response: string
  shouldFollowUpWithQuiz: boolean
  quizTopic: string | null
  shouldAdvancePhase: boolean
  nextPhase: string | null
}

export async function respondToUserQuestion({
  problem,
  phase,
  userQuestion,
  previousMessages,
  sessionId,
  questionIndex,
}: RespondToQuestionParams): Promise<CoachResponseResult> {
  const phaseOrder = ['understanding', 'solution-building', 'algorithm-steps', 'you-explain-it']
  const nextPhaseId = phaseOrder[phaseOrder.indexOf(phase.id) + 1] || null
  const correctAnswers = previousMessages.filter(m => m.type === 'feedback' && m.isCorrect).length
  const phaseObjective = PHASE_OBJECTIVES[phase.id as PhaseId]
  const conversation = formatConversation(previousMessages)

  // Find current unanswered question - student may be asking about it
  const currentQuestion = findCurrentUnansweredQuestion(previousMessages)
  const currentQuestionContext = formatCurrentQuestion(currentQuestion)

  const systemPrompt = `You are a Socratic coding coach answering a student's question.

PROBLEM: ${problem.title} (${problem.difficulty})
${problem.problem_description}

CURRENT PHASE: ${phase.id}
PHASE OBJECTIVE: ${phaseObjective}
NEXT PHASE: ${nextPhaseId || 'session complete'}
PROGRESS: ${correctAnswers} correct answers
${conversation}${currentQuestionContext}
STUDENT'S NEW QUESTION: "${userQuestion}"

Answer directly in 2-4 sentences. Be helpful but don't give away the solution.
- If asking for a hint about the current quiz question, give a hint about THAT specific question without revealing the answer
- Reference the conversation above if relevant to the question
- Answer the question directly without ending with counter-questions
- ALWAYS set shouldFollowUpWithQuiz=false - there is already a pending quiz question
- Only set shouldAdvancePhase=true if the student has clearly mastered the current phase objective`

  const { output: parsed } = await fastGenerateText({
    output: Output.object({ schema: CoachResponseSchema }),
    system: systemPrompt,
    prompt: 'Respond.',
    providerOptions: {
      langsmith: langsmithOptions('respondToUserQuestion', {
        sessionId,
        phase: phase.id,
        problemDifficulty: problem.difficulty,
        questionIndex,
      }),
    },
  })

  if (!parsed) {
    throw new Error('Failed to respond to user question - no output returned')
  }

  return {
    response: parsed.response,
    shouldFollowUpWithQuiz: parsed.shouldFollowUpWithQuiz,
    quizTopic: parsed.quizTopic,
    shouldAdvancePhase: parsed.shouldAdvancePhase,
    nextPhase: parsed.nextPhase,
  }
}

// =============================================================================
// Generate Phase Summary (at phase transitions)
// =============================================================================

const PhaseSummarySchema = z.object({
  conceptsCovered: z.array(z.string()),
  summary: z.string(),
})

interface GeneratePhaseSummaryParams {
  problem: LLMProblem
  phaseId: string
  phaseMessages: Message[]
  sessionId: string
}

export interface PhaseSummaryResult {
  phaseId: string
  conceptsCovered: string[]
  summary: string
}

export async function generatePhaseSummary({
  problem,
  phaseId,
  phaseMessages,
  sessionId,
}: GeneratePhaseSummaryParams): Promise<PhaseSummaryResult> {
  const conversation = phaseMessages
    .map(m => {
      switch (m.type) {
        case 'question':
          const q = m as QuestionMessage
          return `Q: ${q.content}`
        case 'feedback':
          const f = m as FeedbackMessage
          return `${f.isCorrect ? '✓' : '✗'} ${f.content}`
        case 'probe-question':
          return `Probe: ${m.content}`
        case 'probe-response':
          return `Student: ${m.content}`
        default:
          return ''
      }
    })
    .filter(Boolean)
    .join('\n')

  const systemPrompt = `Summarize student's performance in this phase.

PROBLEM: ${problem.title}
PHASE: ${phaseId}

CONVERSATION:
${conversation}

Extract KEY CONCEPTS demonstrated (3-5 items max).
One sentence summary.`

  try {
    const { output: parsed } = await fastGenerateText({
      output: Output.object({ schema: PhaseSummarySchema }),
      system: systemPrompt,
      prompt: "Summarize the student's performance in this phase.",
      providerOptions: {
        langsmith: langsmithOptions('generatePhaseSummary', {
          sessionId,
          phase: phaseId,
          problemDifficulty: problem.difficulty,
          questionIndex: phaseMessages.filter(m => m.type === 'question').length,
        }),
      },
    })

    if (!parsed) {
      throw new Error('No output returned')
    }

    return {
      phaseId,
      conceptsCovered: parsed.conceptsCovered,
      summary: parsed.summary,
    }
  } catch {
    return {
      phaseId,
      conceptsCovered: ['phase completed'],
      summary: `Completed ${phaseId} phase.`,
    }
  }
}

// =============================================================================
// Code Evaluation (Socratic Feedback)
// =============================================================================

export const CodeEvaluationSchema = z.object({
  isOnTrack: z.boolean(),
  issueType: z.enum(['syntax', 'logic', 'edge-case', 'efficiency', 'none']).nullable(),
  hint: z.string().nullable(),
  feedback: z.string(),
  suggestedImprovement: z.string().nullable(),
})

export type CodeEvaluation = z.infer<typeof CodeEvaluationSchema>

interface EvaluateCodeParams {
  code: string
  problem: { title: string; description: string; solution: string; prompt?: string | null }
  isSelection: boolean
}

export async function evaluateCodeAI({
  code,
  problem,
  isSelection,
}: EvaluateCodeParams): Promise<CodeEvaluation> {
  const systemPrompt = `Socratic code tutor. Help discover issues WITHOUT revealing answers.

Problem: ${problem.title}
${problem.prompt ? `Preamble provided: ${problem.prompt}` : ''}
${isSelection ? 'Reviewing selected portion.' : 'Reviewing entire solution.'}

Code:
\`\`\`
${code}
\`\`\`

Rules:
- issueType: syntax | logic | edge-case | efficiency | none
- feedback: 1-2 sentence observation (NO questions)
- hint: ONE guiding question (null if correct)
- Be encouraging`

  const { output: parsed } = await fastGenerateText({
    output: Output.object({ schema: CodeEvaluationSchema }),
    system: systemPrompt,
    prompt: 'Evaluate.',
    providerOptions: {
      langsmith: {
        name: 'evaluateCode',
        metadata: { run_type: 'production' },
      },
    },
  })

  if (!parsed) {
    throw new Error('Failed to evaluate code - no output returned')
  }

  return parsed
}
