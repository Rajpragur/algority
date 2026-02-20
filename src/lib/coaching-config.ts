import { z } from 'zod'
import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'yaml'

// Coaching parameters schema
const CoachingConfigSchema = z.object({
  min_questions_per_phase: z.number().int().min(2).max(10).default(2),
  confidence_threshold: z.number().min(0.5).max(1.0).default(0.7),
  probe_correct_answers: z.boolean().default(true),
  require_reasoning: z.boolean().default(true),
  // Productive struggle ideal range
  struggle_min: z.number().min(0).max(1).default(0.4),
  struggle_max: z.number().min(0).max(1).default(0.7),
  // Adaptive phase transition thresholds
  early_transition_threshold: z.number().min(0.8).max(1.0).default(0.85),
  borderline_confidence_min: z.number().min(0.5).max(0.8).default(0.6),
  borderline_confidence_max: z.number().min(0.6).max(0.9).default(0.8),
})

// Full config schema (just the coaching section for now)
const EvalConfigSchema = z.object({
  coaching: CoachingConfigSchema.optional().default({
    min_questions_per_phase: 2,
    confidence_threshold: 0.7,
    probe_correct_answers: true,
    require_reasoning: true,
    struggle_min: 0.4,
    struggle_max: 0.7,
    early_transition_threshold: 0.85,
    borderline_confidence_min: 0.6,
    borderline_confidence_max: 0.8,
  }),
})

// Export types
export type CoachingConfig = z.infer<typeof CoachingConfigSchema>

// Config file path
const CONFIG_PATH = path.join(process.cwd(), 'eval.config.yaml')

// Cached config
let cachedConfig: CoachingConfig | null = null
let cachedMtime: number | null = null

// Load and validate config
export function getCoachingConfig(): CoachingConfig {
  // Check if file exists
  if (!fs.existsSync(CONFIG_PATH)) {
    console.warn('eval.config.yaml not found, using defaults')
    return EvalConfigSchema.parse({}).coaching
  }

  // Check modification time for hot-reload
  try {
    const stats = fs.statSync(CONFIG_PATH)
    const mtime = stats.mtimeMs

    if (cachedConfig && cachedMtime === mtime) {
      return cachedConfig
    }

    // Load and parse YAML
    const rawContent = fs.readFileSync(CONFIG_PATH, 'utf-8')
    const rawConfig = yaml.parse(rawContent)

    // Validate with Zod
    const result = EvalConfigSchema.safeParse(rawConfig)

    if (!result.success) {
      console.error('Invalid eval.config.yaml, using defaults:', result.error.issues)
      return EvalConfigSchema.parse({}).coaching
    }

    // Cache and return
    cachedConfig = result.data.coaching
    cachedMtime = mtime
    return result.data.coaching
  } catch (error) {
    console.error('Error loading config:', error)
    return EvalConfigSchema.parse({}).coaching
  }
}
