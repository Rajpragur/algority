'use client'

import ReactMarkdown from 'react-markdown'
import { motion } from 'framer-motion'
import { Brain, HelpCircle, ArrowRight } from 'lucide-react'
import type { ProbeQuestionMessage } from '@/lib/types'

function decodeUnicodeEscapes(text: string): string {
    return text.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16))
    )
}

const markdownComponents = {
    p: ({ children }: { children?: React.ReactNode }) => (
        <p className="premium-text text-base leading-relaxed text-neutral-200 font-light">{children}</p>
    ),
}

export function ProbeQuestionCard({
    question,
    isAnswered
}: {
    question: ProbeQuestionMessage,
    isAnswered: boolean
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-3xl border transition-all duration-700 ${isAnswered
                ? 'bg-neutral-900/10 border-neutral-800 opacity-60'
                : 'bg-emerald-500/[0.02] border-emerald-500/10 shadow-[0_30px_100px_rgba(52,211,153,0.03)]'
                }`}
        >
            <div className="flex gap-4 items-start">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${isAnswered
                    ? 'bg-neutral-900 border-neutral-800'
                    : 'bg-emerald-500/10 border-emerald-500/20'
                    }`}>
                    <Brain className={`w-5 h-5 ${isAnswered ? 'text-neutral-700' : 'text-emerald-400'}`} />
                </div>

                <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-4">
                        <span className={`text-[11px] font-syne font-bold uppercase tracking-[0.4em] ${isAnswered ? 'text-neutral-600' : 'text-emerald-500/60'
                            }`}>
                            Deep Reasoning Probe
                        </span>
                        <div className={`h-[1px] flex-1 ${isAnswered ? 'bg-neutral-800' : 'bg-emerald-500/10'}`} />
                    </div>

                    <ReactMarkdown components={markdownComponents}>
                        {decodeUnicodeEscapes(question.content)}
                    </ReactMarkdown>

                    {!isAnswered && (
                        <div className="flex items-center gap-2 text-[10px] font-syne font-bold uppercase tracking-widest text-emerald-400/40">
                            <ArrowRight className="w-3 h-3" />
                            Think out loud in the command input
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}
