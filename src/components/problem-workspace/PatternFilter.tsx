'use client'

import { X } from 'lucide-react'
import type { Pattern } from '@/lib/types'
import { cn } from "@/lib/utils"

interface PatternFilterProps {
  patterns: Pattern[]
  selectedPatterns: string[]
  onFilterChange?: (patternIds: string[]) => void
}

export function PatternFilter({ patterns, selectedPatterns, onFilterChange }: PatternFilterProps) {
  const handleToggle = (patternId: string) => {
    const newSelection = selectedPatterns.includes(patternId)
      ? selectedPatterns.filter((id) => id !== patternId)
      : [...selectedPatterns, patternId]
    onFilterChange?.(newSelection)
  }

  const handleClearAll = () => {
    onFilterChange?.([])
  }

  // Show top 12 most common patterns, sorted alphabetically
  const displayPatterns = patterns.slice(0, 12)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          Filter by Pattern
        </span>
        {selectedPatterns.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
          >
            <X className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {displayPatterns.map((pattern) => {
          const isSelected = selectedPatterns.includes(pattern.id)
          return (
            <button
              key={pattern.id}
              onClick={() => handleToggle(pattern.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-all border outline-none focus:ring-2 focus:ring-neutral-500/20",
                isSelected
                  ? "border-neutral-900 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 dark:border-white shadow-sm"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:text-neutral-200"
              )}
            >
              {pattern.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
