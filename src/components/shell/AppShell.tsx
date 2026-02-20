'use client'

import { useState } from 'react'
import { LogIn } from 'lucide-react'
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from '../ui/sidebar'
import { type NavigationItem } from './MainNav'
import { UserMenu, type User } from './UserMenu'
import { ThemeToggle } from '../ThemeToggle'
import { DiscordButton } from './DiscordButton'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image';
import LogoImage from '../../assets/logoimage.svg';
import LogoLight from '../../assets/logo_light.svg';
import LogoDark from '../../assets/logo_dark.svg';

interface AppShellProps {
  children: React.ReactNode
  navigationItems: NavigationItem[]
  user?: User
  onLogout?: () => void
  onSignIn?: () => void
  isLoading?: boolean
}

export function AppShell({
  children,
  navigationItems,
  user,
  onLogout,
  onSignIn,
  isLoading,
}: AppShellProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex h-screen bg-white dark:bg-slate-950 overflow-hidden">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            <Logo />
            <div className="mt-8 flex flex-col gap-2">
              {navigationItems.map((item, idx) => {
                const Icon = item.icon
                return (
                  <SidebarLink
                    key={idx}
                    link={{
                      label: item.label,
                      href: item.href,
                      icon: <Icon className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />,
                    }}
                  />
                )
              })}
            </div>
          </div>
          <div>
            <SidebarUserMenu
              user={user}
              isLoading={isLoading}
              onLogout={onLogout}
              onSignIn={onSignIn}
            />
          </div>
        </SidebarBody>
      </Sidebar>
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Desktop header with theme toggle */}
        <header className="hidden h-14 items-center justify-end border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-950 lg:flex">
          <ThemeToggle />
        </header>

        {/* Mobile header theme toggle (sidebar handles menu) */}
        <header className="flex h-14 items-center justify-end border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-950 lg:hidden">
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
      <DiscordButton />
    </div>
  )
}

function Logo() {
  const { open } = useSidebar()
  return (
    <Link
      href="/"
      className="font-normal justify-center flex space-x-2 flex-shrink-0 items-center text-sm text-black py-1 relative z-20"
    >

      <Image src={LogoDark} alt="AlgoRity" width={50} height={50} className="w-auto h-7 flex-shrink-0 text-white dark:text-white" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium text-black dark:text-white whitespace-pre truncate"
      >
        Algority
      </motion.span>
    </Link>
  )
}

function SidebarUserMenu({
  user,
  isLoading,
  onLogout,
  onSignIn
}: {
  user?: User
  isLoading?: boolean
  onLogout?: () => void
  onSignIn?: () => void
}) {
  const { open } = useSidebar()

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-2">
        <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
        {open && <div className="h-4 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />}
      </div>
    )
  }

  if (user) {
    return <UserMenu user={user} isCollapsed={!open} onLogout={onLogout} />
  }

  return (
    <button
      onClick={onSignIn}
      className={`
        flex w-full items-center rounded-lg p-2 text-left transition-colors
        text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/50
        ${!open ? 'justify-center' : 'gap-2'}
      `}
    >
      <LogIn className="h-5 w-5 flex-shrink-0" />
      {open && <span className="font-medium">Sign In</span>}
    </button>
  )
}
