'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Terminal, ShieldAlert } from 'lucide-react'

interface ProblemDescriptionProps {
  description: string
}

export function ProblemDescription({ description }: ProblemDescriptionProps) {
  if (!description) {
    return <p className="premium-text text-neutral-500 italic">No diagnostic data available.</p>
  }

  const sections = parseDescriptionSections(description)

  return (
    <div className="space-y-8 font-outfit">
      {sections.map((section, index) => {
        if (section.type === 'example') {
          return <ExampleSection key={index} content={section.content} />
        }
        if (section.type === 'constraints') {
          return <ConstraintsSection key={index} content={section.content} />
        }
        return (
          <motion.p
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            className="premium-text text-neutral-300 leading-relaxed text-[15px] font-light"
          >
            {section.content.split('\n').map((line, lineIndex, arr) => (
              <React.Fragment key={lineIndex}>
                <FormattedLine line={line} />
                {lineIndex < arr.length - 1 && <br />}
              </React.Fragment>
            ))}
          </motion.p>
        )
      })}
    </div>
  )
}

type SectionType = 'text' | 'example' | 'constraints'
interface Section {
  type: SectionType
  content: string
}

function parseDescriptionSections(description: string): Section[] {
  const lines = description.split('\n')
  const sections: Section[] = []
  let currentSection: Section | null = null

  for (const line of lines) {
    const trimmed = line.trim()

    if (/^Example\s*\d*:/i.test(trimmed)) {
      if (currentSection && currentSection.content.trim()) sections.push(currentSection)
      currentSection = { type: 'example', content: trimmed }
    } else if (/^Constraints?:/i.test(trimmed)) {
      if (currentSection && currentSection.content.trim()) sections.push(currentSection)
      currentSection = { type: 'constraints', content: trimmed }
    } else if (currentSection) {
      if (currentSection.type === 'example') {
        if (trimmed || currentSection.content.includes('Input:')) {
          if (trimmed) currentSection.content += '\n' + trimmed
        }
      } else if (currentSection.type === 'constraints') {
        if (trimmed) currentSection.content += '\n' + trimmed
      } else {
        if (trimmed) {
          currentSection.content += '\n' + trimmed
        } else if (currentSection.content.trim()) {
          sections.push(currentSection)
          currentSection = null
        }
      }
    } else if (trimmed) {
      currentSection = { type: 'text', content: trimmed }
    }
  }

  if (currentSection && currentSection.content.trim()) sections.push(currentSection)
  return sections
}

function ExampleSection({ content }: { content: string }) {
  const lines = content.split('\n')
  const title = lines[0]
  const body = lines.slice(1)

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden group transition-all hover:bg-neutral-900/60"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-[40px] rounded-full pointer-events-none" />

      <div className="flex items-center gap-2 mb-4">
        <Terminal className="w-3.5 h-3.5 text-neutral-600" />
        <div className="text-[10px] font-syne font-bold text-neutral-500 uppercase tracking-[0.2em]">{title}</div>
      </div>

      <div className="space-y-3 font-mono text-[13px] leading-relaxed">
        {body.map((line, idx) => {
          const trimmedLine = line.trim()
          if (/^Input:/i.test(trimmedLine)) {
            return (
              <div key={idx} className="flex gap-2">
                <span className="text-neutral-600 shrink-0 uppercase text-[10px] pt-1 font-syne font-bold tracking-widest">Input</span>
                <span className="text-emerald-400 group-hover:text-emerald-300 transition-colors">
                  {trimmedLine.replace(/^Input:\s*/i, '')}
                </span>
              </div>
            )
          }
          if (/^Output:/i.test(trimmedLine)) {
            return (
              <div key={idx} className="flex gap-2">
                <span className="text-neutral-600 shrink-0 uppercase text-[10px] pt-1 font-syne font-bold tracking-widest">Output</span>
                <span className="text-blue-400">
                  {trimmedLine.replace(/^Output:\s*/i, '')}
                </span>
              </div>
            )
          }
          if (/^Explanation:/i.test(trimmedLine)) {
            return (
              <div key={idx} className="mt-4 pt-4 border-t border-neutral-800/50 premium-text text-neutral-400 text-sm font-light leading-relaxed">
                <span className="text-[10px] font-syne font-bold text-neutral-600 uppercase tracking-widest mr-2">Explanation</span>
                {trimmedLine.replace(/^Explanation:\s*/i, '')}
              </div>
            )
          }
          if (trimmedLine) {
            return <div key={idx} className="text-neutral-500 pl-16">{trimmedLine}</div>
          }
          return null
        })}
      </div>
    </motion.div>
  )
}

function formatMath(text: string) {
  let formatted = text.replace(/\b10([0-9])\b/g, '10<sup>$1</sup>')
  formatted = formatted.replace(/\b231\b/g, '2<sup>31</sup>')
  formatted = formatted.replace(/O\(([a-zA-Z]+)([0-9]+)\)/g, 'O($1<sup>$2</sup>)')
  return <span dangerouslySetInnerHTML={{ __html: formatted }} />
}

function ConstraintsSection({ content }: { content: string }) {
  const lines = content.split('\n')
  const title = lines[0]
  const constraints = lines.slice(1).filter((line) => line.trim())

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-3.5 h-3.5 text-neutral-600" />
        <div className="text-[10px] font-syne font-bold text-neutral-500 uppercase tracking-[0.2em]">{title}</div>
      </div>
      <ul className="space-y-2">
        {constraints.map((constraint, idx) => {
          const text = constraint.trim().replace(/^[-•*]\s*/, '')
          return (
            <motion.li
              key={idx}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + idx * 0.05 }}
              className="flex items-start gap-3"
            >
              <div className="w-1 h-1 rounded-full bg-emerald-500/40 mt-2 shrink-0" />
              <div className="font-mono text-[12px] text-neutral-400 leading-relaxed uppercase tracking-tighter">
                <FormattedLine line={text} />
              </div>
            </motion.li>
          )
        })}
      </ul>
    </div>
  )
}

function FormattedLine({ line }: { line: string }) {
  const parts = line.split(/(`[^`]+`)/)
  return (
    <>
      {parts.map((part, idx) => {
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={idx}
              className="px-1.5 py-0.5 bg-emerald-500/5 text-emerald-400/90 rounded border border-emerald-500/10 text-[12px] font-mono mx-1"
            >
              {part.slice(1, -1)}
            </code>
          )
        }
        return <span key={idx}>{formatMath(part)}</span>
      })}
    </>
  )
}
