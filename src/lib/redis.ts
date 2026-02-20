import { Redis } from '@upstash/redis'

// Check if credentials exist to avoid crashing the app if they are missing
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN

const hasRedisCredentials = !!REDIS_URL && !!REDIS_TOKEN

// Create a single global instance for the application
export const redis = hasRedisCredentials
    ? new Redis({
        url: REDIS_URL || '',
        token: REDIS_TOKEN || '',
    })
    : null
