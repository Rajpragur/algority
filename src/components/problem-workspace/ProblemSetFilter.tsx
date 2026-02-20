'use client'

import { X } from 'lucide-react'
import { IconCpu, IconBolt, IconStack2 } from "@tabler/icons-react"
import type { ProblemSet } from '@/lib/types'
import { cn } from "@/lib/utils"

interface ProblemSetFilterProps {
  problemSets: ProblemSet[]
  selectedSet: string | null
  onSetChange?: (setId: string | null) => void
}

export function ProblemSetFilter({ problemSets, selectedSet, onSetChange }: ProblemSetFilterProps) {
  const handleSelect = (setId: string) => {
    // Toggle: if already selected, deselect; otherwise select
    onSetChange?.(selectedSet === setId ? null : setId)
  }

  const handleClear = () => {
    onSetChange?.(null)
  }

  // Helper to get icon by index or ID (matching LandingPage logic roughly)
  const getIcon = (index: number) => {
    if (index === 0) return IconCpu;      // Blind 75 - Core/Processor
    if (index === 1) return IconBolt;     // Grind 75 - Speed/Energy
    return IconStack2;                    // NeetCode 150 - Structure/Layers
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          Curated Lists
        </span>
        {selectedSet && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
          >
            <X className="h-3 w-3" />
            Clear selection
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {problemSets.map((set, index) => {
          const isSelected = selectedSet === set.id
          const Icon = getIcon(index)
          return (
            <button
              key={set.id}
              onClick={() => handleSelect(set.id)}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl border px-5 py-3 text-left transition-all duration-200 outline-none",
                isSelected
                  ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/10 ring-1 ring-emerald-600 dark:border-emerald-500 shadow-sm"
                  : "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
              )}
            >
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                isSelected
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                  : "bg-neutral-100 text-neutral-500 group-hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:group-hover:bg-neutral-600"
              )}>
                <Icon className="h-5 w-5" />
              </div>

              <div>
                <div className={cn(
                  "font-semibold text-sm transition-colors",
                  isSelected ? "text-emerald-900 dark:text-emerald-100" : "text-neutral-900 dark:text-neutral-100"
                )}>
                  {set.name}
                </div>
                <div className={cn(
                  "text-xs mt-0.5",
                  isSelected ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-500 dark:text-neutral-400"
                )}>
                  {set.problemCount} problems
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
