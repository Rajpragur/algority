import { IconBrandGithub, IconBrandLinkedin, IconBrandTwitter, IconMail, IconArrowLeft, IconExternalLink } from '@tabler/icons-react'
import Image from 'next/image'
import Link from 'next/link'
import photo from '../../assets/photo.png'

export default function DevPage() {
    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-black font-outfit pb-20">
            {/* Header / Hero */}
            <div className="bg-white dark:bg-neutral-900/40 border-b border-neutral-200 dark:border-neutral-800/80 py-16 px-6 sm:px-8 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                    backgroundSize: '32px 32px'
                }}></div>
                <div className="mx-auto max-w-4xl relative z-10 flex flex-col items-center text-center">
                    <Link href="/" className="absolute left-0 top-0 hidden md:flex items-center gap-2 text-sm font-syne font-bold uppercase tracking-widest text-neutral-500 hover:text-emerald-500 transition-colors">
                        <IconArrowLeft className="h-4 w-4" /> Back Home
                    </Link>

                    <div className="h-32 w-32 md:h-40 md:w-40 rounded-full bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 shadow-2xl mx-auto overflow-hidden mb-8 relative group">
                        <Image
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            src={photo}
                            alt="Raj Pratap Singh Gurjar"
                            fill
                            priority
                            sizes="(max-width: 768px) 128px, 160px"
                        />
                    </div>

                    <h1 className="text-4xl md:text-5xl font-syne font-bold uppercase tracking-tight text-neutral-900 dark:text-white mb-2">
                        Raj Pratap Singh Gurjar
                    </h1>
                    <p className="text-emerald-600 dark:text-emerald-400 font-syne font-bold tracking-[0.3em] uppercase text-xs mb-8">
                        Math+CS Student
                    </p>

                    <p className="premium-text text-neutral-600 dark:text-neutral-400 font-light tracking-wide leading-relaxed text-lg max-w-2xl mx-auto">
                        Passionate about building AI-native tools that transform how we learn and engineer.
                        Creator of Algority, a Socratic coaching platform for deeper technical comprehension.
                    </p>
                </div>
            </div>

            <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Contact Links */}
                <div className="md:col-span-1 space-y-4">
                    <h3 className="text-[10px] font-syne font-bold uppercase tracking-[0.2em] text-neutral-500 mb-6">Connect</h3>

                    <a href="https://rajpragur.in/" className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500/50 transition-all group">
                        <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                            <IconExternalLink className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-syne font-bold uppercase tracking-widest text-neutral-500">Personal Website</span>
                            <span className="text-sm text-neutral-900 dark:text-white">rajpragur.in</span>
                        </div>
                    </a>

                    <a href="mailto:rajpragur@gmail.com" className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500/50 transition-all group">
                        <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                            <IconMail className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-syne font-bold uppercase tracking-widest text-neutral-500">Email</span>
                            <span className="text-sm text-neutral-900 dark:text-white">rajpragur@gmail.com</span>
                        </div>
                    </a>

                    <a href="https://github.com/rajpragur" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500/50 transition-all group">
                        <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                            <IconBrandGithub className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-syne font-bold uppercase tracking-widest text-neutral-500">GitHub</span>
                            <span className="text-sm text-neutral-900 dark:text-white">@rajpragur</span>
                        </div>
                    </a>

                    <a href="https://www.linkedin.com/in/rajpragur" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500/50 transition-all group">
                        <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                            <IconBrandLinkedin className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-syne font-bold uppercase tracking-widest text-neutral-500">LinkedIn</span>
                            <span className="text-sm text-neutral-900 dark:text-white">in/rajpragur</span>
                        </div>
                    </a>
                </div>

                {/* About Content */}
                <div className="md:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-neutral-900/40 rounded-3xl p-8 shadow-sm border border-neutral-200 dark:border-neutral-800/80 backdrop-blur-sm">
                        <h2 className="text-xl font-syne font-bold uppercase tracking-tight text-neutral-900 dark:text-white mb-6">
                            The Mission
                        </h2>
                        <div className="space-y-4 text-neutral-600 dark:text-neutral-400 font-light leading-relaxed">
                            <p>
                                Algority was born from a frustration with traditional LeetCode prep. Rote memorization of solutions doesn't prepare you for the variables of a real interview.
                            </p>
                            <p>
                                This platform uses architectural patterns and Socratic methods to force active recall and deep logic verification. My goal is to bridge the gap between "knowing the answer" and "engineering the solution".
                            </p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-900/40 rounded-3xl p-8 shadow-sm border border-neutral-200 dark:border-neutral-800/80 backdrop-blur-sm">
                        <h2 className="text-xl font-syne font-bold uppercase tracking-tight text-neutral-900 dark:text-white mb-6">
                            Technical Stack
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {['Next.js 15', 'React 19', 'Deep Learning', 'Pytorch', 'Langchain', 'Supabase', 'TailwindCSS', 'Framer Motion', 'LLMs', 'Redis'].map(tech => (
                                <span key={tech} className="px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[10px] font-syne font-bold uppercase tracking-widest text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                                    {tech}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
