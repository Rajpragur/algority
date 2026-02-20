export default function Loading() {
    return (
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-8 space-y-4">
                <div className="h-10 w-64 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-5 w-full max-w-2xl animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800/50" />
            </div>

            <div className="mb-8 flex gap-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-8 w-32 animate-pulse rounded-full bg-neutral-100 dark:bg-neutral-800" />
                ))}
            </div>

            <div className="mb-8 space-y-5">
                <div className="h-12 w-full animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-900" />
                <div className="flex gap-4">
                    <div className="h-10 flex-1 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-900" />
                    <div className="h-10 flex-1 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-900" />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="h-48 w-full animate-pulse rounded-3xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800" />
                ))}
            </div>
        </div>
    )
}
