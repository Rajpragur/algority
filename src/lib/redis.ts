import { Redis } from '@upstash/redis'

// Check if credentials exist to avoid crashing the app if they are missing
const hasRedisCredentials =
    !!process.env.UPSTASH_REDIS_REST_URL &&
    !!process.env.UPSTASH_REDIS_REST_TOKEN

// Create a single global instance for the application
export const redis = hasRedisCredentials
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL || '',
        token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    })
    : null
