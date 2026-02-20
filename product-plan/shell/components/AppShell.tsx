import { useState } from 'react'
import { Menu } from 'lucide-react'
import { MainNav, type NavigationItem } from './MainNav'
import { UserMenu, type User } from './UserMenu'

interface AppShellProps {
  children: React.ReactNode
  navigationItems: NavigationItem[]
  user?: User
  onNavigate?: (href: string) => void
  onLogout?: () => void
}

export function AppShell({
  children,
  navigationItems,
  user,
  onNavigate,
  onLogout,
}: AppShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <div className="flex h-screen bg-white dark:bg-slate-950">
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-slate-50
          transition-all duration-200 dark:border-slate-800 dark:bg-slate-900
          lg:relative lg:translate-x-0
          ${isCollapsed ? 'w-16' : 'w-60'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className={`flex h-14 items-center border-b border-slate-200 dark:border-slate-800 ${isCollapsed ? 'justify-center px-2' : 'px-4'}`}>
          {isCollapsed ? (
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">CB</span>
          ) : (
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              Code<span className="text-emerald-600 dark:text-emerald-400">Boss</span>
            </span>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <MainNav
            items={navigationItems}
            isCollapsed={isCollapsed}
            onNavigate={(href) => {
              onNavigate?.(href)
              setIsMobileOpen(false)
            }}
          />
        </div>

        {/* User menu */}
        {user && (
          <div className="border-t border-slate-200 p-2 dark:border-slate-800">
            <UserMenu
              user={user}
              isCollapsed={isCollapsed}
              onLogout={onLogout}
            />
          </div>
        )}

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden border-t border-slate-200 p-3 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 lg:block"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className={`h-5 w-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex h-14 items-center border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-950 lg:hidden">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="ml-3 text-lg font-bold text-slate-900 dark:text-white">
            Code<span className="text-emerald-600 dark:text-emerald-400">Boss</span>
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
