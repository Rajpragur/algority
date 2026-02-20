'use client'

export function EditorSkeleton() {
  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-[#1e1e1e] p-4">
      {/* Simulated editor with line numbers and code lines */}
      <div className="flex gap-4 h-full">
        {/* Line numbers gutter */}
        <div className="w-10 space-y-1 pt-1">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="h-5 w-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"
              style={{ animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>
        {/* Code lines */}
        <div className="flex-1 space-y-1 pt-1">
          <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" style={{ animationDelay: '100ms' }} />
          <div className="h-5 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" style={{ animationDelay: '200ms' }} />
          <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" style={{ animationDelay: '300ms' }} />
          <div className="h-5 w-56 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" style={{ animationDelay: '400ms' }} />
          <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" style={{ animationDelay: '500ms' }} />
          <div className="h-5 w-72 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" style={{ animationDelay: '600ms' }} />
          <div className="h-5 w-36 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" style={{ animationDelay: '700ms' }} />
        </div>
      </div>
    </div>
  )
}
