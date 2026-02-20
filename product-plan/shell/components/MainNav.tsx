import type { LucideIcon } from 'lucide-react'

export interface NavigationItem {
  label: string
  href: string
  icon: LucideIcon
  isActive?: boolean
}

interface MainNavProps {
  items: NavigationItem[]
  isCollapsed: boolean
  onNavigate?: (href: string) => void
}

export function MainNav({ items, isCollapsed, onNavigate }: MainNavProps) {
  return (
    <nav className="space-y-1 px-2">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <button
            key={item.href}
            onClick={() => onNavigate?.(item.href)}
            className={`
              group flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors
              ${isCollapsed ? 'justify-center' : 'justify-start'}
              ${
                item.isActive
                  ? 'bg-emerald-500 text-white dark:bg-emerald-600'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }
            `}
            title={isCollapsed ? item.label : undefined}
          >
            <Icon className={`h-5 w-5 flex-shrink-0 ${item.isActive ? '' : 'text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200'}`} />
            {!isCollapsed && <span className="ml-3">{item.label}</span>}
          </button>
        )
      })}
    </nav>
  )
}
