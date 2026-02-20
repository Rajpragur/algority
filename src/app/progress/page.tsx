import { createServerSupabaseClient } from '@/lib/supabase'
import { getUserProgress } from './actions'
import { ProgressClient } from './ProgressClient'
import Link from 'next/link'
import { IconActivity } from '@tabler/icons-react'

export default async function ProgressPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-8 bg-slate-50 dark:bg-black">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-md w-full">
          <div className="mx-auto h-20 w-20 bg-emerald-50 dark:bg-emerald-900/10 rounded-full flex items-center justify-center mb-6">
            <IconActivity className="h-10 w-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Track Your Progress
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Sign in to see your interview readiness score, pattern mastery, and coding streak.
          </p>
          <Link href="/" className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500 transition-colors">
            Go to Workspace
          </Link>
        </div>
      </div>
    )
  }

  const progressData = await getUserProgress()

  if (!progressData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-8 bg-slate-50 dark:bg-black">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-md w-full">
          <h2 className="text-xl font-semibold mb-2">No progress data available</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Start solving problems to track your progress!
          </p>
          <Link href="/" className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">
            Browse Problems
          </Link>
        </div>
      </div>
    )
  }

  return <ProgressClient data={progressData} />
}
