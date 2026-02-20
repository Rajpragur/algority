'use client'

import ReactMarkdown from 'react-markdown'
import { motion } from 'framer-motion'
import { Sparkles, MessageSquare, AlertCircle, CheckCircle2, RefreshCcw } from 'lucide-react'
import type { FeedbackMessage } from '@/lib/types'

function decodeUnicodeEscapes(text: string): string {
    return text.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16))
    )
}

const markdownComponents = {
    p: ({ children }: { children?: React.ReactNode }) => (
        <p className="premium-text text-base leading-relaxed text-neutral-300 font-light">{children}</p>
    ),
    strong: ({ children }: { children?: React.ReactNode }) => (
        <strong className="font-syne font-bold text-white uppercase tracking-widest text-xs">{children}</strong>
    ),
}

export function FeedbackCard({ feedback }: { feedback: FeedbackMessage }) {
    const isCorrect = feedback.isCorrect

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative p-8 rounded-3xl border ${isCorrect
                    ? 'bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_50px_rgba(52,211,153,0.05)]'
                    : 'bg-neutral-900 border-neutral-800'
                }`}
        >
            <div className="flex gap-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${isCorrect
                        ? 'bg-emerald-500/10 border-emerald-500/20'
                        : 'bg-neutral-800 border-neutral-700'
                    }`}>
                    {isCorrect ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    ) : (
                        <RefreshCcw className="w-6 h-6 text-neutral-500" />
                    )}
                </div>

                <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-syne font-bold uppercase tracking-[0.3em] ${isCorrect ? 'text-emerald-400' : 'text-neutral-500'
                            }`}>
                            {isCorrect ? 'Synthesis Successful' : 'Intuition Refinement'}
                        </span>
                        <Sparkles className={`w-4 h-4 ${isCorrect ? 'text-emerald-400/40' : 'text-neutral-800'}`} />
                    </div>

                    <ReactMarkdown components={markdownComponents}>
                        {decodeUnicodeEscapes(feedback.content)}
                    </ReactMarkdown>
                </div>
            </div>

            {/* Decorative accent */}
            <div className={`absolute top-0 right-0 w-24 h-24 blur-[60px] pointer-events-none rounded-full ${isCorrect ? 'bg-emerald-500/10' : 'bg-neutral-800/10'
                }`} />
        </motion.div>
    )
}
