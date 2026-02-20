interface StatCardProps {
  label: string
  value: number
  subtext: string
  type: 'count' | 'percentage' | 'streak'
}

export function StatCard({ label, value, subtext, type }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
        {label}
      </p>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          {value}
        </span>
        {type === 'percentage' && (
          <span className="text-lg font-semibold text-slate-400 dark:text-slate-500">%</span>
        )}
        {type === 'streak' && (
          <span className="text-lg">🔥</span>
        )}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        {subtext}
      </p>
    </div>
  )
}
