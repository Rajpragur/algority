'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Circle, Clock, Code, MessageSquare, Terminal } from 'lucide-react'
import type { Problem, Pattern } from '@/lib/types'
import { cn } from "@/lib/utils"

interface ProblemCardProps {
  problem: Problem
  patterns: Pattern[]
  index?: number
  onSelect?: () => void
  onCodeSelect?: () => void
}

const difficultyColors = {
  Easy: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Medium: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  Hard: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
}

const statusConfig = {
  Solved: {
    icon: CheckCircle2,
    className: 'text-emerald-400',
  },
  Attempted: {
    icon: Clock,
    className: 'text-blue-400',
  },
  Untouched: {
    icon: Circle,
    className: 'text-neutral-600',
  },
}

export function ProblemCard({ problem, patterns, index = 0, onSelect, onCodeSelect }: ProblemCardProps) {
  const status = statusConfig[problem.completionStatus]
  const StatusIcon = status.icon

  const patternNames = problem.patterns
    .map((patternId) => patterns.find((p) => p.id === patternId)?.name)
    .filter(Boolean)
    .slice(0, 3)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onSelect}
      className={cn(
        "flex flex-col rounded-3xl bg-neutral-900/40 border border-neutral-800/80 p-6 relative group/feature transition-all duration-500 cursor-pointer h-full hover:bg-neutral-900/80 hover:border-emerald-500/30 overflow-hidden backdrop-blur-sm",
      )}
    >
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] rounded-full pointer-events-none group-hover/feature:bg-emerald-500/10 transition-colors duration-500" />

      {/* Header: Icon & Title */}
      <div className="mb-4 relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <StatusIcon className={cn("h-4 w-4", status.className)} />
            <span className={cn("text-[9px] font-syne font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded border", difficultyColors[problem.difficulty])}>
              {problem.difficulty}
            </span>
          </div>
          <Terminal className="w-4 h-4 text-neutral-600 group-hover/feature:text-emerald-500 transition-colors" />
        </div>

        <h3 className="text-lg font-syne font-bold text-white uppercase tracking-tight leading-tight group-hover/feature:text-emerald-400 transition-colors line-clamp-2">
          {problem.title}
        </h3>
      </div>

      {/* Description */}
      <div className="relative z-10 mb-6 flex-grow">
        <p className="premium-text text-xs text-neutral-400 line-clamp-3 leading-relaxed font-light">
          {problem.problem_description.replace(/<[^>]*>/g, '')}
        </p>
      </div>

      {/* Footer: Tags & Actions */}
      <div className="relative z-10 mt-auto pt-5 border-t border-neutral-800/50 flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {patternNames.map((name) => (
            <span
              key={name}
              className="text-[9px] font-syne font-bold text-neutral-500 uppercase tracking-widest bg-neutral-900 px-2 py-1 rounded border border-neutral-800"
            >
              {name}
            </span>
          ))}
          {problem.patterns.length > 3 && (
            <span className="text-[9px] font-syne font-bold text-neutral-500 uppercase tracking-widest bg-neutral-900 px-2 py-1 rounded border border-neutral-800">
              +{problem.patterns.length - 3}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onCodeSelect?.()
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 text-[10px] font-syne font-bold uppercase tracking-widest text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-all"
            title="Open Code Editor"
          >
            <Code className="w-3.5 h-3.5" />
            <span>Editor</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              onSelect?.()
            }}
            className="flex-[2] flex items-center justify-center gap-2 py-3 px-4 text-[10px] font-syne font-bold uppercase tracking-widest text-black bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-all shadow-[0_0_20px_rgba(52,211,153,0.1)] hover:shadow-[0_0_30px_rgba(52,211,153,0.3)]"
            title="Start Coaching Session"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Coach Setup</span>
          </button>
        </div>
      </div>
    </motion.div>
  )
}
