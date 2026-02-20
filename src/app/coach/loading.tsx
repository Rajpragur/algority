import { LayoutDashboard } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-8 bg-transparent">
      <div className="relative">
        <div className="absolute -inset-8 animate-pulse rounded-full bg-emerald-500/10 blur-2xl" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-neutral-800 bg-neutral-900/50 shadow-2xl backdrop-blur-sm">
          <LayoutDashboard className="h-10 w-10 animate-pulse text-emerald-400" />
        </div>
      </div>
      <div className="flex flex-col items-center space-y-3">
        <div className="h-6 w-48 animate-pulse rounded-lg bg-neutral-800" />
        <div className="h-4 w-32 animate-pulse rounded-lg bg-neutral-800/50" />
      </div>
    </div>
  )
}
