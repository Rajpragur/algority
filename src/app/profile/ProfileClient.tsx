'use client'

import React, { useState } from 'react'
import {
    IconUser,
    IconBrandGithub,
    IconSchool,
    IconTrophy,
    IconChartBar,
    IconCode,
    IconEdit,
    IconCheck,
    IconX,
    IconActivity,
    IconCrown
} from '@tabler/icons-react'
import { toast } from 'sonner'
import { updateProfile } from './actions'
import type { UserProfile, UserStats } from '@/lib/types'
import Image from 'next/image'
import { cn } from '@/lib/utils'

// Mock university list for dropdown
const KNOWN_UNIVERSITIES = [
    "Massachusetts Institute of Technology",
    "Stanford University",
    "Carnegie Mellon University",
    "University of California, Berkeley",
    "Harvard University",
    "Princeton University",
    "University of Toronto",
    "University of Waterloo",
    "Indian Institute of Technology Bombay",
    "Indian Institute of Technology Delhi",
    "Tsinghua University",
    "National University of Singapore",
    "ETH Zurich",
    "University of Oxford",
    "University of Cambridge",
]

interface ProfileClientProps {
    initialProfile: UserProfile
    initialStats: UserStats
    initialLeaderboard: UserProfile[]
}

export function ProfileClient({ initialProfile, initialStats, initialLeaderboard }: ProfileClientProps) {
    const [profile, setProfile] = useState<UserProfile>(initialProfile)
    const [stats] = useState<UserStats>(initialStats)
    const [leaderboard] = useState<UserProfile[]>(initialLeaderboard)
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState<Partial<UserProfile>>({})
    const [universitySearch, setUniversitySearch] = useState('')
    const [showUniDropdown, setShowUniDropdown] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Initialize edit form when starting edit
    const startEditing = () => {
        setEditForm({
            fullName: profile.fullName,
            college: profile.college,
            bio: profile.bio,
            githubUrl: profile.githubUrl
        })
        setUniversitySearch(profile.college || '')
        setIsEditing(true)
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            // Use current search value as college if selected
            const dataToSave = { ...editForm, college: universitySearch }
            await updateProfile(profile.id, dataToSave)
            setProfile(prev => ({ ...prev, ...dataToSave }))
            setIsEditing(false)
            toast.success('Profile updated successfully')
        } catch (e) {
            toast.error('Failed to update profile')
        } finally {
            setIsSaving(false)
        }
    }

    const handleCancel = () => {
        setIsEditing(false)
    }

    const filteredUniversities = KNOWN_UNIVERSITIES.filter(u =>
        u.toLowerCase().includes(universitySearch.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-black pb-20 font-outfit">
            {/* Hero Background - Full Width, Centered Focus */}
            <div className="min-h-[45vh] pb-20 w-full bg-white dark:bg-black relative flex items-center justify-center overflow-hidden border-b border-neutral-200 dark:border-neutral-800">
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                    backgroundSize: '32px 32px'
                }}></div>

                {/* Top Right Edit Controls */}
                <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
                    {isEditing ? (
                        <>
                            {/* Dummy functionality for Cover Image as per UI request */}
                            <button
                                type="button"
                                className="px-4 py-2 bg-white/10 backdrop-blur-md text-neutral-900 dark:text-white rounded-full text-xs font-medium hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors border border-neutral-200/20 shadow-sm"
                                onClick={() => toast.info('Cover image customization coming soon!')}
                            >
                                Change Cover
                            </button>
                            <button onClick={handleCancel} className="px-4 py-2 bg-neutral-200/80 dark:bg-neutral-800/80 backdrop-blur-md text-neutral-900 dark:text-white rounded-full text-xs font-medium hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-emerald-600 text-white rounded-full text-xs font-medium hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={startEditing}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-black/50 backdrop-blur-md text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-black hover:text-neutral-900 dark:hover:text-white transition-all text-xs font-medium border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm"
                        >
                            <IconEdit className="h-3 w-3" />
                            <span>Edit Profile</span>
                        </button>
                    )}
                </div>

                {/* Centered Profile Header Content */}
                <div className="z-10 text-center flex flex-col items-center max-w-2xl mx-auto px-4 mt-8">
                    <div className="relative mb-6 group">
                        <div className="h-32 w-32 md:h-40 md:w-40 rounded-full p-1 bg-white dark:bg-black ring-1 ring-neutral-200 dark:ring-neutral-800 shadow-xl mx-auto overflow-hidden transition-transform duration-500 group-hover:scale-105">
                            {profile.avatarUrl ? (
                                <Image
                                    src={profile.avatarUrl}
                                    alt={profile.fullName || 'User'}
                                    width={160}
                                    height={160}
                                    className={cn(
                                        "h-full w-full object-cover rounded-full transition-all duration-500",
                                        isEditing ? "brightness-50 grayscale" : "grayscale hover:grayscale-0"
                                    )}
                                />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 text-neutral-400 dark:text-neutral-600 rounded-full">
                                    <IconUser className="h-16 w-16 stroke-1" />
                                </div>
                            )}

                            {/* Avatar Overlay for Editing */}
                            {isEditing && (
                                <div
                                    className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer z-20 group-hover:scale-105 transition-transform duration-500"
                                    onClick={() => toast.info('Avatar upload coming soon!')}
                                >
                                    <div className="bg-black/40 p-3 rounded-full backdrop-blur-md border border-white/20 mb-2 hover:bg-black/60 transition-colors">
                                        <IconEdit className="h-5 w-5 text-white stroke-1" />
                                    </div>
                                    <span className="text-[10px] uppercase tracking-widest text-white font-bold drop-shadow-md">Change</span>
                                </div>
                            )}
                        </div>
                        {!isEditing && (
                            <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 h-6 w-6 bg-emerald-500 rounded-full border-[3px] border-white dark:border-black shadow-lg"></div>
                        )}
                    </div>

                    <div className="space-y-4 w-full max-w-lg">
                        {isEditing ? (
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    value={editForm.fullName || ''}
                                    onChange={e => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                                    className="block w-full text-center bg-transparent border-b border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:border-emerald-500 focus:ring-0 text-3xl md:text-4xl font-syne font-bold uppercase tracking-tight px-2 py-2 transition-colors placeholder:text-neutral-300 dark:placeholder:text-neutral-700 focus:outline-none"
                                    placeholder="Your Name"
                                />
                                <div className="relative">
                                    <textarea
                                        value={editForm.bio || ''}
                                        onChange={e => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                                        rows={2}
                                        className="block w-full text-center bg-transparent border-b border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 focus:border-emerald-500 focus:ring-0 text-lg font-light px-2 py-2 resize-none transition-colors placeholder:text-neutral-300 dark:placeholder:text-neutral-700 focus:outline-none"
                                        placeholder="Write a short bio..."
                                    />
                                    <div className="absolute right-0 bottom-2 text-[10px] text-neutral-400">
                                        {(editForm.bio?.length || 0)}/160
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h1 className="text-3xl md:text-5xl font-syne font-bold uppercase tracking-tight text-neutral-900 dark:text-white">
                                    {profile.fullName}
                                </h1>
                                <p className="premium-text text-lg md:text-xl font-light text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto leading-relaxed mt-2">
                                    {profile.bio || 'Crafting code & conquering algorithms.'}
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">

                {/* Stats Row - Compact */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white dark:bg-neutral-900/40 backdrop-blur-xl rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col items-center justify-center text-center hover:border-emerald-500/30 transition-all duration-300">
                        <h3 className="text-[10px] font-syne font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-500 mb-2">Global Rank</h3>
                        <span className="text-3xl font-syne font-bold tracking-tight text-emerald-600 dark:text-emerald-400">#{profile.rank.toLocaleString()}</span>
                    </div>

                    <div className="bg-white dark:bg-neutral-900/40 backdrop-blur-xl rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col items-center justify-center text-center hover:border-emerald-500/30 transition-all duration-300">
                        <h3 className="text-[10px] font-syne font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-500 mb-2">Solved</h3>
                        <span className="text-3xl font-syne font-bold tracking-tight text-emerald-600 dark:text-emerald-400">{profile.totalSolved}</span>
                    </div>

                    <div className="bg-white dark:bg-neutral-900/40 backdrop-blur-xl rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col items-center justify-center text-center hover:border-emerald-500/30 transition-all duration-300">
                        <h3 className="text-[10px] font-syne font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-500 mb-2">Affiliation</h3>
                        {isEditing ? (
                            <div className="relative w-full max-w-[180px]">
                                <input
                                    type="text"
                                    value={universitySearch}
                                    onChange={e => {
                                        setUniversitySearch(e.target.value)
                                        setShowUniDropdown(true)
                                    }}
                                    onFocus={() => setShowUniDropdown(true)}
                                    className="block w-full text-center rounded-md border-neutral-200 dark:border-neutral-700 bg-transparent text-sm font-normal px-2 py-1 focus:outline-none focus:border-emerald-500"
                                    placeholder="University"
                                />
                                {showUniDropdown && (
                                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                        {filteredUniversities.map((uni, idx) => (
                                            <div
                                                key={idx}
                                                className="px-3 py-2 text-xs text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer"
                                                onClick={() => {
                                                    setUniversitySearch(uni)
                                                    setShowUniDropdown(false)
                                                }}
                                            >
                                                {uni}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {showUniDropdown && (
                                    <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowUniDropdown(false)} />
                                )}
                            </div>
                        ) : (
                            <span className="text-lg font-light tracking-tight text-neutral-900 dark:text-white truncate max-w-full px-2">
                                {profile.college || 'Unspecified'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column: Difficulty Breadwon (Stacked) & Recent Activity */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium text-neutral-900 dark:text-white flex items-center gap-2">
                                    <IconChartBar className="h-4 w-4 text-emerald-500" />
                                    Skill Breakdown
                                </h3>
                                <span className="text-xs text-neutral-500">{profile.totalSolved} Total</span>
                            </div>

                            {/* Horizontal Stacked Bar */}
                            <div className="h-4 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden flex">
                                {stats.easySolved > 0 && (
                                    <div style={{ width: `${(stats.easySolved / Math.max(profile.totalSolved, 1)) * 100}%` }} className="bg-emerald-500 h-full" title={`Easy: ${stats.easySolved}`} />
                                )}
                                {stats.mediumSolved > 0 && (
                                    <div style={{ width: `${(stats.mediumSolved / Math.max(profile.totalSolved, 1)) * 100}%` }} className="bg-amber-500 h-full" title={`Medium: ${stats.mediumSolved}`} />
                                )}
                                {stats.hardSolved > 0 && (
                                    <div style={{ width: `${(stats.hardSolved / Math.max(profile.totalSolved, 1)) * 100}%` }} className="bg-rose-500 h-full" title={`Hard: ${stats.hardSolved}`} />
                                )}
                            </div>

                            {/* Legend */}
                            <div className="flex justify-between mt-3 text-xs">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    <span className="text-neutral-600 dark:text-neutral-400">Easy <span className="font-semibold text-neutral-900 dark:text-white ml-0.5">{stats.easySolved}</span></span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                    <span className="text-neutral-600 dark:text-neutral-400">Medium <span className="font-semibold text-neutral-900 dark:text-white ml-0.5">{stats.mediumSolved}</span></span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                    <span className="text-neutral-600 dark:text-neutral-400">Hard <span className="font-semibold text-neutral-900 dark:text-white ml-0.5">{stats.hardSolved}</span></span>
                                </div>
                            </div>
                        </div>

                        {/* Recent History */}
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                            <h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                                <IconActivity className="h-4 w-4 text-emerald-500" />
                                Recent Activity
                            </h3>
                            <div className="space-y-4">
                                {stats.recentSubmissions.slice(0, 5).map((sub, idx) => (
                                    <div key={idx} className="flex items-center gap-3 group">
                                        <div className={cn(
                                            "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                                            sub.status === 'Solved'
                                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-500"
                                                : "bg-neutral-50 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                                        )}>
                                            {sub.status === 'Solved' ? <IconCheck className="h-4 w-4 stroke-2" /> : <IconActivity className="h-4 w-4 stroke-2" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium text-neutral-900 dark:text-white truncate group-hover:text-emerald-500 transition-colors">
                                                {sub.title}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={cn(
                                                    "text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold",
                                                    sub.difficulty === 'Easy' ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" :
                                                        sub.difficulty === 'Medium' ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" :
                                                            "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400"
                                                )}>
                                                    {sub.difficulty}
                                                </span>
                                                <span className="text-[10px] text-neutral-400">{new Date(sub.submittedAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {stats.recentSubmissions.length === 0 && (
                                    <p className="text-neutral-500 italic text-xs">No activity recorded yet.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Middle Column: Study Plans */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm h-full">
                            <h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                                <IconSchool className="h-4 w-4 text-emerald-500" />
                                Study Paths
                            </h3>
                            <div className="space-y-5">
                                {stats.problemSetStats.map(set => (
                                    <div key={set.setId} className="group cursor-pointer">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                                {set.setName}
                                            </span>
                                            <span className="text-xs font-mono text-neutral-400">
                                                {set.solved} / {set.total}
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 relative"
                                                style={{ width: `${(set.solved / Math.max(set.total, 1)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Leaderboard */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                            <h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                                <IconCrown className="h-4 w-4 text-amber-500" />
                                Top Performers
                            </h3>
                            <div className="space-y-3">
                                {leaderboard.map((user) => (
                                    <div key={user.id} className={cn(
                                        "flex items-center gap-3 p-2 rounded-xl transition-all",
                                        user.id === profile.id ? "bg-neutral-100 dark:bg-neutral-800/50 ring-1 ring-emerald-500/20" : "hover:bg-neutral-50 dark:hover:bg-neutral-800/30"
                                    )}>
                                        <div className="w-6 text-center font-mono font-bold text-neutral-400 text-xs">
                                            {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : user.rank === 3 ? '🥉' : `#${user.rank}`}
                                        </div>
                                        <div className="h-8 w-8 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden ring-1 ring-neutral-200 dark:ring-neutral-700 flex items-center justify-center flex-shrink-0">
                                            {user.avatarUrl ? (
                                                <Image
                                                    src={user.avatarUrl}
                                                    width={32} height={32}
                                                    alt={user.fullName || 'User'}
                                                    className="object-cover h-full w-full"
                                                />
                                            ) : (
                                                <IconUser className="h-4 w-4 text-neutral-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                                                {user.fullName}
                                            </div>
                                            <div className="text-[10px] text-neutral-500 dark:text-neutral-500 font-medium">
                                                {user.totalSolved} problems solved
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    )
}
