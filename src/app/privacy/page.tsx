import Link from 'next/link'
import { IconArrowLeft } from '@tabler/icons-react'

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-black font-outfit pb-20">
            <div className="bg-white dark:bg-neutral-900/40 border-b border-neutral-200 dark:border-neutral-800/80 py-12 px-6 sm:px-8 relative">
                <div className="mx-auto max-w-4xl relative z-10 flex flex-col items-start text-left">
                    <Link href="/" className="flex items-center gap-2 text-sm font-syne font-bold uppercase tracking-widest text-neutral-500 hover:text-emerald-500 transition-colors mb-8">
                        <IconArrowLeft className="h-4 w-4" /> Back Home
                    </Link>
                    <h1 className="text-4xl font-syne font-bold uppercase tracking-tight text-neutral-900 dark:text-white mb-4">
                        Privacy Policy
                    </h1>
                    <p className="text-neutral-500 text-sm font-syne font-bold uppercase tracking-widest">Effective Date: February 20, 2026</p>
                </div>
            </div>

            <div className="mx-auto max-w-4xl px-6 py-12 text-neutral-600 dark:text-neutral-400 font-light leading-relaxed space-y-8">
                <section>
                    <p className="text-lg">Welcome to Algority. Your privacy is paramount. This policy outlines how we handle data within our Socratic coaching platform.</p>
                </section>

                <section>
                    <h2 className="text-xl font-syne font-bold uppercase text-neutral-900 dark:text-white mb-4 tracking-tight">1. Information We Collect</h2>
                    <p>We collect minimal personal information necessary to provide our services:</p>
                    <ul className="list-disc ml-6 mt-2 space-y-2">
                        <li><strong>Account Information:</strong> Name, email, and profile details provided via authentication providers (e.g., Google, GitHub).</li>
                        <li><strong>Usage Data:</strong> Performance metrics, solved problems, and coaching session history to personalize your learning experience.</li>
                        <li><strong>AI Interactions:</strong> Conversations with the Socratic coach are processed to generate educational feedback.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-syne font-bold uppercase text-neutral-900 dark:text-white mb-4 tracking-tight">2. How We Use Your Data</h2>
                    <p>Your data is used strictly for educational purposes:</p>
                    <ul className="list-disc ml-6 mt-2 space-y-2">
                        <li>To maintain your progress and leaderboard rankings.</li>
                        <li>To optimize the AI coaching models for better pedagogical outcomes.</li>
                        <li>To provide technical support and ensure platform security.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-syne font-bold uppercase text-neutral-900 dark:text-white mb-4 tracking-tight">3. Data Sharing</h2>
                    <p>We do not sell your personal data. Data may be shared with:</p>
                    <ul className="list-disc ml-6 mt-2 space-y-2">
                        <li><strong>Infrastructure Providers:</strong> Supabase (database/auth) and Upstash (caching).</li>
                        <li><strong>AI Providers:</strong> OpenRouter/Anthropic/Google/OpenAI (anonymized prompts for session generation).</li>
                    </ul>
                </section>

                <div className="pt-12 border-t border-neutral-200 dark:border-neutral-800 text-center">
                    <p className="text-xs text-neutral-500 uppercase font-syne font-bold tracking-[0.3em]">© 2026 Algority. All rights reserved.</p>
                </div>
            </div>
        </div>
    )
}
