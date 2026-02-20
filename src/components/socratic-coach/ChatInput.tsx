'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Terminal, Zap, ArrowUp } from 'lucide-react'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({
  onSendMessage,
  disabled = false,
  placeholder = 'Engage with logic...',
}: ChatInputProps) {
  const [inputValue, setInputValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = useCallback(() => {
    const trimmed = inputValue.trim()
    if (trimmed && !disabled) {
      onSendMessage(trimmed)
      setInputValue('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }, [inputValue, disabled, onSendMessage])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
    }
  }, [inputValue])

  return (
    <div className="relative group">
      {/* Glow effect on hover */}
      <div className="absolute -inset-[1px] bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-2xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-700 pointer-events-none" />

      <div className="relative bg-neutral-900/60 border border-neutral-800 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl transition-all duration-300 group-focus-within:border-neutral-700 group-focus-within:bg-neutral-900/80">
        <div className="flex items-end gap-2 p-3 pl-5">
          <Terminal className="w-5 h-5 text-neutral-600 mb-4 shrink-0" />

          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent border-0 resize-none focus:ring-0 text-[16px] text-neutral-200 placeholder:text-neutral-600 font-light py-4 custom-scrollbar max-h-[160px]"
          />

          <div className="pb-2 pr-2">
            <button
              onClick={handleSubmit}
              disabled={disabled || !inputValue.trim()}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${inputValue.trim() && !disabled
                  ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:scale-105 active:scale-95'
                  : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                }`}
            >
              <ArrowUp className={`w-5 h-5 stroke-[2.5] transition-transform duration-500 ${inputValue.trim() ? 'translate-y-0' : 'translate-y-0.5 opacity-50'}`} />
            </button>
          </div>
        </div>

        {/* Command indicator */}
        <div className="px-5 py-2 border-t border-neutral-800/50 bg-black/20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-syne font-bold uppercase tracking-[0.2em] text-neutral-600">Enter</span>
              <span className="text-[9px] font-syne font-bold uppercase tracking-widest text-neutral-700">Submit</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Zap className={`w-3 h-3 transition-colors ${inputValue.trim() ? 'text-emerald-500' : 'text-neutral-800'}`} />
            <span className="text-[8px] font-syne font-bold uppercase tracking-[0.3em] text-neutral-700">Neural Sync</span>
          </div>
        </div>
      </div>
    </div>
  )
}
