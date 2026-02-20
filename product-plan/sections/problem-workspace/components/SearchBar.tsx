import { useState, useRef, useEffect } from 'react'
import { Search } from 'lucide-react'
import type { Problem } from '../types'

interface SearchBarProps {
  problems: Problem[]
  onSearch?: (query: string) => void
  onSelectProblem?: (problemId: string) => void
}

export function SearchBar({ problems, onSearch, onSelectProblem }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filter problems for autocomplete
  const filteredProblems = query.length > 0
    ? problems.filter((p) =>
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : []

  const showDropdown = isOpen && filteredProblems.length > 0

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Reset highlighted index when filtered results change
  useEffect(() => {
    setHighlightedIndex(0)
  }, [filteredProblems.length])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setIsOpen(true)
    onSearch?.(value)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev + 1) % filteredProblems.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev - 1 + filteredProblems.length) % filteredProblems.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const selected = filteredProblems[highlightedIndex]
      if (selected) {
        onSelectProblem?.(selected.id)
        setQuery('')
        setIsOpen(false)
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const handleSelectProblem = (problemId: string) => {
    onSelectProblem?.(problemId)
    setQuery('')
    setIsOpen(false)
  }

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder="Search problems..."
          className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500"
        />
      </div>

      {/* Autocomplete dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800"
        >
          {filteredProblems.map((problem, index) => (
            <button
              key={problem.id}
              onClick={() => handleSelectProblem(problem.id)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`flex w-full flex-col px-4 py-2.5 text-left transition-colors ${
                index === highlightedIndex
                  ? 'bg-slate-100 dark:bg-slate-700'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                {problem.title}
              </span>
              <span className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                {problem.description}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
