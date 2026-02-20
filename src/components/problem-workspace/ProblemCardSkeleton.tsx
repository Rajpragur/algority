export function ProblemCardSkeleton() {
  return (
    <div className="relative w-full rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      {/* Status icon placeholder */}
      <div className="absolute right-3 top-3">
        <div className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
      </div>

      {/* Difficulty badge */}
      <div className="h-3 w-12 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />

      {/* Title */}
      <div className="mt-2 h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />

      {/* Description lines */}
      <div className="mt-3 space-y-2">
        <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
        <div className="h-3 w-5/6 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
      </div>

      {/* Pattern tags */}
      <div className="mt-4 flex gap-1.5">
        <div className="h-5 w-16 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
        <div className="h-5 w-20 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
        <div className="h-5 w-14 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
      </div>
    </div>
  )
}
