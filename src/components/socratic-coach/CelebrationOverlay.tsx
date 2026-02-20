'use client'

import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, Zap } from 'lucide-react'

interface CelebrationOverlayProps {
    previousPhaseId: string
    nextPhaseId: string
}

export function CelebrationOverlay({ previousPhaseId, nextPhaseId }: CelebrationOverlayProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md"
        >
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 blur-[150px] rounded-full" />
            </div>

            <div className="relative text-center space-y-12">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="space-y-4"
                >
                    <div className="flex justify-center mb-8">
                        <div className="w-20 h-20 rounded-3xl bg-emerald-500 flex items-center justify-center shadow-[0_0_50px_rgba(52,211,153,0.4)]">
                            <Zap className="w-10 h-10 text-black fill-current" />
                        </div>
                    </div>

                    <h2 className="text-[12px] font-syne font-bold uppercase tracking-[0.6em] text-emerald-400">
                        Phase Consolidated
                    </h2>
                    <h1 className="text-6xl font-syne font-bold text-white uppercase tracking-tight leading-none">
                        Advancing Insight
                    </h1>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center justify-center gap-8"
                >
                    <div className="text-right">
                        <p className="text-[10px] font-syne font-bold uppercase tracking-widest text-neutral-500 mb-1">Completed</p>
                        <p className="text-lg font-syne font-bold text-white uppercase">{previousPhaseId.replace('-', ' ')}</p>
                    </div>

                    <ArrowRight className="w-6 h-6 text-emerald-400" />

                    <div className="text-left">
                        <p className="text-[10px] font-syne font-bold uppercase tracking-widest text-neutral-500 mb-1">Next Vector</p>
                        <p className="text-lg font-syne font-bold text-white uppercase">{nextPhaseId.replace('-', ' ')}</p>
                    </div>
                </motion.div>

                <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-[10px] font-syne font-bold uppercase tracking-[0.4em] text-neutral-400"
                >
                    Calibrating Neural Pathways...
                </motion.div>
            </div>
        </motion.div>
    )
}
