import { Zap } from 'lucide-react'

export default function PlansPage() {
    return (
        <div className="mx-auto max-w-5xl px-6 py-12 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                    Choose your training plan
                </h2>
                <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-400">
                    Level up your coding skills with AI-powered coaching.
                </p>
            </div>

            <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-y-6 sm:mt-20 sm:gap-y-0 lg:max-w-4xl lg:grid-cols-2 lg:gap-8">
                {/* Free Plan */}
                <div className="rounded-3xl p-8 ring-1 ring-slate-200 xl:p-10 dark:ring-slate-800 bg-white dark:bg-slate-900">
                    <h3 className="text-lg font-semibold leading-8 text-slate-900 dark:text-white">Beginner</h3>
                    <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">Perfect for getting started with coding interviews.</p>
                    <p className="mt-6 flex items-baseline gap-x-1">
                        <span className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Free</span>
                        <span className="text-sm font-semibold leading-6 text-slate-600 dark:text-slate-400">/forever</span>
                    </p>
                    <button className="mt-6 block w-full rounded-md bg-white px-3 py-2 text-center text-sm font-semibold leading-6 text-emerald-600 ring-1 ring-inset ring-slate-200 hover:ring-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:bg-slate-900 dark:ring-slate-700 dark:hover:ring-slate-600">
                        Current Plan
                    </button>
                    <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                        {['Access to Blind 75', 'Basic AI Hints', 'Community Support', 'Progress Tracking'].map((feature) => (
                            <li key={feature} className="flex gap-x-3">
                                <Zap className="h-6 w-5 flex-none text-emerald-600" aria-hidden="true" />
                                {feature}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Pro Plan */}
                <div className="rounded-3xl p-8 ring-1 ring-emerald-600/50 xl:p-10 bg-slate-50 dark:bg-slate-800/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg transform rotate-0 shadow-sm">
                        POPULAR
                    </div>
                    <h3 className="text-lg font-semibold leading-8 text-emerald-600 dark:text-emerald-400">Pro Algority</h3>
                    <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">Unlock full AI coaching potential.</p>
                    <p className="mt-6 flex items-baseline gap-x-1">
                        <span className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">$19</span>
                        <span className="text-sm font-semibold leading-6 text-slate-600 dark:text-slate-400">/month</span>
                    </p>
                    <button className="mt-6 block w-full rounded-md bg-emerald-600 px-3 py-2 text-center text-sm font-semibold leading-6 text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
                        Get Started
                    </button>
                    <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                        {['All Problem Sets (NeetCode 150+)', 'Real-time AI Inteviewer', 'Mock Interviews', 'Detailed Feedback & Analysis', 'Priority Support'].map((feature) => (
                            <li key={feature} className="flex gap-x-3">
                                <Zap className="h-6 w-5 flex-none text-emerald-600" aria-hidden="true" />
                                {feature}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    )
}
