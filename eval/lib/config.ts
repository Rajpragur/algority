import { z } from 'zod'
import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'yaml'

// Coaching parameters schema
const CoachingConfigSchema = z.object({
  min_questions_per_phase: z.number().int().min(2).max(10).default(3),
  confidence_threshold: z.number().min(0.5).max(1.0).default(0.8),
  probe_correct_answers: z.boolean().default(true),
  require_reasoning: z.boolean().default(true),
})

// Judge configuration schema
const JudgeConfigSchema = z.object({
  model: z.string().default('gemini-3.0-flash'),
  max_tokens: z.number().int().min(256).max(4096).default(1024),
})

// Criteria weights schema (should sum to 1.0)
const CriteriaWeightsSchema = z.object({
  phase_transition_timing: z.number().min(0).max(1).default(0.2),
  question_relevance: z.number().min(0).max(1).default(0.25),
  difficulty_calibration: z.number().min(0).max(1).default(0.2),
  feedback_accuracy: z.number().min(0).max(1).default(0.2),
  recovery_quality: z.number().min(0).max(1).default(0.15),
})

// Production monitoring schema
const ProductionConfigSchema = z.object({
  sample_rate: z.number().min(0).max(1).default(0),
  drift_threshold: z.number().min(0).max(1).default(0.1),
  alert_webhook_url: z.string().url().optional(),
})

// Full config schema
const EvalConfigSchema = z.object({
  coaching: CoachingConfigSchema.optional().default({
    min_questions_per_phase: 3,
    confidence_threshold: 0.8,
    probe_correct_answers: true,
    require_reasoning: true,
  }),
  judge: JudgeConfigSchema.optional().default({
    model: 'gemini-3.0-flash',
    max_tokens: 1024,
  }),
  criteria_weights: CriteriaWeightsSchema.optional().default({
    phase_transition_timing: 0.2,
    question_relevance: 0.25,
    difficulty_calibration: 0.2,
    feedback_accuracy: 0.2,
    recovery_quality: 0.15,
  }),
  production: ProductionConfigSchema.optional().default({
    sample_rate: 0,
    drift_threshold: 0.1,
  }),
})

// Export types
export type EvalConfig = z.infer<typeof EvalConfigSchema>
export type CoachingConfig = z.infer<typeof CoachingConfigSchema>
export type JudgeConfig = z.infer<typeof JudgeConfigSchema>
export type CriteriaWeights = z.infer<typeof CriteriaWeightsSchema>
export type ProductionConfig = z.infer<typeof ProductionConfigSchema>

// Config file path
const CONFIG_PATH = path.join(process.cwd(), 'eval.config.yaml')

// Cached config (for hot-reload detection)
let cachedConfig: EvalConfig | null = null
let cachedMtime: number | null = null

// Load and validate config
export function loadConfig(forceReload = false): EvalConfig {
  // Check if file exists
  if (!fs.existsSync(CONFIG_PATH)) {
    console.warn('eval.config.yaml not found, using defaults')
    return EvalConfigSchema.parse({})
  }

  // Check modification time for hot-reload
  const stats = fs.statSync(CONFIG_PATH)
  const mtime = stats.mtimeMs

  if (!forceReload && cachedConfig && cachedMtime === mtime) {
    return cachedConfig
  }

  // Load and parse YAML
  const rawContent = fs.readFileSync(CONFIG_PATH, 'utf-8')
  const rawConfig = yaml.parse(rawContent)

  // Validate with Zod
  const result = EvalConfigSchema.safeParse(rawConfig)

  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    throw new Error(`Invalid eval.config.yaml:\n${errors}`)
  }

  // Cache and return
  cachedConfig = result.data
  cachedMtime = mtime
  return result.data
}

// Get specific sections
export function getCoachingConfig(): CoachingConfig {
  return loadConfig().coaching
}

export function getJudgeConfig(): JudgeConfig {
  return loadConfig().judge
}

export function getCriteriaWeights(): CriteriaWeights {
  return loadConfig().criteria_weights
}

export function getProductionConfig(): ProductionConfig {
  return loadConfig().production
}

// Load config from a custom path (for A/B comparison)
export function loadConfigFromPath(configPath: string): EvalConfig {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`)
  }

  const rawContent = fs.readFileSync(configPath, 'utf-8')
  const rawConfig = yaml.parse(rawContent)

  const result = EvalConfigSchema.safeParse(rawConfig)

  if (!result.success) {
    const errors = result.error.issues
      .map(issue => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    throw new Error(`Invalid config ${configPath}:\n${errors}`)
  }

  return result.data
}
