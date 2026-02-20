'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavigationItem {
  label: string
  href: string
  icon: React.ElementType | LucideIcon
}

interface MainNavProps {
  items: NavigationItem[]
  isCollapsed: boolean
  onNavigate?: () => void
}

export function MainNav({ items, isCollapsed, onNavigate }: MainNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // Don't intercept if already on this route
    if (isActive(href)) return

    e.preventDefault()
    onNavigate?.()
    setPendingHref(href)

    startTransition(() => {
      router.push(href)
    })
  }

  return (
    <nav className="space-y-1 px-2">
      {items.map((item) => {
        const Icon = item.icon
        const active = isActive(item.href)
        const isNavigating = isPending && pendingHref === item.href

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={(e) => handleClick(e, item.href)}
            className={`
              group flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors
              ${isCollapsed ? 'justify-center' : 'justify-start'}
              ${active
                ? 'bg-emerald-500 text-white dark:bg-emerald-600'
                : isNavigating
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }
            `}
            title={isCollapsed ? item.label : undefined}
          >
            {isNavigating ? (
              <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Icon
                className={`h-5 w-5 flex-shrink-0 ${active
                    ? ''
                    : 'text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200'
                  }`}
              />
            )}
            {!isCollapsed && <span className="ml-3">{item.label}</span>}
          </Link>
        )
      })}
    </nav>
  )
}
