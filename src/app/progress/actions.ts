'use server'

import { createServerSupabaseClient } from '@/lib/supabase'
import type { UserProfile } from '@/lib/types'
import { redis } from '@/lib/redis'

export interface PatternProgress {
    id: string
    name: string
    slug: string
    total: number
    solved: number
    percentage: number
}

export interface ProgressData {
    readinessScore: number
    totalSolved: number
    patternStats: PatternProgress[]
    recentActivity: { date: string; count: number }[]
    pendingProblems: { id: number; title: string; difficulty: string; lastAccessed: string }[]
}

export async function getUserProgress(): Promise<ProgressData | null> {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const cacheKey = `progress:${user.id}`
    if (redis) {
        try {
            const cached = await redis.get<ProgressData>(cacheKey)
            if (cached) return cached
        } catch (e) {
            console.warn('Redis progress get error:', e)
        }
    }

    // 1. Fetch user's sessions (completed and pending)
    const { data: sessions } = await supabase
        .from('coaching_sessions')
        .select('problem_id, completed_at, updated_at, problems(id, title, difficulty)')
        .eq('user_id', user.id)

    const completedSessions = sessions?.filter(s => s.completed_at) || []
    const pendingSessions = sessions?.filter(s => !s.completed_at) || []

    const solvedProblemIds = new Set(completedSessions.map(s => s.problem_id))

    // Parse pending problems map to avoid duplicates
    const pendingMap = new Map<number, any>()
    pendingSessions.forEach(s => {
        if (!solvedProblemIds.has(s.problem_id)) {
            const problem = Array.isArray(s.problems) ? s.problems[0] : s.problems
            if (problem) {
                pendingMap.set(s.problem_id, {
                    id: problem.id,
                    title: problem.title || `Problem ${problem.id}`,
                    difficulty: problem.difficulty || 'Medium',
                    lastAccessed: s.updated_at || s.completed_at || new Date().toISOString()
                })
            }
        }
    })
    const pendingProblems = Array.from(pendingMap.values()).sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())

    // 2. Fetch all patterns
    const { data: patterns } = await supabase
        .from('patterns')
        .select('id, name, slug')
        .order('name')

    if (!patterns) return null

    // 3. Fetch all problem-pattern associations
    const { data: allProblemPatterns } = await supabase
        .from('problem_patterns')
        .select('pattern_id, problem_id')

    // 4. Calculate Pattern Stats
    const patternStats = patterns.map(p => {
        const problemsWithPattern = allProblemPatterns?.filter(pp => pp.pattern_id === p.id) || []
        const total = problemsWithPattern.length

        // Count how many of these problems the user has solved
        // Note: A problem might have multiple patterns, so it contributes to multiple pattern stats
        const solved = problemsWithPattern.filter(pp => solvedProblemIds.has(pp.problem_id)).length

        return {
            id: p.id,
            name: p.name,
            slug: p.slug,
            total,
            solved,
            percentage: total > 0 ? Math.round((solved / total) * 100) : 0
        }
    })

    // Sort by solved count (most active patterns first), then by name
    patternStats.sort((a, b) => b.solved - a.solved || a.name.localeCompare(b.name))

    // 5. Readiness Score Calculation
    // Simple heuristic: Based on NeetCode 150 progress approx.
    // 150 problems = 100% readiness (roughly)
    const totalSolvedCount = solvedProblemIds.size
    const readinessScore = Math.min(100, Math.round((totalSolvedCount / 150) * 100))

    // 6. Recent Activity (Last 30 days)
    // Group completed_at by date
    const activityMap = new Map<string, number>()
    sessions?.forEach(session => {
        if (!session.completed_at) return
        const date = new Date(session.completed_at).toISOString().split('T')[0]
        activityMap.set(date, (activityMap.get(date) || 0) + 1)
    })

    // Generate last 365 days array for heatmap (or 30/60 days)
    // For a heatmap, we usually want a full year or at least a few months.
    // Let's just return the raw map data array
    const recentActivity = Array.from(activityMap.entries()).map(([date, count]) => ({ date, count }))

    const result = {
        readinessScore,
        totalSolved: totalSolvedCount,
        patternStats,
        recentActivity,
        pendingProblems
    }

    if (redis) {
        try {
            await redis.set(cacheKey, result, { ex: 30 }) // Cache for 30 seconds
        } catch (e) {
            console.warn('Redis progress set error:', e)
        }
    }

    return result
}
