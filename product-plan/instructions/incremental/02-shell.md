# Milestone 2: Application Shell

Build the persistent navigation shell that wraps all sections.

## Overview

CodeBoss uses a collapsible sidebar navigation pattern. The sidebar provides access to all core sections plus settings, and can collapse to icon-only mode to maximize workspace.

## Navigation Structure

- **Problem Workspace** - Default home view (icon: LayoutGrid)
- **Socratic Coach** - AI coaching interface (icon: MessageSquare)
- **Code Editor** - Write and test code (icon: Code2)
- **Progress Dashboard** - Track mastery (icon: BarChart3)
- --- (separator)
- **Settings** - User preferences (icon: Settings)

## Components to Build

### 2.1 AppShell

Main wrapper component that provides:
- Collapsible sidebar on the left
- Main content area on the right
- Mobile hamburger menu overlay

**Props:**
```typescript
interface AppShellProps {
  children: React.ReactNode
  navigationItems: NavigationItem[]
  user?: User
  onNavigate?: (href: string) => void
  onLogout?: () => void
}
```

### 2.2 MainNav

Sidebar navigation component:
- Renders navigation items with icons
- Shows labels when expanded, icons-only when collapsed
- Active state uses emerald-500 background with white text
- Hover states use slate-100 (light) / slate-800 (dark)

**Props:**
```typescript
interface NavigationItem {
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
```

### 2.3 UserMenu

User profile dropdown at bottom of sidebar:
- Shows avatar (or initials fallback) and name
- Logout action
- When collapsed, shows avatar only with dropdown on click

**Props:**
```typescript
interface User {
  name: string
  email?: string
  avatarUrl?: string
}

interface UserMenuProps {
  user: User
  isCollapsed: boolean
  onLogout?: () => void
}
```

## Layout Specifications

- Sidebar width (expanded): 240px
- Sidebar width (collapsed): 64px
- Toggle button at bottom of sidebar

## Responsive Behavior

- **Desktop (lg+):** Full sidebar, collapsible via toggle button
- **Tablet (md):** Collapsed by default, expandable
- **Mobile (< md):** Hidden by default, hamburger menu opens sidebar as overlay

## Design Notes

- Sidebar background: slate-50 (light) / slate-900 (dark)
- Border between sidebar and content: slate-200 (light) / slate-800 (dark)
- Logo: "CodeBoss" with "Boss" in emerald-600

## Acceptance Criteria

- [ ] Sidebar collapses and expands smoothly
- [ ] Navigation items highlight correctly when active
- [ ] User menu dropdown works
- [ ] Mobile overlay menu works
- [ ] Dark mode styling is correct
- [ ] All navigation routes work
