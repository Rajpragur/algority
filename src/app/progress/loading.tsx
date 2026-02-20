export default function ProgressLoading() {
    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-black/20 pb-20">
            {/* Header Skeleton */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-8 px-6 sm:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 animate-pulse rounded mb-4"></div>
                    <div className="h-6 w-full max-w-2xl bg-slate-200 dark:bg-slate-800 animate-pulse rounded"></div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-0 pt-8 space-y-8">
                {/* Metrics Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between h-40">
                            <div className="space-y-3">
                                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded"></div>
                                <div className="h-8 w-12 bg-slate-200 dark:bg-slate-800 animate-pulse rounded"></div>
                                <div className="h-3 w-40 bg-slate-200 dark:bg-slate-800 animate-pulse rounded"></div>
                            </div>
                            <div className="h-16 w-16 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
                        </div>
                    ))}
                </div>

                {/* Main Content Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Strong/Weak */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1, 2].map(i => (
                                <div key={i} className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 h-32">
                                    <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded mb-4"></div>
                                    <div className="space-y-2">
                                        <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded"></div>
                                        <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded"></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pattern List */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-[600px] p-6">
                            <div className="flex justify-between mb-8">
                                <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 animate-pulse rounded"></div>
                                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded"></div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between">
                                            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded"></div>
                                            <div className="h-4 w-8 bg-slate-200 dark:bg-slate-800 animate-pulse rounded"></div>
                                        </div>
                                        <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded-full"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-8">
                        {/* Activity */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 h-64">
                            <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded mb-4"></div>
                            <div className="flex flex-wrap gap-1">
                                {Array.from({ length: 50 }).map((_, i) => (
                                    <div key={i} className="h-3 w-3 rounded-sm bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
                                ))}
                            </div>
                        </div>

                        {/* Tips */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 h-40">
                            <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded mb-4"></div>
                            <div className="space-y-2">
                                <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded"></div>
                                <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded"></div>
                                <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-800 animate-pulse rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
