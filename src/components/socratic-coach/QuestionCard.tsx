import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, HelpCircle, Layers, ChevronRight, Sparkles } from 'lucide-react'
import type { QuestionMessage } from '@/lib/types'

function decodeUnicodeEscapes(text: string): string {
  return text.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  )
}

const markdownComponents = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="premium-text text-sm text-neutral-300 mb-1 last:mb-0 leading-relaxed">{children}</p>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[13px] font-mono border border-emerald-500/20">{children}</code>
  ),
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="my-4 p-4 rounded-xl bg-black/40 border border-neutral-800 overflow-x-auto text-[13px] font-mono leading-relaxed text-emerald-100/90">{children}</pre>
  ),
}

interface QuestionCardProps {
  question: QuestionMessage
  isActive: boolean
  isAnswered: boolean
  userAnswer: string[] | null
  onSubmit: (options: string[]) => void
}

export function QuestionCard({
  question,
  isActive,
  isAnswered,
  userAnswer,
  onSubmit
}: QuestionCardProps) {
  const [selected, setSelected] = useState<string[]>(userAnswer || [])
  const isMultiSelect = question.questionType === 'multi-select'

  const toggleOption = (id: string) => {
    if (isAnswered) return
    if (isMultiSelect) {
      setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    } else {
      setSelected([id])
    }
  }

  const handleApply = () => {
    if (selected.length > 0) onSubmit(selected)
  }

  return (
    <motion.div
      layout
      className="relative"
    >
      <div className="bg-neutral-900/40 rounded-3xl border border-neutral-800 overflow-hidden shadow-2xl backdrop-blur-sm">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-900/20">
          <div className="flex items-center gap-3 mb-4">
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-syne font-bold uppercase tracking-[0.3em] text-neutral-500">
              {isMultiSelect ? 'Multi-Choice Pattern' : 'Single-Choice Pattern'}
            </span>
          </div>
          <ReactMarkdown components={markdownComponents}>
            {decodeUnicodeEscapes(question.content)}
          </ReactMarkdown>
        </div>

        {/* Options */}
        <div className="p-3 space-y-1.5">
          {question.options.map((option, idx) => {
            const isSel = selected.includes(option.id)
            const isCorrect = isAnswered && question.correctAnswer.includes(option.id)
            const isWrong = isAnswered && isSel && !question.correctAnswer.includes(option.id)

            return (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => toggleOption(option.id)}
                disabled={isAnswered}
                className={`w-full group flex items-center gap-3 p-3 rounded-xl transition-all duration-300 relative overflow-hidden ${isCorrect
                  ? 'bg-emerald-500/10 border border-emerald-500/30'
                  : isWrong
                    ? 'bg-red-500/10 border border-red-500/30'
                    : isSel
                      ? 'bg-white/5 border border-white/10'
                      : 'bg-transparent border border-transparent hover:bg-white/[0.02]'
                  }`}
              >
                {/* Visual Indicator */}
                <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-all ${isSel || isCorrect
                  ? 'bg-emerald-500 border-emerald-500 text-black'
                  : isWrong
                    ? 'bg-red-500 border-red-500 text-white'
                    : 'border-neutral-700 bg-neutral-800/50'
                  }`}>
                  {isAnswered ? (
                    isCorrect ? <Check className="w-3.5 h-3.5 stroke-[3]" /> :
                      isWrong ? <X className="w-3.5 h-3.5 stroke-[3]" /> : null
                  ) : (
                    isSel && <div className="w-2 h-2 rounded-sm bg-black" />
                  )}
                </div>

                {/* Option Text */}
                <div className="flex-1 flex items-baseline gap-4 min-w-0">
                  <span className={`text-[11px] font-syne font-bold uppercase tracking-widest shrink-0 ${isSel ? 'text-emerald-400' : 'text-neutral-500'
                    }`}>
                    {option.label}
                  </span>
                  <div className={`premium-text text-[13px] text-left truncate transition-colors ${isSel ? 'text-white' : 'text-neutral-400'
                    }`}>
                    <ReactMarkdown components={markdownComponents}>
                      {decodeUnicodeEscapes(option.text)}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* Achievement Highlight */}
                <AnimatePresence>
                  {isCorrect && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-400/40" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            )
          })}
        </div>

        {/* Action Gate */}
        {!isAnswered && (
          <div className="px-6 py-4 bg-black/20 border-t border-neutral-800 flex justify-between items-center">
            <p className="text-[10px] font-syne font-bold uppercase tracking-widest text-neutral-600">
              {isMultiSelect ? 'Select multiple' : 'Select one'}
            </p>
            <button
              onClick={handleApply}
              disabled={selected.length === 0}
              className={`flex items-center gap-3 px-6 py-2.5 rounded-lg font-syne font-bold text-[10px] uppercase tracking-[0.2em] transition-all ${selected.length > 0
                ? 'bg-white text-black hover:bg-emerald-400 shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-50'
                }`}
            >
              Verify Pattern
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
