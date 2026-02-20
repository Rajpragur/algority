import type { Code } from '../types'

interface EditorPanelProps {
  code: Code
  onCodeChange?: (code: string) => void
}

const languageLabels: Record<string, string> = {
  python: 'Python',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  java: 'Java',
  cpp: 'C++'
}

export function EditorPanel({ code, onCodeChange }: EditorPanelProps) {
  return (
    <div className="h-full flex flex-col bg-slate-900 dark:bg-slate-950">
      {/* Editor Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-slate-800 dark:bg-slate-900 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-xs font-medium text-slate-400">
            solution.{code.language === 'python' ? 'py' : code.language === 'javascript' ? 'js' : code.language === 'typescript' ? 'ts' : code.language === 'java' ? 'java' : 'cpp'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 text-xs font-medium bg-slate-700 text-slate-300 rounded">
            {languageLabels[code.language] || code.language}
          </span>
        </div>
      </div>

      {/* Code Editor Area */}
      <div className="flex-1 relative overflow-auto">
        <div className="absolute inset-0 flex">
          {/* Line Numbers */}
          <div className="shrink-0 px-4 py-4 bg-slate-800/50 dark:bg-slate-900/50 text-right select-none border-r border-slate-700/50">
            {code.content.split('\n').map((_, idx) => (
              <div
                key={idx}
                className="font-mono text-sm leading-6 text-slate-500"
              >
                {idx + 1}
              </div>
            ))}
          </div>

          {/* Code Content */}
          <div className="flex-1 relative">
            <textarea
              value={code.content}
              onChange={(e) => onCodeChange?.(e.target.value)}
              className="absolute inset-0 w-full h-full px-4 py-4 font-mono text-sm leading-6 text-slate-100 bg-transparent resize-none focus:outline-none caret-emerald-400"
              spellCheck={false}
              style={{ tabSize: 4 }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
