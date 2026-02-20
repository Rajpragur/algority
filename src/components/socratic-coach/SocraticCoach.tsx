'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, X, ArrowRight, Play, ChevronRight,
  Lock, Eye, Terminal, Sparkles, AlertCircle,
  HelpCircle, BookOpen, BrainCircuit, Timer,
  Trophy, MessageSquare, FastForward, Loader2
} from 'lucide-react'
import type { ClientProblem, Pattern, Phase, Message, QuestionMessage, CoachingSession, ProbeQuestionMessage, FeedbackMessage } from '@/lib/types'
import { getProblemSolution } from '@/app/actions'
import { SessionHeader } from './SessionHeader'
import { PhaseProgress } from './PhaseProgress'
import { QuestionCard } from './QuestionCard'
import { FeedbackCard } from './FeedbackCard'
import { ChatInput } from './ChatInput'
import { WelcomeState } from './WelcomeState'
import { ProbeQuestionCard } from './ProbeQuestionCard'
import { CelebrationOverlay } from './CelebrationOverlay'
import { ProblemDescription } from '@/components/shared'

interface SocraticCoachProps {
  problem: ClientProblem
  patterns: Pattern[]
  session: CoachingSession
  phases: Phase[]
  messages: Message[]
  isCompleted: boolean
  isInitialized: boolean
  phaseTransition?: {
    pending: boolean
    previousPhaseId?: string
    nextPhaseId?: string
  }
  onStartSession: () => Promise<void>
  onSubmitAnswer: (questionId: string, selectedOptions: string[]) => Promise<void>
  onAskQuestion: (question: string) => Promise<void>
  onSubmitProbeResponse: (probeQuestionId: string, response: string) => Promise<void>
  onUpdateTime: (seconds: number) => void
}

type LeftTab = 'description' | 'solution' | 'insights'

