export default function EditorLoading() {
  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-8 w-36 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="mt-2 h-5 w-64 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>

        {/* Search bar skeleton */}
        <div className="mb-8">
          <div className="h-12 w-full rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>

        {/* Drafts section skeleton */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-5 w-5 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-6 w-28 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/50"
              >
                <div className="mb-2 h-5 w-14 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                <div className="mt-2 h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
              </div>
            ))}
          </div>
        </section>

        {/* Recent section skeleton */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-5 w-5 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-6 w-36 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/50"
              >
                <div className="mb-2 h-5 w-14 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                <div className="mt-2 h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
