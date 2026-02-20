import { useState, useRef, useEffect } from 'react'
import { LogOut, ChevronUp } from 'lucide-react'

export interface User {
  name: string
  email?: string
  avatarUrl?: string
}

interface UserMenuProps {
  user: User
  isCollapsed: boolean
  onLogout?: () => void
}

export function UserMenu({ user, isCollapsed, onLogout }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex w-full items-center rounded-lg p-2 text-left transition-colors
          hover:bg-slate-100 dark:hover:bg-slate-800
          ${isCollapsed ? 'justify-center' : 'justify-between'}
        `}
      >
        <div className={`flex items-center ${isCollapsed ? '' : 'min-w-0 flex-1'}`}>
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="h-8 w-8 flex-shrink-0 rounded-full"
            />
          ) : (
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-medium text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
              {initials}
            </div>
          )}
          {!isCollapsed && (
            <div className="ml-3 min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                {user.name}
              </p>
              {user.email && (
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {user.email}
                </p>
              )}
            </div>
          )}
        </div>
        {!isCollapsed && (
          <ChevronUp
            className={`h-4 w-4 flex-shrink-0 text-slate-400 transition-transform ${isOpen ? '' : 'rotate-180'}`}
          />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={`
            absolute bottom-full z-50 mb-2 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg
            dark:border-slate-700 dark:bg-slate-800
            ${isCollapsed ? 'left-full ml-2' : 'left-0'}
          `}
        >
          <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-900 dark:text-white">{user.name}</p>
            {user.email && (
              <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
            )}
          </div>
          <button
            onClick={() => {
              setIsOpen(false)
              onLogout?.()
            }}
            className="flex w-full items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
