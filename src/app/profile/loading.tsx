export default function ProfileLoading() {
    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-black/20 pb-20">
            {/* Hero Background Skeleton */}
            <div className="h-48 w-full bg-slate-200 dark:bg-slate-800 animate-pulse relative overflow-hidden">
                <div className="absolute inset-0 bg-slate-300 dark:bg-slate-700 opacity-20"></div>
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Column Skeleton */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Profile Card Skeleton */}
                        <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 overflow-hidden relative h-[500px]">
                            <div className="px-6 pt-8 pb-6 flex flex-col items-center">
                                {/* Avatar */}
                                <div className="h-32 w-32 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse mb-4"></div>
                                {/* Name */}
                                <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 animate-pulse rounded mb-2"></div>
                                {/* Rank */}
                                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded mb-8"></div>

                                {/* Details Grid */}
                                <div className="w-full space-y-4">
                                    <div className="h-16 w-full bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded-xl"></div>
                                    <div className="h-16 w-full bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded-xl"></div>
                                </div>

                                {/* Bio */}
                                <div className="w-full mt-6">
                                    <div className="h-24 w-full bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded-xl"></div>
                                </div>
                            </div>
                        </div>

                        {/* Leaderboard Skeleton */}
                        <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 h-96">
                            <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded mb-6"></div>
                            <div className="space-y-4">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
                                        <div className="flex-1 space-y-1">
                                            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded"></div>
                                            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 animate-pulse rounded"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column Skeleton */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Total Solved Card */}
                        <div className="rounded-2xl bg-white dark:bg-slate-900 p-8 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 h-40 flex items-center justify-between">
                            <div className="space-y-2">
                                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded"></div>
                                <div className="h-12 w-48 bg-slate-200 dark:bg-slate-800 animate-pulse rounded"></div>
                            </div>
                            <div className="h-20 w-20 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
                        </div>

                        {/* Performance Stats */}
                        <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 h-64">
                            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 animate-pulse rounded mb-6"></div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-32 rounded-xl bg-slate-100 dark:bg-slate-800/50 animate-pulse"></div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Study Plans */}
                            <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 h-80">
                                <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded mb-6"></div>
                                <div className="space-y-6">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="space-y-2">
                                            <div className="flex justify-between">
                                                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded"></div>
                                                <div className="h-4 w-8 bg-slate-200 dark:bg-slate-800 animate-pulse rounded"></div>
                                            </div>
                                            <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded-full"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Activity */}
                            <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 h-80">
                                <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded mb-6"></div>
                                <div className="space-y-4">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="flex gap-3">
                                            <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded"></div>
                                                <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-800 animate-pulse rounded"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
