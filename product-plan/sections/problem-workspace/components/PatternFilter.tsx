import { X } from 'lucide-react'
import type { Pattern } from '../types'

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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Patterns:</span>

      {patterns.map((pattern) => {
        const isSelected = selectedPatterns.includes(pattern.id)
        return (
          <button
            key={pattern.id}
            onClick={() => handleToggle(pattern.id)}
            className={`
              rounded-full px-3 py-1 text-sm font-medium transition-all
              ${
                isSelected
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }
            `}
          >
            {pattern.name}
          </button>
        )
      })}

      {selectedPatterns.length > 0 && (
        <button
          onClick={handleClearAll}
          className="ml-1 flex items-center gap-1 rounded-full px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}
    </div>
  )
}
