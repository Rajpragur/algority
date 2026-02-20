# Component Inventory

> UI components catalog for Algority

## Overview

| Category | Count | Location |
|----------|-------|----------|
| Shell | 5 | `src/components/shell/` |
| Problem Workspace | 6 | `src/components/problem-workspace/` |
| Socratic Coach | 9 | `src/components/socratic-coach/` |
| Shared | 1 | `src/components/` |
| **Total** | **21** | |

---

## Shell Components

**Location:** `src/components/shell/`

### AppShell

Main application layout with collapsible sidebar.

| Property | Type | Description |
|----------|------|-------------|
| `children` | ReactNode | Page content |
| `navigationItems` | NavigationItem[] | Nav menu items |
| `user?` | User | Current user (optional) |
| `onLogout?` | () => void | Logout callback |

**Features:**
- Collapsible sidebar (desktop)
- Mobile drawer with overlay
- Dark mode support
- Responsive breakpoints

**File:** `AppShell.tsx` | **Type:** Client Component

---

### MainNav

Sidebar navigation menu.

| Property | Type | Description |
|----------|------|-------------|
| `items` | NavigationItem[] | Menu items with icons |
| `isCollapsed` | boolean | Collapsed state |
| `onNavigate` | () => void | Navigation callback |

**File:** `MainNav.tsx` | **Type:** Client Component

---

### UserMenu

User avatar and dropdown menu.

| Property | Type | Description |
|----------|------|-------------|
| `user` | User | User data (name, email, avatar) |
| `isCollapsed` | boolean | Sidebar collapsed state |
| `onLogout?` | () => void | Logout callback |

**File:** `UserMenu.tsx` | **Type:** Client Component

---

### ShellWrapper

Wraps pages with AppShell and provides navigation config.

| Property | Type | Description |
|----------|------|-------------|
| `children` | ReactNode | Page content |

**File:** `ShellWrapper.tsx` | **Type:** Client Component

---

### ThemeToggle

Dark/light mode toggle button.

| Property | Type | Description |
|----------|------|-------------|
| (none) | | Self-contained |

**File:** `ThemeToggle.tsx` (in `src/components/`) | **Type:** Client Component

---

## Problem Workspace Components

**Location:** `src/components/problem-workspace/`

### ProblemWorkspace

Main container for problem browsing with search and filters.

| Property | Type | Description |
|----------|------|-------------|
| `initialProblems` | Problem[] | Initial problem list |
| `patterns` | Pattern[] | Available patterns for filtering |
| `initialTotal` | number | Total problem count |

**File:** `ProblemWorkspace.tsx` | **Type:** Client Component

---

### ProblemCard

Individual problem card display.

| Property | Type | Description |
|----------|------|-------------|
| `problem` | Problem | Problem data |
| `patternMap` | Map<string, Pattern> | Pattern lookup |

**Features:**
- Difficulty badge (color-coded)
- Pattern tags
- Truncated description
- Link to coaching session

**File:** `ProblemCard.tsx` | **Type:** Server Component

---

### ProblemCardSkeleton

Loading placeholder for problem cards.

| Property | Type | Description |
|----------|------|-------------|
| (none) | | Static skeleton |

**File:** `ProblemCardSkeleton.tsx` | **Type:** Server Component

---

### SearchBar

Text search input with debouncing.

| Property | Type | Description |
|----------|------|-------------|
| `value` | string | Current search query |
| `onChange` | (value: string) => void | Change handler |
| `placeholder?` | string | Input placeholder |

**File:** `SearchBar.tsx` | **Type:** Client Component

---

### PatternFilter

Multi-select pattern filter chips.

| Property | Type | Description |
|----------|------|-------------|
| `patterns` | Pattern[] | Available patterns |
| `selected` | string[] | Selected pattern IDs |
| `onChange` | (ids: string[]) => void | Selection handler |

**File:** `PatternFilter.tsx` | **Type:** Client Component

---

### Pagination

Page navigation controls.

| Property | Type | Description |
|----------|------|-------------|
| `currentPage` | number | Current page (1-indexed) |
| `totalPages` | number | Total page count |
| `onPageChange` | (page: number) => void | Page change handler |

