'use client'

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
          flex w-full items-center rounded-xl p-2.5 text-left transition-all duration-200
          hover:bg-neutral-100 dark:hover:bg-neutral-900
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
            <div className="flex flex-col items-center justify-center h-8 w-8 flex-shrink-0 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-syne font-bold text-emerald-500 dark:text-emerald-400">
              {initials}
            </div>
          )}
          {!isCollapsed && (
            <div className="ml-3 min-w-0 flex-1">
              <p className="truncate text-sm font-syne font-bold uppercase tracking-tight text-neutral-900 dark:text-white leading-none mb-1">
                {user.name}
              </p>
              {user.email && (
                <p className="truncate text-[10px] font-medium text-neutral-500 dark:text-neutral-400 leading-none">
                  {user.email}
                </p>
              )}
            </div>
          )}
        </div>
        {!isCollapsed && (
          <ChevronUp
            className={`h-4 w-4 flex-shrink-0 text-neutral-400 transition-transform ${isOpen ? '' : 'rotate-180'
              }`}
          />
        )}
      </button>

      {isOpen && (
        <div
          className={`
            absolute bottom-full z-50 mb-2 w-[calc(100%-1rem)] rounded-xl border border-neutral-200 bg-white py-1 shadow-2xl shadow-black/10 origin-bottom right-2
            dark:border-neutral-800 dark:bg-neutral-900
            ${isCollapsed ? 'left-full ml-2 w-48' : 'left-2'}
          `}
        >
          <div className="border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
            <p className="text-xs font-syne font-bold uppercase tracking-wider text-neutral-900 dark:text-white mb-0.5">{user.name}</p>
            {user.email && (
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">{user.email}</p>
            )}
          </div>
          <div className="p-1">
            <button
              onClick={() => {
                setIsOpen(false)
                onLogout?.()
              }}
              className="flex w-full items-center rounded-lg px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 hover:text-rose-600 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-rose-400 transition-colors"
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
