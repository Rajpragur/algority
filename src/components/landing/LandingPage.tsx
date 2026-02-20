'use client'

import { useState, useEffect, useRef, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Loader2 } from 'lucide-react'
import { AnimatePresence, motion } from "framer-motion"
import {
  IconTerminal2,
  IconEaseInOut,
  IconRouteAltLeft,
} from "@tabler/icons-react"
import { useAuth } from '@/components/auth'
import { checkIncompleteSession, createFreshSession, searchProblems } from '@/app/actions'
import { toast } from '@/components/ui/toaster'
import { cn } from "@/lib/utils"
import type { Problem, Pattern, Difficulty, ProblemSet } from '@/lib/types'

interface LandingPageProps {
  problems: Problem[]
  patterns: Pattern[]
  problemSets: ProblemSet[]
}

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  Easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
  Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
  Hard: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
}

export function LandingPage({ problems, patterns, problemSets }: LandingPageProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isPending, startTransition] = useTransition()
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Problem[]>([])
  const [pendingProblem, setPendingProblem] = useState<Problem | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { user, openAuthModal } = useAuth()

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 200)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Server-side search when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    searchProblems({ query: debouncedQuery, limit: 6 })
      .then((result) => {
        setSearchResults(result.problems)
      })
      .catch((error) => {
        console.error('Search error:', error)
        setSearchResults([])
      })
      .finally(() => {
        setIsSearching(false)
      })
  }, [debouncedQuery])

  // Use search results for dropdown
  const filteredProblems = searchResults

  // Get pattern names for a problem
  const getPatternNames = useCallback(
    (patternIds: string[]) => {
      return patternIds
        .map((id) => patterns.find((p) => p.id === id)?.name)
        .filter(Boolean)
        .slice(0, 2)
    },
    [patterns]
  )

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownOpen || filteredProblems.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev < filteredProblems.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < filteredProblems.length) {
          handleProblemSelect(filteredProblems[selectedIndex])
        }
        break
      case 'Escape':
        setIsDropdownOpen(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleProblemSelect = async (problem: Problem) => {
    setIsDropdownOpen(false)
    setSearchQuery('')

    // If not authenticated, prompt to sign in
    if (!user) {
      openAuthModal('login')
      toast.info('Please sign in to start a coaching session')
      return
    }

    setPendingProblem(problem)

    startTransition(async () => {
      try {
        // Check for existing incomplete session
        const checkResult = await checkIncompleteSession(problem.id)

        if (checkResult.hasIncomplete && checkResult.sessionId) {
          // Resume existing session
          router.push(`/coach/${checkResult.sessionId}`)
          return
        }

        // Create new session (this will redirect on success)
        const result = await createFreshSession(problem.id)

        // If we get here, something went wrong (redirect didn't happen)
        if (result && 'error' in result) {
          if (result.error === 'auth_required') {
            openAuthModal('login')
            toast.error('Please sign in to start a coaching session')
          } else {
            toast.error(result.error)
          }
        }
      } catch (error) {
        // Rethrow redirect errors - they're not actual failures
        // Next.js redirect() throws an error with digest starting with 'NEXT_REDIRECT'
        if (error instanceof Error && 'digest' in error && String(error.digest).startsWith('NEXT_REDIRECT')) {
          throw error
        }
        console.error('Error starting session:', error)
        toast.error('Failed to start coaching session')
      } finally {
        setPendingProblem(null)
      }
    })
  }

  // Highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="font-semibold text-emerald-600 dark:text-emerald-400">
          {part}
        </span>
      ) : (
        part
      )
    )
  }

  return (
    <div className="min-h-full">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-4 pt-16 pb-12 md:pt-24 md:pb-16">
        {/* Headline */}
        <h1 className="text-4xl font-syne font-bold uppercase tracking-tight text-neutral-900 dark:text-white sm:text-6xl md:text-7xl text-center max-w-5xl leading-tight drop-shadow-sm px-2">
          <span className="text-black dark:text-white">Stop Memorizing</span>
          <br className="hidden sm:block" />
          <span className="text-emerald-500"> Start Understanding<span className="text-black dark:text-emerald-400">.</span></span>
        </h1>

        {/* Subheadline */}
        <p className="premium-text mt-8 text-neutral-500 dark:text-neutral-400 text-center max-w-2xl text-lg md:text-xl font-light leading-relaxed">
          <strong className="font-syne tracking-widest uppercase text-neutral-900 dark:text-white mr-2">Algority</strong>
          is an AI coach that guides you to discover solutions yourself—so patterns stick for the real interview.
        </p>

        {/* Search Bar with CTA */}
        <div ref={searchRef} className="relative mt-10 w-full max-w-2xl">
          <p className="mb-3 text-center text-sm font-medium text-slate-600 dark:text-slate-400">
            Search for a problem to start your coaching session
          </p>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setIsDropdownOpen(true)
                setSelectedIndex(-1)
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="Try 'Two Sum' or 'sliding window'..."
              className="w-full rounded-full border-2 border-emerald-200 bg-white py-4 pl-12 pr-4 text-lg shadow-lg transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 dark:border-emerald-800 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500"
            />
          </div>

          {/* Autocomplete Dropdown */}
          <div className="absolute top-full left-0 right-0 z-50 mt-2">
            <AnimatePresence mode="wait">
              {isDropdownOpen && searchQuery.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
                >
                  {isSearching ? (
                    <motion.div
                      key="loader"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-2 px-4 py-8 text-slate-500 dark:text-slate-400"
                    >
                      <Loader2 className="h-5 w-5 animate-spin text-emerald-600 dark:text-emerald-500" />
                      <span className="text-sm font-medium">Searching problems...</span>
                    </motion.div>
                  ) : filteredProblems.length > 0 ? (
                    <motion.ul
                      key="results"
                      role="listbox"
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      variants={{
                        hidden: { opacity: 0 },
                        visible: {
                          opacity: 1,
                          transition: {
                            staggerChildren: 0.05
                          }
                        }
                      }}
                    >
                      {filteredProblems.map((problem, index) => (
                        <motion.li
                          key={problem.id}
                          role="option"
                          aria-selected={index === selectedIndex}
                          variants={{
                            hidden: { opacity: 0, x: -20 },
                            visible: { opacity: 1, x: 0 }
                          }}
                          onClick={() => !isPending && handleProblemSelect(problem)}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={`flex cursor-pointer items-center justify-between px-4 py-3.5 transition-colors ${index === selectedIndex
                            ? 'bg-slate-50 dark:bg-slate-800'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-900 dark:text-white">
                              {highlightMatch(problem.title, searchQuery)}
                            </div>
                            <div className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                              {getPatternNames(problem.patterns).join(', ') || 'General'}
                            </div>
                          </div>
                          <span
                            className={`ml-3 rounded-full px-2.5 py-0.5 text-xs font-medium ${DIFFICULTY_COLORS[problem.difficulty]}`}
                          >
                            {problem.difficulty}
                          </span>
                        </motion.li>
                      ))}
                    </motion.ul>
                  ) : (
                    <motion.div
                      key="no-results"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="px-4 py-8 text-center text-slate-500 dark:text-slate-400"
                    >
                      No problems found.
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Auth prompt for non-authenticated users */}
        {!user && (
          <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
            <button
              onClick={() => openAuthModal('login')}
              className="font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              Sign in
            </button>
            {' '}to save your progress
          </p>
        )}
      </section>

      {/* Problem Sets Section */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-3 text-center text-2xl font-bold text-slate-900 dark:text-white">
            Curated Problem Sets
          </h2>
          <p className="mb-12 text-center text-slate-600 dark:text-slate-400">
            Follow these proven study lists used by thousands of engineers to land jobs at top companies
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 relative z-10 py-10 max-w-7xl mx-auto">
            {problemSets.map((set, index) => {
              // Select an icon based on the set ID or index
              const Icon = index === 0 ? IconTerminal2 : index === 1 ? IconEaseInOut : IconRouteAltLeft;

              return (
                <Link
                  key={set.id}
                  href={`/problems?set=${set.id}`}
                  className={cn(
                    "flex flex-col py-10 relative group/feature dark:border-neutral-800 border-neutral-200",
                    "border-b lg:border-r",
                    index === 0 && "lg:border-l",
                    index % 2 === 0 && "md:border-l lg:border-l-0"
                  )}
                >
                  <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-slate-50 dark:bg-slate-800/50 pointer-events-none" />

                  <div className="mb-4 relative z-10 px-10 text-neutral-600 dark:text-neutral-400">
                    <Icon className="h-8 w-8" />
                  </div>

                  <div className="text-lg font-bold mb-2 relative z-10 px-10">
                    <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-neutral-300 dark:bg-neutral-700 group-hover/feature:bg-blue-500 transition-all duration-200 origin-center" />
                    <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-neutral-800 dark:text-neutral-100">
                      {set.name}
                    </span>
                  </div>

                  <div className="relative z-10 px-10">
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 max-w-xs mb-4">
                      {set.description}
                    </p>
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {set.problemCount} problems
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="px-4 py-12 border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-syne font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
              Algority<span className="text-emerald-500">.</span>
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-500 font-light">
              © 2026 Algority. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-8">
            <Link
              href="/privacy"
              className="text-xs font-syne font-bold uppercase tracking-widest text-neutral-600 hover:text-emerald-600 dark:text-neutral-400 dark:hover:text-emerald-400 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-xs font-syne font-bold uppercase tracking-widest text-neutral-600 hover:text-emerald-600 dark:text-neutral-400 dark:hover:text-emerald-400 transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/dev"
              className="text-xs font-syne font-bold uppercase tracking-widest text-neutral-600 hover:text-emerald-600 dark:text-neutral-400 dark:hover:text-emerald-400 transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>
      </footer>

      {/* Session Loading Modal */}
      {isPending && pendingProblem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl dark:bg-slate-800">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-emerald-100 p-4 dark:bg-emerald-900/50">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
                Setting up your session
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Preparing <span className="font-medium text-emerald-600 dark:text-emerald-400">{pendingProblem.title}</span> for coaching...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
