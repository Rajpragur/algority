'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Brain, Code, Sparkles, Loader2, Play, Terminal, Zap } from 'lucide-react'
import { ProblemModal } from './ProblemModal'
import type { ClientProblem } from '@/lib/types'

interface WelcomeStateProps {
  problem: ClientProblem
  onStartSession: () => Promise<void>
  isStarting: boolean
}

export function WelcomeState({ problem, onStartSession, isStarting }: WelcomeStateProps) {
  const [showProblemModal, setShowProblemModal] = useState(false)

  const steps = [
    { icon: BookOpen, label: 'Pattern Discovery', desc: 'Isolate the core algorithmic transformation.' },
    { icon: Brain, label: 'Logic Synthesis', desc: 'Construct a robust mental model of the solution.' },
    { icon: Code, label: 'Execution Verification', desc: 'Verify implementation details through socratic flow.' },
  ]

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/[0.03] blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-xl w-full text-center space-y-8 relative z-10"
      >
        {/* Visual Identity */}
        <div className="relative inline-block">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-tr from-emerald-500 to-blue-500 opacity-20 blur-2xl rounded-full"
          />
          <div className="relative w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shadow-2xl">
            <Zap className="w-7 h-7 text-emerald-400 fill-current" />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl font-syne font-bold text-white uppercase tracking-tight leading-none">
            Initialize Synthesis
          </h2>
          <p className="premium-text text-neutral-400 text-lg max-w-md mx-auto leading-relaxed">
            Ready to decode the patterns within <span className="text-white font-medium">{problem.title}</span>?
          </p>
        </div>

        {/* Neural Path Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="p-6 bg-neutral-900/40 border border-neutral-800/50 rounded-2xl text-left space-y-3 backdrop-blur-sm"
            >
              <step.icon className="w-5 h-5 text-emerald-400" />
              <h3 className="text-[10px] font-syne font-bold text-white uppercase tracking-widest leading-none">{step.label}</h3>
              <p className="premium-text text-xs text-neutral-500 leading-relaxed font-light">{step.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="pt-8 space-y-6">
          <button
            onClick={onStartSession}
            disabled={isStarting}
            className="group relative w-full md:w-auto px-12 py-5 bg-white text-black font-syne font-bold text-xs uppercase tracking-[0.3em] rounded transition-all hover:bg-emerald-400 hover:shadow-[0_0_30px_rgba(52,211,153,0.3)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
          >
            {isStarting ? (
              <div className="flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Calibrating...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span>Engage Session</span>
                <Play className="w-3.5 h-3.5 fill-current transition-transform group-hover:translate-x-1" />
              </div>
            )}
          </button>

          <div>
            <button
              onClick={() => setShowProblemModal(true)}
              className="text-[10px] font-syne font-bold text-neutral-600 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2 mx-auto"
            >
              <Terminal className="w-3 h-3" />
              Read Initial Logs
            </button>
          </div>
        </div>
      </motion.div>

      <ProblemModal
        problem={problem}
        isOpen={showProblemModal}
        onClose={() => setShowProblemModal(false)}
      />
    </div>
  )
}
