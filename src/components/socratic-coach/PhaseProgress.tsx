'use client'

import { motion } from 'framer-motion'
import { Check, Lock, Sparkles, Circle } from 'lucide-react'
import type { Phase } from '@/lib/types'

interface PhaseProgressProps {
  phases: Phase[]
  currentPhase: string
  onReviewPhase?: (phaseId: string) => void
}

export function PhaseProgress({ phases, currentPhase, onReviewPhase }: PhaseProgressProps) {
  return (
    <div className="px-8 py-3 bg-neutral-950/20 border-b border-neutral-800/50">
      <div className="flex items-center gap-1">
        {phases.map((phase, idx) => {
          const isActive = phase.status === 'active'
          const isCompleted = phase.status === 'completed'
          const isLocked = phase.status === 'locked'

          return (
            <div key={phase.id} className="flex-1 flex items-center group">
              <button
                onClick={() => isCompleted && onReviewPhase?.(phase.id)}
                disabled={isLocked}
                className="flex-1 flex items-center gap-3 p-2 rounded-lg transition-all relative overflow-hidden group/btn"
              >
                {/* Node */}
                <div className={`relative w-6 h-6 rounded-md border flex items-center justify-center transition-all duration-500 shrink-0 ${isActive
                    ? 'bg-emerald-500 border-emerald-500 text-black shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                    : isCompleted
                      ? 'bg-neutral-800 border-neutral-700 text-emerald-400'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-700'
                  }`}>
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : isActive ? (
                    <motion.div
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-1.5 h-1.5 rounded-full bg-black"
                    />
                  ) : (
                    <Lock className="w-3 h-3" />
                  )}

                  {isActive && (
                    <motion.div
                      layoutId="phaseGlow"
                      className="absolute inset-0 bg-emerald-400/20 blur-lg rounded-full"
                    />
                  )}
                </div>

                {/* Label */}
                <div className="hidden lg:block text-left min-w-0">
                  <p className={`text-[9px] font-syne font-bold uppercase tracking-[0.2em] transition-colors ${isActive ? 'text-white' : isCompleted ? 'text-neutral-400' : 'text-neutral-600'
                    }`}>
                    {phase.title}
                  </p>
                  <div className="mt-1 h-[2px] w-full bg-neutral-900 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${phase.confidenceProgress}%` }}
                      className={`h-full ${isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : isCompleted ? 'bg-emerald-500/40' : 'bg-transparent'}`}
                    />
                  </div>
                </div>

                {/* Hover effect for completed */}
                {isCompleted && (
                  <div className="absolute inset-0 bg-emerald-400/0 group-hover/btn:bg-emerald-400/[0.02] transition-colors" />
                )}
              </button>

              {/* Connector */}
              {idx < phases.length - 1 && (
                <div className="px-1 shrink-0">
                  <div className={`w-4 h-[1px] ${isCompleted ? 'bg-emerald-500/30' : 'bg-neutral-800'}`} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
