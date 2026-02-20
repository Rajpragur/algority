'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import type { Problem, Pattern, ProblemSet } from '@/lib/types'
import { searchProblems, checkIncompleteSession, createFreshSession } from '@/app/actions'
import { useAuth } from '@/components/auth'
import { SearchBar } from './SearchBar'
import { PatternFilter } from './PatternFilter'
import { ProblemSetFilter } from './ProblemSetFilter'
import { ProblemCard } from './ProblemCard'
import { Pagination } from './Pagination'
import AnimatedLoadingSkeleton from './AnimatedLoadingSkeleton'

interface ProblemWorkspaceProps {
  problems: Problem[]
  patterns: Pattern[]
  problemSets: ProblemSet[]
  initialProblemSet?: string | null
}

const ITEMS_PER_PAGE = 24

export function ProblemWorkspace({ problems: initialProblems, patterns, problemSets, initialProblemSet = null }: ProblemWorkspaceProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { openAuthModal } = useAuth()

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([])
  const [selectedProblemSet, setSelectedProblemSet] = useState<string | null>(initialProblemSet)

  // Modal state for existing session prompt
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [showLoadingModal, setShowLoadingModal] = useState(false)
  const [pendingProblem, setPendingProblem] = useState<{ id: number; title: string; existingSessionId: string } | null>(null)
  const [isCreatingSession, setIsCreatingSession] = useState(false)

  // Modal state for code editor loading
  const [showCodeLoadingModal, setShowCodeLoadingModal] = useState(false)
  const [pendingCodeProblem, setPendingCodeProblem] = useState<{ id: number; title: string } | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(initialProblems.length)

  // Display state
  const [displayedProblems, setDisplayedProblems] = useState<Problem[]>(initialProblems)
  const [isSearchActive, setIsSearchActive] = useState(false)

  // Debounce search
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Perform server search when debounced query, filters, or page changes
  // This allows pagination to work for the "All Problems" view as well
  useEffect(() => {
    startTransition(async () => {
      // If we are on the first page and no filters are active, and we have initialProblems, 
      // we could potentially use them, but we need the total count to be correct.
      // Search action returns the correct total count for all problems.

      const result = await searchProblems({
        query: debouncedQuery,
        patternIds: selectedPatterns,
        problemSetId: selectedProblemSet,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      })

      setDisplayedProblems(result.problems)
      setTotalResults(result.total)
      setTotalPages(result.totalPages)
    })
  }, [debouncedQuery, selectedPatterns, selectedProblemSet, currentPage])

  const handleSelectProblem = async (problem: Problem) => {
    // Check for existing incomplete session
    const result = await checkIncompleteSession(problem.id)

    if (result.hasIncomplete && result.sessionId) {
      // Show modal to choose Resume or Start Fresh
      setPendingProblem({ id: problem.id, title: problem.title, existingSessionId: result.sessionId })
      setShowSessionModal(true)
    } else {
      // No existing session - show loading modal and create new
      setPendingProblem({ id: problem.id, title: problem.title, existingSessionId: '' })
      setShowLoadingModal(true)
      setIsCreatingSession(true)
      const sessionResult = await createFreshSession(problem.id)
      // Check if auth required
      if (sessionResult && 'error' in sessionResult && sessionResult.error === 'auth_required') {
        setIsCreatingSession(false)
        setShowLoadingModal(false)
        setPendingProblem(null)
        openAuthModal('login')
        return
      }
      // Note: redirect() in server action means we won't reach here on success
      setIsCreatingSession(false)
      setShowLoadingModal(false)
    }
  }

  const handleResumeSession = () => {
    if (pendingProblem) {
      router.push(`/coach/${pendingProblem.existingSessionId}`)
    }
    setShowSessionModal(false)
    setPendingProblem(null)
  }

  const handleStartFresh = async () => {
    if (!pendingProblem) return

    // Transition from choice modal to loading modal
    setShowSessionModal(false)
    setShowLoadingModal(true)
    setIsCreatingSession(true)
    const sessionResult = await createFreshSession(pendingProblem.id)
    // Check if auth required
    if (sessionResult && 'error' in sessionResult && sessionResult.error === 'auth_required') {
      setIsCreatingSession(false)
      setShowLoadingModal(false)
      setPendingProblem(null)
      openAuthModal('login')
      return
    }
    // Note: redirect() in server action means we won't reach here on success
    setIsCreatingSession(false)
    setShowLoadingModal(false)
    setPendingProblem(null)
  }

  const handleCloseModal = () => {
    setShowSessionModal(false)
    setPendingProblem(null)
  }

  const handleCodeSelect = (problem: Problem) => {
    setPendingCodeProblem({ id: problem.id, title: problem.title })
    setShowCodeLoadingModal(true)
    router.push(`/editor/${problem.id}`)
  }

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    setCurrentPage(1) // Reset to first page on new search
  }, [])

  const handleFilterChange = useCallback((patternIds: string[]) => {
    setSelectedPatterns(patternIds)
    setCurrentPage(1) // Reset to first page on filter change
  }, [])

  const handleProblemSetChange = useCallback((setId: string | null) => {
    setSelectedProblemSet(setId)
    setCurrentPage(1) // Reset to first page on filter change
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    // Scroll to top of problem grid
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedPatterns([])
    setSelectedProblemSet(null)
    setCurrentPage(1)
  }

  const solvedCount = initialProblems.filter((p) => p.completionStatus === 'Solved').length
  const attemptedCount = initialProblems.filter((p) => p.completionStatus === 'Attempted').length

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10 text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-syne font-bold text-neutral-900 dark:text-white uppercase tracking-tight">Algorithmic Base</h1>
        <p className="premium-text text-base text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto font-light leading-relaxed">
          Select a problem to start practicing with AI coaching. Master algorithms one step at a time.
        </p>
      </div>

      {/* Stats bar */}
      <div className="mb-10 flex flex-wrap justify-center gap-4 text-[10px] font-syne font-bold uppercase tracking-[0.2em]">
        <div className="flex items-center gap-2 px-4 py-2 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
          <span>
            {solvedCount} Solved
          </span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded border bg-blue-500/10 text-blue-400 border-blue-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          <span>
            {attemptedCount} In Progress
          </span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded border bg-neutral-900 text-neutral-500 border-neutral-800">
          <span className="h-1.5 w-1.5 rounded-full bg-neutral-500" />
          <span>
            {initialProblems.length - solvedCount - attemptedCount} Remaining
          </span>
        </div>
      </div>

      {/* Search and filters */}
      <div className="mb-8 space-y-5">
        <SearchBar
          problems={initialProblems}
          onSearch={handleSearch}
          onSelectProblem={handleSelectProblem}
        />
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <ProblemSetFilter
              problemSets={problemSets}
              selectedSet={selectedProblemSet}
              onSetChange={handleProblemSetChange}
            />
          </div>
          <div className="flex-1">
            <PatternFilter
              patterns={patterns}
              selectedPatterns={selectedPatterns}
              onFilterChange={handleFilterChange}
            />
          </div>
        </div>
      </div>

      {/* Results count */}
      {isSearchActive && (
        <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-500">
          {isPending ? (
            'Searching...'
          ) : (
            <>
              Found <span className="font-semibold text-neutral-900 dark:text-white">{totalResults.toLocaleString()}</span> problems
              {debouncedQuery && ` matching "${debouncedQuery}"`}
            </>
          )}
        </p>
      )}

      {/* Session Confirmation Modal (unchanged logic, just ensuring it fits) */}
      {showSessionModal && pendingProblem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 transform transition-all scale-100">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
              Resume Session?
            </h2>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              You have an in-progress session for <span className="font-medium text-neutral-900 dark:text-white">{pendingProblem.title}</span>.
            </p>
            <div className="mt-8 flex gap-3">
              <button
                onClick={handleResumeSession}
                disabled={isCreatingSession}
                className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
              >
                Resume Session
              </button>
              <button
                onClick={handleStartFresh}
                disabled={isCreatingSession}
                className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 transition-all hover:scale-[1.02]"
              >
                {isCreatingSession ? 'Creating...' : 'Start Fresh'}
              </button>
            </div>
            <button
              onClick={handleCloseModal}
              disabled={isCreatingSession}
              className="mt-6 w-full text-center text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Loading Modal - Setting up coaching session */}
      {showLoadingModal && pendingProblem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 h-12 w-12 animate-spin rounded-full border-[3px] border-emerald-500/30 border-t-emerald-500" />
              <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                Preparing your session
              </h2>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                Loading context for <span className="font-medium text-emerald-600 dark:text-emerald-400">{pendingProblem.title}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading Modal - Setting up code editor */}
      {showCodeLoadingModal && pendingCodeProblem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 h-12 w-12 animate-spin rounded-full border-[3px] border-neutral-500/30 border-t-neutral-500" />
              <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                Opening Editor
              </h2>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                Setting up environment for <span className="font-medium text-neutral-900 dark:text-white">{pendingCodeProblem.title}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Problem grid */}
      <motion.div
        animate={{ opacity: isPending ? 0.5 : 1 }}
        transition={{ duration: 0.2 }}
        className="relative min-h-[200px]"
      >
        {displayedProblems.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 relative z-10 py-4 max-w-7xl mx-auto gap-6 sm:gap-6">
              {displayedProblems.map((problem, index) => (
                <ProblemCard
                  key={problem.id}
                  problem={problem}
                  patterns={patterns}
                  index={index}
                  onSelect={() => handleSelectProblem(problem)}
                  onCodeSelect={() => handleCodeSelect(problem)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalResults={totalResults}
                  onPageChange={handlePageChange}
                  isLoading={isPending}
                />
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white py-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-slate-600 dark:text-slate-400">
              {isPending ? 'Searching...' : 'No problems match your filters'}
            </p>
            {!isPending && (
              <button
                onClick={handleClearFilters}
                className="mt-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Loading Wave Overlay */}
        {isPending && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{
              repeat: Infinity,
              duration: 1.0,
              ease: "linear"
            }}
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(148, 163, 184, 0.1) 50%, transparent 100%)'
            }}
          />
        )}
      </motion.div>
    </div>
  )
}
