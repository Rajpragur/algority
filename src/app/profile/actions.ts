'use server'

import { createServerSupabaseClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import type { UserProfile, UserStats, Difficulty } from '@/lib/types'
import { redis } from '@/lib/redis'

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const cacheKey = `profile:obj:${userId}`
    if (redis) {
        try {
            const cached = await redis.get<UserProfile>(cacheKey)
            if (cached) return cached
        } catch (e) {
            console.warn('Redis profile get error:', e)
        }
    }
    const supabase = await createServerSupabaseClient()

    // Fetch profile data from public table
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

    // Calculate solved count
    const { count } = await supabase
        .from('coaching_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('completed_at', 'is', null)

    const { data: { user } } = await supabase.auth.getUser()

    if (!profile && (!user || user.id !== userId)) {
        return null
    }

    const isCurrentUser = user && user.id === userId

    const fullName = profile?.full_name || (isCurrentUser ? user.user_metadata?.full_name : 'Anonymous')
    const avatarUrl = profile?.avatar_url || (isCurrentUser ? user.user_metadata?.avatar_url : null)
    const email = isCurrentUser ? user.email! : ''

    // Calculate Rank
    // 1. Get leaderboard
    const leaderboard = await getLeaderboard()
    const currentUserEntry = leaderboard.find(u => u.id === userId)
    const rank = currentUserEntry ? currentUserEntry.rank : 0

    const result: UserProfile = {
        id: userId,
        fullName: fullName || 'User',
        email: email,
        avatarUrl: avatarUrl,
        coverUrl: profile?.cover_url || null,
        college: profile?.college,
        bio: profile?.bio,
        githubUrl: profile?.github_url,
        rank: rank,
        totalSolved: count || 0,
        joinedAt: profile?.created_at || (isCurrentUser ? user.created_at : new Date().toISOString()),
    }

    if (redis) {
        try {
            await redis.set(cacheKey, result, { ex: 30 })
        } catch (e) {
            console.warn('Redis profile set error:', e)
        }
    }

    return result
}

export async function getUserStats(userId: string): Promise<UserStats> {
    const cacheKey = `profile:stats:${userId}`
    if (redis) {
        try {
            const cached = await redis.get<UserStats>(cacheKey)
            if (cached) return cached
        } catch (e) {
            console.warn('Redis stats get error:', e)
        }
    }
    const supabase = await createServerSupabaseClient()

    // 1. Fetch all completed sessions for this user to get solved problem IDs
    const { data: sessions, error: sessionError } = await supabase
        .from('coaching_sessions')
        .select('problem_id, completed_at, problems(id, title, difficulty)')
        .eq('user_id', userId)
        .not('completed_at', 'is', null)

    if (sessionError) {
        console.error('Error fetching user stats:', sessionError)
        // Return empty stats on error
        return {
            easySolved: 0, mediumSolved: 0, hardSolved: 0,
            totalEasy: 0, totalMedium: 0, totalHard: 0,
            problemSetStats: [],
            recentSubmissions: []
        }
    }

    const solvedProblemIds = new Set(sessions?.map(s => s.problem_id))

    // 2. Calculate difficulty breakdown
    let easySolved = 0, mediumSolved = 0, hardSolved = 0
    sessions?.forEach((s: any) => {
        if (s.problems?.difficulty === 'Easy') easySolved++
        if (s.problems?.difficulty === 'Medium') mediumSolved++
        if (s.problems?.difficulty === 'Hard') hardSolved++
    })

    // 3. Get total counts (cached or query)
    const { count: totalEasy } = await supabase.from('problems').select('*', { count: 'exact', head: true }).eq('difficulty', 'Easy')
    const { count: totalMedium } = await supabase.from('problems').select('*', { count: 'exact', head: true }).eq('difficulty', 'Medium')
    const { count: totalHard } = await supabase.from('problems').select('*', { count: 'exact', head: true }).eq('difficulty', 'Hard')

    // 4. Problem Set Stats (Blind 75, Grind 75, NeetCode 150)
    // Fetch all problem sets and their problems
    const { data: allSets } = await supabase
        .from('problem_sets')
        .select('id, name, problem_count')

    const problemSetStats = []

    if (allSets) {
        for (const set of allSets) {
            // Get problems in this set
            const { data: setProblems } = await supabase
                .from('problem_set_problems')
                .select('problem_id')
                .eq('problem_set_id', set.id)

            const setProblemIds = setProblems?.map(sp => sp.problem_id) || []
            // Count how many of these are in solvedProblemIds
            const solvedCount = setProblemIds.reduce((acc, pid) => acc + (solvedProblemIds.has(pid) ? 1 : 0), 0)

            problemSetStats.push({
                setId: set.id,
                setName: set.name,
                total: set.problem_count,
                solved: solvedCount
            })
        }
    }

    // 5. Recent Submissions
    // Fetch sessions even if not completed (Attempted)
    const { data: recentSessions } = await supabase
        .from('coaching_sessions')
        .select('problem_id, start_at, completed_at, problems(title, difficulty)')
        .eq('user_id', userId)
        .order('start_at', { ascending: false })
        .limit(10)

    const recentSubmissions = recentSessions?.map((s: any) => ({
        problemId: s.problem_id,
        title: s.problems?.title,
        difficulty: s.problems?.difficulty as Difficulty,
        submittedAt: s.completed_at || s.start_at,
        status: s.completed_at ? 'Solved' : 'Attempted',
    })) || []

    const result = {
        easySolved,
        mediumSolved,
        hardSolved,
        totalEasy: totalEasy || 0,
        totalMedium: totalMedium || 0,
        totalHard: totalHard || 0,
        problemSetStats,
        recentSubmissions: recentSubmissions as any,
    }

    if (redis) {
        try {
            await redis.set(cacheKey, result, { ex: 30 })
        } catch (e) {
            console.warn('Redis stats set error:', e)
        }
    }

    return result
}

export async function getLeaderboard(): Promise<UserProfile[]> {
    const cacheKey = `profile:leaderboard`
    if (redis) {
        try {
            const cached = await redis.get<UserProfile[]>(cacheKey)
            if (cached) return cached
        } catch (e) {
            console.warn('Redis leaderboard get error:', e)
        }
    }
    const supabase = await createServerSupabaseClient()

    // Get all users with their completed session counts
    // Since we don't have a materialized view, we have to aggregate. 
    // This is expensive for large datasets but fine for MVP.
    // We'll fetch profiles and join with a subquery count.

    // Alternative: Fetch profiles, and separately fetch counts, merge in JS.
    const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .limit(50) // Top 50 for now

    if (!profiles) return []

    // Get counts for these users
    const userIds = profiles.map(p => p.id)

    // We need to count completed sessions per user
    const { data: sessions } = await supabase
        .from('coaching_sessions')
        .select('user_id')
        .in('user_id', userIds)
        .not('completed_at', 'is', null)

    const counts: Record<string, number> = {}
    sessions?.forEach((s: any) => {
        counts[s.user_id] = (counts[s.user_id] || 0) + 1
    })

    const leaderboard: UserProfile[] = profiles.map(p => ({
        id: p.id,
        fullName: p.full_name || 'Anonymous',
        email: '', // Don't leak emails
        avatarUrl: p.avatar_url,
        coverUrl: p.cover_url || null,
        college: p.college,
        bio: p.bio,
        githubUrl: p.github_url,
        rank: 0, // Will assign after sort
        totalSolved: counts[p.id] || 0,
        joinedAt: p.created_at,
    }))

    // Sort by solved count descending
    leaderboard.sort((a, b) => b.totalSolved - a.totalSolved)

    // Assign rank
    leaderboard.forEach((p, index) => {
        p.rank = index + 1
    })

    if (redis) {
        try {
            await redis.set(cacheKey, leaderboard, { ex: 60 }) // Cache leaderboard slightly longer
        } catch (e) {
            console.warn('Redis leaderboard set error:', e)
        }
    }

    return leaderboard
}

// Helper to get real rank for a specific user
export async function getUserRank(userId: string, totalSolved: number): Promise<number> {
    const supabase = await createServerSupabaseClient()

    // Count users with MORE solved problems
    // We need a way to count completions per user. 
    // Doing this accurately requires a complex query or view. 
    // For now, we'll approximate roughly or fetch all user completion counts (heavy).
    // Let's create a simplified approach: just count how many rows in a "user_stats" view if we had one.
    // Since we don't, we will stick to a simpler estimation or just 1 if they are the top.

    // Let's try to query distinct users who have > totalSolved completed sessions
    // This is hard without a group by count query which Supabase JS client doesn't support easily without .rpc()

    // Fallback: Just return a placeholder or 1 if high enough.
    // Or, we can use the getLeaderboard logic above if the user is in the top 50.
    const leaderboard = await getLeaderboard()
    const entry = leaderboard.find(p => p.id === userId)
    return entry ? entry.rank : leaderboard.length + 1
}

export async function updateProfile(userId: string, data: Partial<UserProfile>) {
    const supabase = await createServerSupabaseClient()

    const { error } = await supabase
        .from('profiles')
        .upsert({
            id: userId,
            full_name: data.fullName,
            college: data.college,
            bio: data.bio,
            github_url: data.githubUrl,
            avatar_url: data.avatarUrl,
            cover_url: data.coverUrl,
            updated_at: new Date().toISOString(),
        })

    if (error) throw error
    revalidatePath('/profile')
}
