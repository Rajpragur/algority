'use client'

import {
  IconLayoutDashboard,
  IconRobot,
  IconTerminal2,
  IconUser,
  IconActivity,
  IconDiamond,
  IconSettings
} from '@tabler/icons-react'
import { toast } from 'sonner'
import { AppShell } from './AppShell'
import type { NavigationItem } from './MainNav'
import type { User } from './UserMenu'
import { useAuth } from '@/components/auth'

const navigationItems: NavigationItem[] = [
  { label: 'Workspace', href: '/problems', icon: IconLayoutDashboard },
  { label: 'Coach', href: '/coach', icon: IconRobot },
  { label: 'Editor', href: '/editor', icon: IconTerminal2 },
  { label: 'Progress', href: '/progress', icon: IconActivity },
  { label: 'Profile', href: '/profile', icon: IconUser },
]

interface ShellWrapperProps {
  children: React.ReactNode
}

export function ShellWrapper({ children }: ShellWrapperProps) {
  const { user, isLoading, signOut, openAuthModal } = useAuth()

  const handleLogout = async () => {
    await signOut()
    toast.success('Signed out')
  }

  // Convert Supabase user to UserMenu's User type
  const shellUser: User | undefined = user
    ? {
      name: user.user_metadata?.full_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
      email: user.email,
      avatarUrl: user.user_metadata?.avatar_url,
    }
    : undefined

  return (
    <AppShell
      navigationItems={navigationItems}
      user={shellUser}
      onLogout={handleLogout}
      onSignIn={() => openAuthModal('login')}
      isLoading={isLoading}
    >
      {children}
    </AppShell>
  )
}