export function SocraticCoach({
  problem,
  patterns,
  session,
  phases,
  messages,
  isCompleted,
  isInitialized,
  phaseTransition,
  onStartSession,
  onSubmitAnswer,
  onAskQuestion,
  onSubmitProbeResponse,
  onUpdateTime,
}: SocraticCoachProps) {
  const [leftTab, setLeftTab] = useState<LeftTab>('description')
  const [elapsedSeconds, setElapsedSeconds] = useState(session.elapsedSeconds || 0)
  const [revealedQuestionIds, setRevealedQuestionIds] = useState<Set<string>>(new Set())
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null)

  // Solution Gate State
  const [isSolutionRevealed, setIsSolutionRevealed] = useState(false)
  const [showSolutionConfirm, setShowSolutionConfirm] = useState(false)
  const [revealedSolution, setRevealedSolution] = useState<string | null>(null)
  const [isFetchingSolution, setIsFetchingSolution] = useState(false)

  // Track time
  useEffect(() => {
    if (!isInitialized || isCompleted) return
    const interval = setInterval(() => {
      setElapsedSeconds(prev => {
        const next = prev + 1
        if (next % 10 === 0) onUpdateTime(next)
        return next
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isInitialized, isCompleted, onUpdateTime])

  // Reveal logic for questions
  useEffect(() => {
    const questions = messages.filter(m => m.type === 'question')
    if (questions.length === 0) return

    const unanswered = questions.filter(q => {
      const qIndex = messages.findIndex(m => m.id === q.id)
      const nextMsg = messages[qIndex + 1]
      return nextMsg?.type !== 'user-answer'
    })

    if (unanswered.length > 0) {
      const nextToReveal = unanswered[0]
      if (!revealedQuestionIds.has(nextToReveal.id)) {
        setActiveQuestionId(nextToReveal.id)
        setRevealedQuestionIds(prev => new Set([...prev, nextToReveal.id]))
      }
    } else {
      setActiveQuestionId(null)
    }
  }, [messages, revealedQuestionIds])

  const lastMessage = messages[messages.length - 1]
  const pendingProbeQuestion = lastMessage?.type === 'probe-question'
    ? lastMessage as ProbeQuestionMessage
    : null

  const sessionComplete = isCompleted || phases.every(p => p.status === 'completed')

  function getChatInputConfig(): { handler: (input: string) => Promise<void>; placeholder: string } {
    if (pendingProbeQuestion) {
      return {
        handler: (response) => onSubmitProbeResponse(pendingProbeQuestion.id, response),
        placeholder: "Type your explanation here...",
      }
    }
    return {
      handler: onAskQuestion,
      placeholder: "Ask codeboss a question...",
    }
  }

  const chatInputConfig = getChatInputConfig()

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-[400px_1fr] overflow-hidden bg-neutral-950 text-neutral-200 font-outfit">

      {/* LEFT PANE */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="hidden lg:flex flex-col border-r border-neutral-800 bg-neutral-900/10 overflow-hidden relative z-10"
      >
        {/* Glow effect */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-emerald-500/5 blur-[120px] pointer-events-none" />

        {/* Header Tabs */}
        <div className="border-b border-neutral-800 bg-black/40 backdrop-blur-xl z-20">
          <div className="flex px-4 pt-4">
            {(['description', 'solution', 'insights'] as LeftTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setLeftTab(tab)}
                className={`flex-1 pb-4 text-[11px] font-syne font-bold uppercase tracking-[0.2em] transition-all relative ${leftTab === tab ? 'text-emerald-400' : 'text-neutral-500 hover:text-neutral-300'
                  }`}
              >
                {tab}
                {leftTab === tab && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.6)]"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
          <AnimatePresence mode="wait">
            {leftTab === 'description' && (
              <motion.div
                key="description"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-syne font-bold uppercase tracking-[0.2em] text-neutral-500">Problem Overview</span>
                </div>
                <h1 className="text-3xl font-syne font-bold tracking-tight text-white mb-4 leading-none uppercase">
                  {problem.title}
                </h1>
                <div className="flex flex-wrap gap-2 mb-8">
                  <span className="text-[10px] font-syne font-bold uppercase tracking-widest text-emerald-400 bg-emerald-400/5 px-2.5 py-1 rounded border border-emerald-400/10">
                    {problem.difficulty}
                  </span>
                  {patterns.map((p, i) => (
                    <span key={i} className="text-[10px] font-syne font-bold uppercase tracking-widest text-neutral-400 bg-neutral-800/40 px-2.5 py-1 rounded border border-neutral-800/50">
                      {p.name}
                    </span>
                  ))}
                </div>
                <div className="premium-text text-neutral-400 text-[15px]">
                  <ProblemDescription description={problem.problem_description} />
                </div>
              </motion.div>
            )}

            {leftTab === 'solution' && (
              <motion.div
                key="solution"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full flex flex-col"
              >
                {!isSolutionRevealed ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                    <div className="w-20 h-20 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-8 shadow-2xl">
                      <Lock className="w-8 h-8 text-neutral-700" />
                    </div>
                    <h2 className="text-xl font-syne font-bold text-white mb-3 uppercase tracking-wider">Solution Sealed</h2>
                    <p className="premium-text text-sm text-neutral-500 mb-10 max-w-[260px]">
                      Review the reference solution only after attempting the patterns independently.
                    </p>

                    {!showSolutionConfirm ? (
                      <button
                        onClick={() => setShowSolutionConfirm(true)}
                        className="group flex items-center gap-3 px-8 py-4 bg-white text-black font-syne font-bold text-[11px] uppercase tracking-[0.2em] rounded transition-all hover:bg-emerald-400 active:scale-95"
                      >
                        <Eye className="w-4 h-4" />
                        Enter Archive
                      </button>
                    ) : (
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="p-8 bg-neutral-900/60 rounded-3xl border border-neutral-800 backdrop-blur-md"
                      >
                        <AlertCircle className="w-6 h-6 text-emerald-400 mx-auto mb-4" />
                        <p className="text-xs font-syne font-bold text-white mb-6 uppercase tracking-widest">Growth happens in the struggle.</p>
                        <div className="flex flex-col gap-3">
                          <button
                            onClick={async () => {
                              setIsFetchingSolution(true)
                              try {
                                const sol = await getProblemSolution(session.id)
                                setRevealedSolution(sol)
                                setIsSolutionRevealed(true)
                              } catch (err) {
                                console.error('Failed to fetch solution:', err)
                              } finally {
                                setIsFetchingSolution(false)
                              }
                            }}
                            disabled={isFetchingSolution}
                            className="w-full px-6 py-3 bg-emerald-500 text-black font-syne font-bold text-[10px] uppercase tracking-widest rounded hover:bg-emerald-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {isFetchingSolution && <Loader2 className="w-3 h-3 animate-spin" />}
                            {isFetchingSolution ? 'Retrieving Archive...' : 'Yes, show me'}
                          </button>
                          <button
                            onClick={() => setShowSolutionConfirm(false)}
                            className="w-full px-6 py-3 bg-neutral-800 text-white font-syne font-bold text-[10px] uppercase tracking-widest rounded hover:bg-neutral-700 transition-colors"
                          >
                            No, keep focused
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-syne font-bold text-white uppercase tracking-[0.2em] flex items-center gap-3">
                        <Terminal className="w-4 h-4 text-emerald-400" />
                        Reference Solution
                      </h2>
                      <button
                        onClick={() => setIsSolutionRevealed(false)}
                        className="p-2 text-neutral-500 hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="relative group">
                      <div className="absolute -inset-[1px] bg-gradient-to-r from-emerald-500/30 to-blue-500/30 rounded-xl blur-[1px] opacity-50"></div>
                      <pre className="relative p-6 bg-black/80 rounded-xl border border-neutral-800 overflow-x-auto text-[13px] font-mono leading-relaxed text-emerald-100/80 custom-scrollbar">
                        <code>{revealedSolution || '// Reference solution still being indexed...'}</code>
                      </pre>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {leftTab === 'insights' && (
              <motion.div
                key="insights"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <BrainCircuit className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-xl font-syne font-bold text-white uppercase tracking-wider">Neural Insights</h2>
                </div>

                {session?.phaseSummaries && Object.keys(session.phaseSummaries).length > 0 ? (
                  <div className="space-y-12">
                    {Object.entries(session.phaseSummaries).map(([phaseId, summary], idx) => (
                      <motion.div
                        key={phaseId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.15 }}
                        className="relative pl-8 border-l border-neutral-800"
                      >
                        <div className="absolute left-[-1px] top-0 w-[2px] h-full bg-gradient-to-b from-emerald-400 to-transparent opacity-30" />
                        <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]" />

                        <h3 className="text-[11px] font-syne font-bold text-neutral-500 uppercase tracking-[0.25em] mb-4">
                          {phases.find(p => p.id === phaseId)?.title || phaseId}
                        </h3>

                        <p className="premium-text text-[15px] text-neutral-300 mb-6 font-light">
                          {summary.summary}
                        </p>

                        {summary.conceptsCovered && summary.conceptsCovered.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {summary.conceptsCovered.map((concept, cIdx) => (
                              <span key={cIdx} className="text-[9px] font-syne font-bold uppercase tracking-[0.15em] text-emerald-400 bg-emerald-400/5 px-2.5 py-1.5 rounded-md border border-emerald-400/10 backdrop-blur-sm">
                                {concept}
                              </span>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="py-24 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-neutral-900/50 border border-neutral-800 flex items-center justify-center mb-8 relative">
                      <Sparkles className="w-6 h-6 text-neutral-700" />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute inset-0 bg-emerald-400/20 rounded-full blur-xl"
                      />
                    </div>
                    <p className="premium-text text-sm text-neutral-500 max-w-[220px]">
                      Analyze your socratic progression as you complete each phase.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* RIGHT PANE: Coaching Core */}
      <div className="flex flex-col h-full overflow-hidden relative bg-neutral-950">
        {/* Dynamic Header */}
        <div className="relative z-30 shrink-0">
          <AnimatePresence mode="wait">
            {!isInitialized ? (
              <motion.div
                key="welcome-header"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="bg-neutral-950/90 backdrop-blur-xl border-b border-neutral-800"
              >
                <SessionHeader problem={problem} patterns={patterns} elapsedSeconds={0} />
              </motion.div>
            ) : (
              <motion.div
                key="active-header"
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-neutral-950/40 backdrop-blur-3xl border-b border-neutral-800 shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
              >
                <SessionHeader problem={problem} patterns={patterns} elapsedSeconds={elapsedSeconds} />
                <PhaseProgress
                  phases={phases}
                  currentPhase={session.currentPhase}
                  onReviewPhase={() => { }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Messaging Matrix */}
        <div className="flex-1 overflow-y-auto relative scroll-smooth bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900/40 via-neutral-950 to-neutral-950">
          {!isInitialized ? (
            <WelcomeState problem={problem} onStartSession={onStartSession} isStarting={false} />
          ) : (
            <div className="max-w-4xl mx-auto px-8 py-10 w-full space-y-10">
              <AnimatePresence mode="popLayout">
                {messages.map((message, index) => {
                  if (message.type === 'question') {
                    const qMsg = message as QuestionMessage
                    const nextMsg = messages[index + 1]
                    const isAnswered = nextMsg?.type === 'user-answer'
                    const userAnswer = isAnswered ? (nextMsg as any).selectedOptions : null
                    const feedbackMsg = isAnswered ? messages[index + 2] : null

                    if (!isAnswered && !revealedQuestionIds.has(message.id)) return null

                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
                        className="space-y-6"
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <div className="h-[1px] flex-1 bg-neutral-800" />
                          <span className="text-[9px] font-syne font-bold uppercase tracking-[0.3em] text-neutral-600">Verification Phase</span>
                          <div className="h-[1px] flex-1 bg-neutral-800" />
                        </div>
                        <QuestionCard
                          question={qMsg}
                          isActive={message.id === activeQuestionId}
                          isAnswered={isAnswered}
                          userAnswer={userAnswer}
                          onSubmit={(opts) => onSubmitAnswer(message.id, opts)}
                        />
                        {feedbackMsg && feedbackMsg.type === 'feedback' && (
                          <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            <FeedbackCard feedback={feedbackMsg as FeedbackMessage} />
                          </motion.div>
                        )}
                      </motion.div>
                    )
                  }

                  if (message.type === 'coach') {
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-4 max-w-3xl"
                      >
                        <div className="w-10 h-10 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center shrink-0">
                          <BrainCircuit className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="premium-text text-neutral-200 text-lg leading-relaxed font-light pt-1">
                          {message.content}
                        </div>
                      </motion.div>
                    )
                  }

                  if (message.type === 'probe-question') {
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                      >
                        <div className="flex items-center gap-4 mb-2">
                          <div className="h-[1px] flex-1 bg-emerald-500/10" />
                          <span className="text-[9px] font-syne font-bold uppercase tracking-[0.3em] text-emerald-500/40">Critical Thinking Gate</span>
                          <div className="h-[1px] flex-1 bg-emerald-500/10" />
                        </div>
                        <ProbeQuestionCard
                          question={message as ProbeQuestionMessage}
                          isAnswered={messages[index + 1]?.type === 'probe-response'}
                        />
                      </motion.div>
                    )
                  }

                  return null
                })}
              </AnimatePresence>

              {/* End Of Line */}
              {sessionComplete && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="pt-24 pb-48 text-center space-y-10 border-t border-neutral-900"
                >
                  <div className="relative inline-block">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 5, repeat: Infinity }}
                      className="absolute inset-0 bg-emerald-400/20 blur-3xl rounded-full"
                    />
                    <div className="relative px-6 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-3">
                      <Trophy className="w-4 h-4 text-emerald-400" />
                      <span className="text-[10px] font-syne font-bold uppercase tracking-[0.25em] text-emerald-400">Concept Mastery Achieved</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h2 className="text-5xl font-syne font-bold text-white tracking-tight uppercase leading-none">
                      {problem.title}
                    </h2>
                    <p className="premium-text text-neutral-400 max-w-lg mx-auto text-lg pt-2 leading-relaxed">
                      You've navigated the edge cases and intuition leaps required for this pattern. The neural pathways are set.
                    </p>
                  </div>

                  <div className="flex justify-center flex-wrap gap-4">
                    <button
                      onClick={() => setLeftTab('insights')}
                      className="px-10 py-5 bg-neutral-900 border border-neutral-800 text-white font-syne font-bold text-[11px] uppercase tracking-[0.2em] rounded-md hover:bg-neutral-800 hover:border-neutral-700 transition-all active:scale-95 flex items-center gap-3"
                    >
                      <Sparkles className="w-4 h-4" />
                      Review Neural Graph
                    </button>
                    <button className="px-10 py-5 bg-emerald-500 text-black font-syne font-bold text-[11px] uppercase tracking-[0.2em] rounded-md hover:bg-emerald-400 transition-all active:scale-95 shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                      Engage Next Challenge
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Elevated Command Input */}
        {isInitialized && !sessionComplete && (
          <div className="relative z-40 px-10 pb-12 pt-6 bg-gradient-to-t from-neutral-950 via-neutral-950/95 to-transparent">
            <div className="max-w-4xl mx-auto">
              <ChatInput
                onSendMessage={chatInputConfig.handler}
                placeholder={chatInputConfig.placeholder}
              />
            </div>
          </div>
        )}
      </div>

      {/* Global Overlays */}
      <AnimatePresence>
        {phaseTransition?.pending && (
          <CelebrationOverlay
            previousPhaseId={phaseTransition.previousPhaseId || ''}
            nextPhaseId={phaseTransition.nextPhaseId || ''}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
