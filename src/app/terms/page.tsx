import Link from 'next/link'
import { IconArrowLeft } from '@tabler/icons-react'

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-black font-outfit pb-20">
            <div className="bg-white dark:bg-neutral-900/40 border-b border-neutral-200 dark:border-neutral-800/80 py-12 px-6 sm:px-8 relative">
                <div className="mx-auto max-w-4xl relative z-10 flex flex-col items-start text-left">
                    <Link href="/" className="flex items-center gap-2 text-sm font-syne font-bold uppercase tracking-widest text-neutral-500 hover:text-emerald-500 transition-colors mb-8">
                        <IconArrowLeft className="h-4 w-4" /> Back Home
                    </Link>
                    <h1 className="text-4xl font-syne font-bold uppercase tracking-tight text-neutral-900 dark:text-white mb-4">
                        Terms of Service
                    </h1>
                    <p className="text-neutral-500 text-sm font-syne font-bold uppercase tracking-widest">Last Updated: February 20, 2026</p>
                </div>
            </div>

            <div className="mx-auto max-w-4xl px-6 py-12 text-neutral-600 dark:text-neutral-400 font-light leading-relaxed space-y-8">
                <section>
                    <p className="text-lg">By accessing Algority, you agree to comply with and be bound by the following terms and conditions of use.</p>
                </section>

                <section>
                    <h2 className="text-xl font-syne font-bold uppercase text-neutral-900 dark:text-white mb-4 tracking-tight">1. Use of Service</h2>
                    <p>Algority provides an AI-powered coaching environment for technical interview preparation. Users are expected to use the platform for legitimate educational purposes. Any attempt to scrape content, bypass security measures, or use the platform for commercial redistribution is strictly prohibited.</p>
                </section>

                <section>
                    <h2 className="text-xl font-syne font-bold uppercase text-neutral-900 dark:text-white mb-4 tracking-tight">2. AI Character & Accuracy</h2>
                    <p>Our coaching models (Socratic Coach) utilize advanced artificial intelligence. While we strive for accuracy, AI responses may occasionally contain errors or hallucinations. Algority is a learning aid and should not be the sole source of truth for critical technical implementations.</p>
                </section>

                <section>
                    <h2 className="text-xl font-syne font-bold uppercase text-neutral-900 dark:text-white mb-4 tracking-tight">3. User Conduct</h2>
                    <p>Users must not use the service to generate harmful, offensive, or infringing content. We reserve the right to terminate accounts that violate these guidelines or engage in abusive behavior toward the platform or its community.</p>
                </section>

                <section>
                    <h2 className="text-xl font-syne font-bold uppercase text-neutral-900 dark:text-white mb-4 tracking-tight">4. Intellectual Property</h2>
                    <p>All content, including the coaching logic, problem sets, and site architecture, is the intellectual property of Algority. You may not reproduce or distribute any part of the service without explicit permission.</p>
                </section>

                <section>
                    <h2 className="text-xl font-syne font-bold uppercase text-neutral-900 dark:text-white mb-4 tracking-tight">5. Disclaimer of Warranties</h2>
                    <p>The service is provided "as is" without any warranties, express or implied. Algority does not guarantee employment outcomes or successful interview results through the use of the platform.</p>
                </section>

                <div className="pt-12 border-t border-neutral-200 dark:border-neutral-800 text-center">
                    <p className="text-xs text-neutral-500 uppercase font-syne font-bold tracking-[0.3em]">© 2026 Algority. All rights reserved.</p>
                </div>
            </div>
        </div>
    )
}
