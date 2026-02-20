'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import type { OnMount, OnChange } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { EditorSkeleton } from './EditorSkeleton'

const MonacoEditor = dynamic(() => import('@monaco-editor/react').then((mod) => mod.default), {
  ssr: false,
  loading: () => <EditorSkeleton />,
})

interface CursorPosition {
  line: number
  column: number
}

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  onCursorChange?: (position: CursorPosition) => void
  onEditorReady?: (editor: editor.IStandaloneCodeEditor) => void
}

export function CodeEditor({ value, onChange, onCursorChange, onEditorReady }: CodeEditorProps) {
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Detect dark mode from document class (Tailwind pattern)
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    }

    // Initial check
    checkDarkMode()

    // Watch for changes
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  const handleEditorMount: OnMount = useCallback(
    (editor) => {
      // Track cursor position changes
      editor.onDidChangeCursorPosition((e) => {
        onCursorChange?.({
          line: e.position.lineNumber,
          column: e.position.column,
        })
      })

      // Notify parent that editor is ready (for selection API access)
      onEditorReady?.(editor)

      // Focus the editor
      editor.focus()
    },
    [onCursorChange, onEditorReady]
  )

  const handleEditorChange: OnChange = useCallback(
    (value) => {
      onChange(value ?? '')
    },
    [onChange]
  )

  return (
    <div className="h-full" role="region" aria-label="Python code editor">
      <MonacoEditor
        height="100%"
        language="python"
        theme={isDarkMode ? 'vs-dark' : 'vs'}
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorMount}
        options={{
        fontSize: 14,
        fontFamily: "'JetBrains Mono', monospace",
        lineNumbers: 'on',
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        wordWrap: 'on',
        padding: { top: 16 },
        renderLineHighlight: 'line',
        cursorBlinking: 'smooth',
        smoothScrolling: true,
        contextmenu: true,
        formatOnPaste: true,
        formatOnType: true,
      }}
      />
    </div>
  )
}
