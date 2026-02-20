'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Maximize2, Timer, Zap, ChevronRight, HelpCircle } from 'lucide-react'
import { ProblemModal } from './ProblemModal'
import type { ClientProblem, Pattern } from '@/lib/types'

interface SessionHeaderProps {
  problem: ClientProblem
  patterns: Pattern[]
  elapsedSeconds: number
}

export function SessionHeader({ problem, patterns, elapsedSeconds }: SessionHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="px-8 py-4 bg-neutral-950/40 backdrop-blur-xl border-b border-neutral-800">
      <div className="flex items-center justify-between gap-6">
        {/* Identity Section */}
        <div className="flex items-center gap-6 min-w-0">
          <div className="relative shrink-0">
            <div className="absolute -inset-1 bg-emerald-500/20 blur-md rounded-full" />
            <div className="relative w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shadow-2xl">
              <Zap className="w-5 h-5 text-emerald-400 fill-current" />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-sm font-syne font-bold text-white uppercase tracking-[0.2em] truncate">
                {problem.title}
              </h1>
              <span className="text-[9px] font-syne font-bold uppercase tracking-widest text-emerald-400/60 bg-emerald-400/5 px-2 py-0.5 rounded border border-emerald-400/10">
                {problem.difficulty}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <HelpCircle className="w-3 h-3 text-neutral-600" />
              <p className="text-[10px] font-syne font-bold uppercase tracking-[0.15em] text-neutral-500 truncate">
                Algorithmic Synthesis • Session Active
              </p>
            </div>
          </div>
        </div>

        {/* Global Telemetry */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-neutral-900/50 border border-neutral-800 rounded-lg">
            <Timer className="w-4 h-4 text-neutral-500" />
            <span className="font-mono text-sm font-light text-neutral-300 tracking-wider">
              {formatTime(elapsedSeconds)}
            </span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.5)] animate-pulse" />
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg hover:border-neutral-700 transition-all active:scale-95 group"
          >
            <Maximize2 className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>

      <ProblemModal
        problem={problem}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}
