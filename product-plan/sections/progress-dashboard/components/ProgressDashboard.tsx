import type { ProgressDashboardProps } from '../types'
import { StatCard } from './StatCard'
import { PatternCard } from './PatternCard'
import { SessionRow } from './SessionRow'

export function ProgressDashboard({
  summaryStats,
  patternProgress,
  recentSessions
}: ProgressDashboardProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Progress Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Track your algorithmic pattern mastery and interview readiness
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Problems Solved"
            value={summaryStats.totalProblemsSolved}
            subtext={`of ${summaryStats.totalProblemsAttempted} attempted`}
            type="count"
          />
          <StatCard
            label="Overall Accuracy"
            value={summaryStats.overallAccuracy}
            subtext="success rate"
            type="percentage"
          />
          <StatCard
            label="Patterns Mastered"
            value={summaryStats.patternsMastered}
            subtext={`of ${summaryStats.patternsMastered + summaryStats.patternsInProgress + summaryStats.patternsNotStarted} patterns`}
            type="count"
          />
          <StatCard
            label="Current Streak"
            value={summaryStats.currentStreak}
            subtext="days"
            type="streak"
          />
        </div>

        {/* Pattern Mastery Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Pattern Mastery
            </h2>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-500 dark:text-slate-400">Mastered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-slate-500 dark:text-slate-400">In Progress</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span className="text-slate-500 dark:text-slate-400">Not Started</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {patternProgress.map((pattern) => (
              <PatternCard key={pattern.id} pattern={pattern} />
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Recent Activity
          </h2>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentSessions.map((session) => (
                <SessionRow key={session.id} session={session} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
