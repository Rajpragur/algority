import { User } from 'lucide-react'
import { motion } from 'framer-motion'

interface UserQuestionBubbleProps {
  content: string
}

export function UserQuestionBubble({ content }: UserQuestionBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex gap-3 justify-end items-end group"
    >
      <div className="max-w-[85%] bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl rounded-tr-sm px-5 py-3.5 shadow-md shadow-emerald-500/20">
        <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{content}</p>
      </div>
      <div className="shrink-0 w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center border border-neutral-200 dark:border-neutral-700">
        <User className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
      </div>
    </motion.div>
  )
}
