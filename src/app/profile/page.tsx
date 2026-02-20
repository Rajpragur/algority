import { createServerSupabaseClient } from '@/lib/supabase'
import { getUserProfile, getUserStats, getLeaderboard } from './actions'
import { ProfileClient } from './ProfileClient'
import { IconUser } from '@tabler/icons-react'
import Link from 'next/link'

export default async function ProfilePage() {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-8 bg-slate-50 dark:bg-black">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-md w-full">
                    <div className="mx-auto h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                        <IconUser className="h-10 w-10 text-slate-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        Profile Not Found
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        Please sign in to view your profile and track your progress.
                    </p>
                    <Link href="/" className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500 transition-colors">
                        Go to Workspace
                    </Link>
                </div>
            </div>
        )
    }

    const [profile, stats] = await Promise.all([
        getUserProfile(user.id),
        getUserStats(user.id)
    ])

    if (!profile || !stats) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-8 bg-slate-50 dark:bg-black">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-md w-full">
                    <div className="mx-auto h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                        <IconUser className="h-10 w-10 text-slate-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        Profile Not Found
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        We couldn't load your profile data. Please try again later.
                    </p>
                    <Link href="/" className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500 transition-colors">
                        Go to Workspace
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <ProfileClient
            initialProfile={profile}
            initialStats={stats}
        />
    )
}
