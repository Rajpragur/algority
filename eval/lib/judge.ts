import { generateText } from 'ai'
import { google } from '@ai-sdk/google'
import * as fs from 'fs'
import * as path from 'path'
import type { CriterionScore, EvalSession, EvalResult } from './types'
import { getJudgeConfig, getCriteriaWeights, type CriteriaWeights } from './config'

// Verify Google API key is configured
function verifyApiKey(): void {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY not configured')
  }
}

// Retry configuration
const MAX_RETRIES = 3
const INITIAL_DELAY_MS = 1000

// Sleep helper for retry delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Load prompt template from file
function loadPrompt(criterionName: string): string {
  const promptPath = path.join(process.cwd(), 'eval', 'prompts', `${criterionName}.md`)
  if (!fs.existsSync(promptPath)) {
    throw new Error(`Prompt not found: ${promptPath}`)
  }
  return fs.readFileSync(promptPath, 'utf-8')
}

// Format session for judge context
function formatSessionContext(session: EvalSession): string {
  const transcript = session.messages
    .map(m => `[${m.type.toUpperCase()}]: ${m.content}`)
    .join('\n\n')

  return `
PROBLEM: ${session.problem.title}
DIFFICULTY: ${session.problem.difficulty}
DESCRIPTION: ${session.problem.description}

TRANSCRIPT:
${transcript}
`.trim()
}

// The five evaluation criteria
const CRITERIA = [
  'phase-transition-timing',
  'question-relevance',
  'difficulty-calibration',
  'feedback-accuracy',
  'recovery-quality',
] as const

type CriterionName = typeof CRITERIA[number]

// Map criterion names to config weight keys
const CRITERION_TO_WEIGHT_KEY: Record<CriterionName, keyof CriteriaWeights> = {
  'phase-transition-timing': 'phase_transition_timing',
  'question-relevance': 'question_relevance',
  'difficulty-calibration': 'difficulty_calibration',
  'feedback-accuracy': 'feedback_accuracy',
  'recovery-quality': 'recovery_quality',
}

// Evaluate a single criterion with retry logic
export async function evaluateCriterion(
  session: EvalSession,
  criterionName: string
): Promise<CriterionScore> {
  verifyApiKey()
  const judgeConfig = getJudgeConfig()

  const promptTemplate = loadPrompt(criterionName)
  const sessionContext = formatSessionContext(session)
  const fullPrompt = promptTemplate.replace('{{SESSION_CONTEXT}}', sessionContext)

  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const { text } = await generateText({
        model: google(judgeConfig.model),
        prompt: fullPrompt,
      })

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const result = JSON.parse(jsonMatch[0])
      return {
        criterion: criterionName,
        score: result.score,
        reasoning: result.reasoning,
        evidence: result.evidence || [],
      }
    } catch (error) {
      lastError = error as Error
      if (attempt < MAX_RETRIES - 1) {
        const delay = INITIAL_DELAY_MS * Math.pow(2, attempt)
        console.warn(`Retry ${attempt + 1}/${MAX_RETRIES} after ${delay}ms: ${lastError.message}`)
        await sleep(delay)
      }
    }
  }

  throw new Error(`Failed after ${MAX_RETRIES} retries: ${lastError?.message}`)
}

// Calculate weighted aggregate score
function calculateWeightedScore(scores: CriterionScore[], weights: CriteriaWeights): number {
  let totalWeight = 0
  let weightedSum = 0

  for (const score of scores) {
    const weightKey = CRITERION_TO_WEIGHT_KEY[score.criterion as CriterionName]
    if (weightKey) {
      const weight = weights[weightKey]
      weightedSum += score.score * weight
      totalWeight += weight
    }
  }

  // Normalize by total weight (should be ~1.0 but handle edge cases)
  return totalWeight > 0 ? weightedSum / totalWeight : 0
}

// Evaluate a full session on all 5 criteria
export async function evaluateSession(session: EvalSession): Promise<EvalResult> {
  const scores: CriterionScore[] = []

  // Evaluate each criterion sequentially (to avoid rate limits)
  for (const criterion of CRITERIA) {
    console.log(`Evaluating criterion: ${criterion}...`)
    const score = await evaluateCriterion(session, criterion)
    scores.push(score)
  }

  // Calculate weighted aggregate
  const weights = getCriteriaWeights()
  const overallScore = calculateWeightedScore(scores, weights)

  return {
    sessionId: session.sessionId,
    evaluatedAt: new Date().toISOString(),
    scores,
    overallScore,
  }
}
