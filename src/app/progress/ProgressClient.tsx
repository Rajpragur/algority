'use client'

import { motion } from 'framer-motion'
import type { ProgressData } from './actions'
import {
    IconActivity,
    IconTrophy,
    IconFlame,
    IconTarget,
    IconTrendingUp,
    IconTrendingDown,
    IconInfoCircle,
    IconLoader,
    IconClockPlay
} from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface ProgressClientProps {
    data: ProgressData
}

export function ProgressClient({ data }: ProgressClientProps) {
    const { readinessScore, totalSolved, patternStats, recentActivity, pendingProblems } = data

    // Calculate Streak (simple consecutive days)
    const calculateStreak = () => {
        if (!recentActivity || recentActivity.length === 0) return 0

        // Sort activity by date desc
        const sorted = [...recentActivity].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        const today = new Date().toISOString().split('T')[0]
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

        // Check if active today or yesterday to keep streak alive
        const lastActive = sorted[0].date
        if (lastActive !== today && lastActive !== yesterday) return 0

        // Count backwards
        let streak = 1
        let currentDate = new Date(lastActive)

        // Use a set for fast lookup of active dates
        const activeDates = new Set(sorted.map(s => s.date))

        while (true) {
            currentDate.setDate(currentDate.getDate() - 1)
            const dateStr = currentDate.toISOString().split('T')[0]
            if (activeDates.has(dateStr)) {
                streak++
            } else {
                break
            }
        }
        return streak
    }

    const streak = calculateStreak()

    // Classify Patterns
    const strongPatterns = patternStats.filter(p => p.percentage >= 70 && p.total >= 3).slice(0, 3)
    const weakPatterns = patternStats.filter(p => p.percentage < 40 && p.total >= 3).slice(0, 3)
    // If no specific strong/weak, just take top/bottom of active ones
    const activePatterns = patternStats.filter(p => p.total > 0)
    const displayedStrong = strongPatterns.length > 0 ? strongPatterns : activePatterns.slice(0, 3)
    const displayedWeak = weakPatterns.length > 0 ? weakPatterns : activePatterns.reverse().slice(0, 3)

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-black font-outfit pb-20">
            {/* Header */}
            <div className="bg-white dark:bg-neutral-900/40 border-b border-neutral-200 dark:border-neutral-800/80 py-16 px-6 sm:px-8">
                <div className="mx-auto max-w-3xl text-center">
                    <h1 className="text-4xl md:text-5xl font-syne font-bold uppercase tracking-tight text-neutral-900 dark:text-white flex flex-col items-center gap-4">
                        <IconActivity className="h-12 w-12 text-emerald-500 stroke-[1.5]" />
                        Progress Dashboard
                    </h1>
                    <p className="premium-text mt-6 text-neutral-500 dark:text-neutral-400 font-light tracking-wide leading-relaxed text-lg">
                        Track your interview readiness, master key algorithms, and maintain your coding streak.
                    </p>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-0 pt-8 space-y-8">

                {/* Top Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Readiness Score */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-neutral-900/40 rounded-3xl p-8 shadow-sm border border-neutral-200 dark:border-neutral-800/80 flex flex-col items-center justify-center text-center space-y-4 hover:border-emerald-500/30 transition-all duration-300"
                    >
                        <div className="relative h-32 w-32 flex items-center justify-center">
                            {/* Circular Progress SVG */}
                            <svg className="h-full w-full transform -rotate-90 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-neutral-100 dark:text-neutral-800" />
                                <circle
                                    cx="64" cy="64" r="56"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="transparent"
                                    strokeDasharray={2 * Math.PI * 56}
                                    strokeDashoffset={2 * Math.PI * 56 * (1 - readinessScore / 100)}
                                    className="text-emerald-500 transition-all duration-1000 ease-out"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                <span className="text-3xl font-syne font-bold tracking-tight text-neutral-900 dark:text-white">{readinessScore}%</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-syne font-bold tracking-widest uppercase text-neutral-500 dark:text-neutral-400 mb-1">Interview Readiness</p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-light tracking-wide">
                                {readinessScore > 80 ? 'Ready for top-tier!' : readinessScore > 50 ? 'Getting there!' : 'Keep pushing!'}
                            </p>
                        </div>
                    </motion.div>

                    {/* Total Solved */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-neutral-900/40 rounded-3xl p-8 shadow-sm border border-neutral-200 dark:border-neutral-800/80 flex flex-col items-center justify-center text-center space-y-4 hover:border-blue-500/30 transition-all duration-300"
                    >
                        <div className="h-20 w-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-500 dark:text-blue-400 mb-2 border border-blue-100 dark:border-blue-800/50">
                            <IconTrophy className="h-8 w-8 stroke-[1.5]" />
                        </div>
                        <div>
                            <span className="block text-5xl font-syne font-bold tracking-tight text-neutral-900 dark:text-white mb-2">{totalSolved}</span>
                            <p className="text-[10px] font-syne font-bold tracking-widest uppercase text-neutral-500 dark:text-neutral-400">Total Solved</p>
                            <p className="text-xs text-neutral-400 mt-2 font-light">
                                Across all difficulties
                            </p>
                        </div>
                    </motion.div>

                    {/* Current Streak */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white dark:bg-neutral-900/40 rounded-3xl p-8 shadow-sm border border-neutral-200 dark:border-neutral-800/80 flex flex-col items-center justify-center text-center space-y-4 hover:border-orange-500/30 transition-all duration-300"
                    >
                        <div className={cn("h-20 w-20 rounded-full flex items-center justify-center transition-colors mb-2 border", streak > 0 ? "bg-orange-50 dark:bg-orange-900/20 text-orange-500 border-orange-100 dark:border-orange-800/50" : "bg-neutral-50 dark:bg-neutral-800 text-neutral-400 border-neutral-100 dark:border-neutral-700")}>
                            <IconFlame className="h-8 w-8 stroke-[1.5]" />
                        </div>
                        <div>
                            <div className="flex items-baseline justify-center gap-2 mb-2">
                                <span className={cn("text-5xl font-syne font-bold tracking-tight", streak > 0 ? "text-orange-500" : "text-neutral-900 dark:text-white")}>{streak}</span>
                                <span className="text-[10px] font-syne font-bold text-neutral-400 uppercase tracking-widest">days</span>
                            </div>
                            <p className="text-[10px] font-syne font-bold tracking-widest uppercase text-neutral-500 dark:text-neutral-400">Current Streak</p>
                            <p className="text-xs text-neutral-400 mt-2 font-light">
                                {streak > 0 ? "You're on fire! 🔥" : "Start a streak today!"}
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Pattern Mastery */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Strongest & Weakest Insights */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Strongest */}
                            <div className="bg-emerald-50/30 dark:bg-emerald-900/5 rounded-2xl p-6 border border-emerald-100 dark:border-emerald-900/20 text-center">
                                <h3 className="text-sm font-light tracking-widest uppercase text-emerald-800 dark:text-emerald-300 flex items-center justify-center gap-2 mb-4">
                                    <IconTrendingUp className="h-4 w-4" /> Strongest Areas
                                </h3>
                                <div className="space-y-2">
                                    {displayedStrong.length > 0 ? displayedStrong.map(p => (
                                        <div key={p.id} className="flex justify-between text-sm font-light tracking-wide">
                                            <span className="text-slate-700 dark:text-slate-300">{p.name}</span>
                                            <span className="font-normal text-emerald-600 dark:text-emerald-400">{p.percentage}%</span>
                                        </div>
                                    )) : (
                                        <p className="text-xs text-slate-500 italic font-light">Not enough data yet</p>
                                    )}
                                </div>
                            </div>

                            {/* Weakest */}
                            <div className="bg-rose-50/30 dark:bg-rose-900/5 rounded-2xl p-6 border border-rose-100 dark:border-rose-900/20 text-center">
                                <h3 className="text-sm font-light tracking-widest uppercase text-rose-800 dark:text-rose-300 flex items-center justify-center gap-2 mb-4">
                                    <IconTrendingDown className="h-4 w-4" /> Areas to Improve
                                </h3>
                                <div className="space-y-2">
                                    {displayedWeak.length > 0 ? displayedWeak.map(p => (
                                        <div key={p.id} className="flex justify-between text-sm font-light tracking-wide">
                                            <span className="text-slate-700 dark:text-slate-300">{p.name}</span>
                                            <span className="font-normal text-rose-600 dark:text-rose-400">{p.percentage}%</span>
                                        </div>
                                    )) : (
                                        <p className="text-xs text-slate-500 italic font-light">No weak spots found yet!</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Full Pattern List */}
                        <div className="bg-white dark:bg-neutral-900/40 rounded-3xl shadow-sm border border-neutral-200 dark:border-neutral-800/80 overflow-hidden backdrop-blur-sm">
                            <div className="p-8 border-b border-neutral-100 dark:border-neutral-800/50 text-center">
                                <h3 className="text-xl font-syne font-bold tracking-tight uppercase text-neutral-900 dark:text-white">Pattern Proficiency</h3>
                                <span className="text-[10px] font-syne font-bold uppercase tracking-widest text-neutral-400 mt-2 block">Sorted by mastery</span>
                            </div>
                            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                                {patternStats.filter(p => p.total > 0).map(p => (
                                    <div key={p.id} className="group">
                                        <div className="flex justify-between text-sm mb-1.5 font-light tracking-wide">
                                            <span className="text-slate-700 dark:text-slate-200">{p.name}</span>
                                            <span className="text-xs text-slate-400">{p.solved}/{p.total}</span>
                                        </div>
                                        <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-500 relative overflow-hidden",
                                                    p.percentage >= 70 ? "bg-emerald-500" :
                                                        p.percentage >= 40 ? "bg-blue-400" :
                                                            "bg-neutral-300 dark:bg-neutral-600"
                                                )}
                                                style={{ width: `${p.percentage}%` }}
                                            >
                                                {/* Shine effect */}
                                                <div className="absolute inset-0 bg-white/20"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {patternStats.filter(p => p.total > 0).length === 0 && (
                                    <div className="col-span-full py-8 text-center text-slate-500">
                                        No patterns tracked yet. Solve some problems to see stats!
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Activity & Pending */}
                    <div className="space-y-8">

                        {/* Pending Problems */}
                        {pendingProblems && pendingProblems.length > 0 && (
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                                <h3 className="text-lg font-light tracking-widest uppercase text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                                    <IconClockPlay className="h-5 w-5 text-indigo-500" /> Pending Problems
                                </h3>
                                <div className="space-y-3">
                                    {pendingProblems.slice(0, 5).map(problem => (
                                        <Link
                                            key={problem.id}
                                            href={`/editor/${problem.id}`}
                                            prefetch={true}
                                            className="group block p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className={cn(
                                                    "text-xs font-medium px-2 py-0.5 rounded-full",
                                                    problem.difficulty === 'Easy' ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" :
                                                        problem.difficulty === 'Medium' ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" :
                                                            "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400"
                                                )}>
                                                    {problem.difficulty}
                                                </span>
                                            </div>
                                            <h4 className="text-slate-900 dark:text-white font-medium group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">{problem.title}</h4>
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">Last accessed: {new Date(problem.lastAccessed).toLocaleDateString()}</p>
                                        </Link>
                                    ))}
                                </div>
                                {pendingProblems.length > 5 && (
                                    <div className="mt-4 text-center">
                                        <span className="text-xs text-slate-500 font-light tracking-wide uppercase">+{pendingProblems.length - 5} more pending</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Contribution Graph (Last 60 Days) */}
                        <div className="bg-white dark:bg-neutral-900/40 rounded-3xl p-8 shadow-sm border border-neutral-200 dark:border-neutral-800/80 text-center backdrop-blur-sm">
                            <h3 className="text-sm font-syne font-bold tracking-widest uppercase text-neutral-900 dark:text-white mb-6">Activity</h3>
                            <div className="flex flex-wrap gap-1.5 justify-center">
                                {Array.from({ length: 60 }).map((_, i) => {
                                    const d = new Date()
                                    d.setDate(d.getDate() - (59 - i)) // Go back 59 days, then forward
                                    const dateString = d.toISOString().split('T')[0]
                                    const activity = recentActivity.find(a => a.date === dateString)
                                    const count = activity ? activity.count : 0

                                    return (
                                        <div
                                            key={dateString}
                                            title={`${dateString}: ${count} solved`}
                                            className={cn(
                                                "h-3 w-3 rounded-sm transition-colors",
                                                count >= 3 ? "bg-emerald-600 dark:bg-emerald-500" :
                                                    count === 2 ? "bg-emerald-400 dark:bg-emerald-600" :
                                                        count === 1 ? "bg-emerald-200 dark:bg-emerald-800" :
                                                            "bg-slate-100 dark:bg-slate-800"
                                            )}
                                        />
                                    )
                                })}
                            </div>
                            <div className="mt-6 flex items-center justify-between text-xs font-light tracking-widest text-slate-400 uppercase">
                                <span>60 days ago</span>
                                <span>Today</span>
                            </div>
                        </div>

                        {/* Coach Tips */}
                        <div className="bg-indigo-50/30 dark:bg-indigo-900/10 rounded-3xl p-8 border border-indigo-100 dark:border-indigo-900/20 text-center">
                            <h3 className="text-sm font-light tracking-widest uppercase text-indigo-900 dark:text-indigo-300 mb-4 flex items-center justify-center gap-2">
                                <IconInfoCircle className="h-5 w-5 stroke-[1.5]" /> Coach's Tip
                            </h3>
                            <p className="text-base font-light text-indigo-800/80 dark:text-indigo-200/80 leading-loose tracking-wide">
                                {readinessScore < 30 ?
                                    "Focus on completing the 'Blind 75' list first. It covers all the essential patterns you need for 90% of interviews." :
                                    readinessScore < 70 ?
                                        "You're making great progress! Try revisiting your weak areas. Spaced repetition is key to long-term retention." :
                                        "You're doing excellent! Challenge yourself with Hard problems in your strong areas to truly master them."
                                }
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
