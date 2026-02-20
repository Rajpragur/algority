export default function Loading() {
  return (
    <div className="min-h-full">
      {/* Hero Section Skeleton */}
      <section className="flex flex-col items-center justify-center px-4 pt-16 pb-12 md:pt-24 md:pb-16">
        {/* Headline skeleton */}
        <div className="h-12 w-full max-w-lg rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse sm:h-14 md:h-16" />

        {/* Subheadline skeleton */}
        <div className="mt-6 h-6 w-full max-w-md rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />

        {/* Search bar skeleton */}
        <div className="mt-10 w-full max-w-2xl">
          <div className="h-14 w-full rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>

        {/* CTA skeleton */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="h-12 w-44 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
      </section>

      {/* Features Section Skeleton */}
      <section className="border-t border-slate-100 bg-slate-50/50 px-4 py-16 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800/50"
              >
                {/* Icon skeleton */}
                <div className="mb-4 h-12 w-12 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
                {/* Title skeleton */}
                <div className="mb-2 h-5 w-32 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                {/* Description skeleton */}
                <div className="space-y-2">
                  <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Problems Section Skeleton */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          {/* Section title skeleton */}
          <div className="mb-8 flex justify-center">
            <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>

          {/* Problem cards skeleton */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800/50"
              >
                {/* Difficulty badge skeleton */}
                <div className="mb-2 h-5 w-14 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                {/* Title skeleton */}
                <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                {/* Pattern tags skeleton */}
                <div className="mt-2 h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
