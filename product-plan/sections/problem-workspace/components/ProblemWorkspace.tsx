import { useState, useMemo } from 'react'
import type { ProblemWorkspaceProps } from '../types'
import { SearchBar } from './SearchBar'
import { PatternFilter } from './PatternFilter'
import { ProblemCard } from './ProblemCard'

export function ProblemWorkspace({
  problems,
  patterns,
  onSelectProblem,
  onSearch,
  onFilterByPattern,
}: ProblemWorkspaceProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([])

  // Filter problems based on search and selected patterns
  const filteredProblems = useMemo(() => {
    return problems.filter((problem) => {
      // Search filter
      const matchesSearch =
        searchQuery === '' ||
        problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        problem.description.toLowerCase().includes(searchQuery.toLowerCase())

      // Pattern filter
      const matchesPatterns =
        selectedPatterns.length === 0 ||
        selectedPatterns.some((patternId) => problem.patterns.includes(patternId))

      return matchesSearch && matchesPatterns
    })
  }, [problems, searchQuery, selectedPatterns])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    onSearch?.(query)
  }

  const handleFilterChange = (patternIds: string[]) => {
    setSelectedPatterns(patternIds)
    onFilterByPattern?.(patternIds)
  }

  // Stats
  const solvedCount = problems.filter((p) => p.completionStatus === 'Solved').length
  const attemptedCount = problems.filter((p) => p.completionStatus === 'Attempted').length

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Problem Workspace</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Select a problem to start practicing with AI coaching
          </p>
        </div>

        {/* Stats bar */}
        <div className="mb-6 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-white">{solvedCount}</span> Solved
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-white">{attemptedCount}</span> In Progress
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span className="text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-white">
                {problems.length - solvedCount - attemptedCount}
              </span>{' '}
              Remaining
            </span>
          </div>
        </div>

        {/* Search and filters */}
        <div className="mb-6 space-y-4">
          <SearchBar
            problems={problems}
            onSearch={handleSearch}
            onSelectProblem={onSelectProblem}
          />
          <PatternFilter
            patterns={patterns}
            selectedPatterns={selectedPatterns}
            onFilterChange={handleFilterChange}
          />
        </div>

        {/* Results count */}
        {(searchQuery || selectedPatterns.length > 0) && (
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
            Showing {filteredProblems.length} of {problems.length} problems
          </p>
        )}

        {/* Problem grid */}
        {filteredProblems.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProblems.map((problem) => (
              <ProblemCard
                key={problem.id}
                problem={problem}
                patterns={patterns}
                onSelect={() => onSelectProblem?.(problem.id)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white py-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-slate-600 dark:text-slate-400">No problems match your filters</p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedPatterns([])
              }}
              className="mt-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