**File:** `Pagination.tsx` | **Type:** Client Component

---

## Socratic Coach Components

**Location:** `src/components/socratic-coach/`

### SocraticCoach

Main coaching interface container.

| Property | Type | Description |
|----------|------|-------------|
| `session` | CoachingSession | Current session |
| `problem` | Problem | Problem being coached |
| `initialMessages` | Message[] | Initial message history |
| `initialPhases` | Phase[] | Phase progress |

**File:** `SocraticCoach.tsx` | **Type:** Client Component

---

### SessionHeader

Header with problem info and timer.

| Property | Type | Description |
|----------|------|-------------|
| `problem` | Problem | Problem data |
| `session` | CoachingSession | Session data |
| `elapsedSeconds` | number | Timer value |

**File:** `SessionHeader.tsx` | **Type:** Client Component

---

### PhaseProgress

Visual progress indicator for coaching phases.

| Property | Type | Description |
|----------|------|-------------|
| `phases` | Phase[] | All phases with status |
| `currentPhase` | string | Active phase ID |

**Features:**
- Step indicators (locked/active/completed)
- Progress line connecting steps
- Phase titles and descriptions

**File:** `PhaseProgress.tsx` | **Type:** Server Component

---

### QuestionCard

Multiple-choice quiz question display.

| Property | Type | Description |
|----------|------|-------------|
| `question` | QuestionMessage | Question data |
| `onSubmit` | (options: string[]) => void | Submit handler |
| `disabled?` | boolean | Disable interactions |

**Features:**
- Single-select and multi-select modes
- Option highlighting on selection
- Submit button with loading state

**File:** `QuestionCard.tsx` | **Type:** Client Component

---

### MessageBubble

Chat bubble for coach messages and feedback.

| Property | Type | Description |
|----------|------|-------------|
| `message` | CoachMessage \| FeedbackMessage | Message data |

**Features:**
- Different styles for coach vs feedback
- Correct/incorrect feedback indicators
- Markdown-like formatting

**File:** `MessageBubble.tsx` | **Type:** Server Component

---

### UserQuestionBubble

Chat bubble for user's free-form questions.

| Property | Type | Description |
|----------|------|-------------|
| `message` | UserQuestionMessage | User question |

**File:** `UserQuestionBubble.tsx` | **Type:** Server Component

---

### ChatInput

Input field for asking questions to the coach.

| Property | Type | Description |
|----------|------|-------------|
| `onSubmit` | (question: string) => void | Submit handler |
| `disabled?` | boolean | Disable input |
| `placeholder?` | string | Input placeholder |

**File:** `ChatInput.tsx` | **Type:** Client Component

---

### SessionCard

Card displaying a coaching session in the sessions list.

| Property | Type | Description |
|----------|------|-------------|
| `session` | SessionWithProblem | Session with problem data |
| `onDelete` | (id: string) => void | Delete handler |
| `onRestart` | (problemId: number) => void | Restart handler |

**Features:**
- Problem title and difficulty
- Phase progress indicator
- Elapsed time
- Resume/Delete/Restart actions

**File:** `SessionCard.tsx` | **Type:** Client Component

---

### SessionsList

Container for displaying all user sessions.

| Property | Type | Description |
|----------|------|-------------|
| `sessions` | SessionWithProblem[] | All sessions |

**File:** `SessionsList.tsx` | **Type:** Client Component

---

## Component Patterns

### Server vs Client Components

| Pattern | Use Case |
|---------|----------|
| Server Component | Static display, no interactivity |
| Client Component | useState, useEffect, event handlers |

### Styling Convention

All components use Tailwind CSS with:
- Design system colors (emerald, amber, slate)
- Dark mode via `dark:` variants
- Responsive breakpoints (`sm:`, `md:`, `lg:`)
- `animate-pulse` for loading skeletons

### Icon Usage

```typescript
import { IconName } from 'lucide-react'

<IconName className="h-5 w-5 text-slate-500" />
```

Common icons: `Menu`, `ChevronLeft`, `Search`, `Check`, `X`, `Clock`, `Play`, `Trash2`
