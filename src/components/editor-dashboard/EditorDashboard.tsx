'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, FileCode, Clock, ChevronRight, Trash2 } from 'lucide-react'
import { getAllDrafts, clearDraft } from '@/lib/storage'
import type { Problem, Difficulty } from '@/lib/types'

interface RecentProblem {
  problemId: number
  lastAccessed: Date
  source: 'coaching' | 'draft'
}

interface EditorDashboardProps {
  problems: Problem[]
  // Problem IDs from coaching sessions with their last accessed time
  recentFromCoaching: Array<{ problemId: number; lastAccessed: string }>
}

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  Easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
  Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
  Hard: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
}

export function EditorDashboard({ problems, recentFromCoaching }: EditorDashboardProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [drafts, setDrafts] = useState<Array<{ problemId: number; timestamp: number }>>([])
  const [isClient, setIsClient] = useState(false)

  // Load drafts from localStorage on mount
  useEffect(() => {
    setIsClient(true)
    setDrafts(getAllDrafts())
  }, [])

  // Create a map of problems by ID for quick lookup
  const problemMap = useMemo(() => {
    return new Map(problems.map((p) => [p.id, p]))
  }, [problems])

  // Get problems with drafts
  const draftProblems = useMemo(() => {
    return drafts
      .map((d) => ({
        problem: problemMap.get(d.problemId),
        timestamp: d.timestamp,
      }))
      .filter((d): d is { problem: Problem; timestamp: number } => d.problem !== undefined)
      .slice(0, 6)
  }, [drafts, problemMap])

  // Get recent problems from coaching (excluding ones with drafts to avoid duplicates)
  const recentProblems = useMemo(() => {
    const draftProblemIds = new Set(drafts.map((d) => d.problemId))
    return recentFromCoaching
      .filter((r) => !draftProblemIds.has(r.problemId))
      .map((r) => ({
        problem: problemMap.get(r.problemId),
        lastAccessed: new Date(r.lastAccessed),
      }))
      .filter((r): r is { problem: Problem; lastAccessed: Date } => r.problem !== undefined)
      .slice(0, 6)
  }, [recentFromCoaching, drafts, problemMap])

  // Filter problems based on search query
  const filteredProblems = useMemo(() => {
    if (!searchQuery.trim()) return []
    const query = searchQuery.toLowerCase()
    return problems
      .filter((p) => p.title.toLowerCase().includes(query))
      .slice(0, 8)
  }, [problems, searchQuery])

  const handleProblemClick = (problemId: number) => {
    router.push(`/editor/${problemId}`)
  }

  const handleDeleteDraft = (e: React.MouseEvent, problemId: number) => {
    e.stopPropagation()
    clearDraft(problemId)
    setDrafts(getAllDrafts())
  }

  const formatTimeAgo = (date: Date | number) => {
    const timestamp = typeof date === 'number' ? date : date.getTime()
    const seconds = Math.floor((Date.now() - timestamp) / 1000)

    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return new Date(timestamp).toLocaleDateString()
  }

  const hasDrafts = draftProblems.length > 0
  const hasRecent = recentProblems.length > 0
  const showEmptyState = isClient && !hasDrafts && !hasRecent

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-6 border-dashed">
          <h1 className="text-3xl font-light tracking-widest uppercase text-slate-900 dark:text-white">
            Code Editor
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 font-light tracking-wide">
            Continue where you left off or start a new problem.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a problem..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-base shadow-sm transition-shadow placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
          />

          {/* Search Results Dropdown */}
          {searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
              {filteredProblems.length > 0 ? (
                <ul>
                  {filteredProblems.map((problem) => (
                    <li
                      key={problem.id}
                      onClick={() => handleProblemClick(problem.id)}
                      className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {problem.title}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${DIFFICULTY_COLORS[problem.difficulty]}`}
                        >
                          {problem.difficulty}
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                  No problems found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Empty State */}
        {showEmptyState && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <FileCode className="h-8 w-8 text-slate-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No recent activity
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Search for a problem above to start coding
            </p>
          </div>
        )}

        {/* Your Drafts */}
        {hasDrafts && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <FileCode className="h-5 w-5 text-emerald-500" />
              <h2 className="text-lg font-light tracking-widest uppercase text-slate-900 dark:text-white">
                Your Drafts
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {draftProblems.map(({ problem, timestamp }) => (
                <Link
                  key={problem.id}
                  href={`/editor/${problem.id}`}
                  prefetch={true}
                  className="group relative flex flex-col rounded-3xl border border-slate-200 bg-white p-6 text-left transition-all hover:border-emerald-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-700 cursor-pointer overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${DIFFICULTY_COLORS[problem.difficulty]}`}
                    >
                      {problem.difficulty}
                    </span>
                    <button
                      onClick={(e) => handleDeleteDraft(e, problem.id)}
                      className="p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete draft"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    {problem.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Last edited {formatTimeAgo(timestamp)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Recent Problems */}
        {hasRecent && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Clock className="h-5 w-5 text-slate-400" />
              <h2 className="text-lg font-light tracking-widest uppercase text-slate-900 dark:text-white">
                Recent Problems
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentProblems.map(({ problem, lastAccessed }) => (
                <Link
                  key={problem.id}
                  href={`/editor/${problem.id}`}
                  prefetch={true}
                  className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-6 text-left transition-all hover:border-emerald-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-700 overflow-hidden"
                >
                  <div className="mb-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${DIFFICULTY_COLORS[problem.difficulty]}`}
                    >
                      {problem.difficulty}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    {problem.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Practiced {formatTimeAgo(lastAccessed)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
