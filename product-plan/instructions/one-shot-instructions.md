# CodeBoss - Complete Implementation Instructions

This document combines all milestones for full implementation of CodeBoss.

---

## Milestone 1: Foundation

Set up the project foundation including the tech stack, design system, and basic routing.

### Prerequisites

Before starting, clarify with the user:
- Authentication approach (OAuth, email/password, magic link, etc.)
- Hosting/deployment target (Vercel, AWS, self-hosted, etc.)
- Database choice (PostgreSQL, MongoDB, etc.)

### Tasks

#### 1.1 Project Setup

Create a new React project with:
- React 18+
- TypeScript
- Tailwind CSS v4
- React Router (or Next.js App Router)
- lucide-react for icons

#### 1.2 Design System Configuration

Configure the design tokens:

**Colors (Tailwind built-in)**
- Primary: `emerald` (emerald-500, emerald-600, etc.)
- Secondary: `amber` (amber-500, amber-600, etc.)
- Neutral: `slate` (slate-50 through slate-950)

**Typography (Google Fonts)**
- Heading & Body: Inter
- Monospace: JetBrains Mono

#### 1.3 Base Layout Structure

Create the base layout with:
- A root layout component
- Light/dark mode support using `dark:` Tailwind variants
- Responsive breakpoints: `sm:`, `md:`, `lg:`, `xl:`

#### 1.4 Route Structure

Set up routes for:
- `/` - Problem Workspace (home)
- `/coach/:sessionId` - Socratic Coach
- `/editor/:sessionId` - Code Editor
- `/progress` - Progress Dashboard
- `/settings` - Settings (placeholder)

---

## Milestone 2: Application Shell

Build the persistent navigation shell that wraps all sections.

### Navigation Structure

- **Problem Workspace** - Default home view (icon: LayoutGrid)
- **Socratic Coach** - AI coaching interface (icon: MessageSquare)
- **Code Editor** - Write and test code (icon: Code2)
- **Progress Dashboard** - Track mastery (icon: BarChart3)
- --- (separator)
- **Settings** - User preferences (icon: Settings)

### Components

#### AppShell
Main wrapper with collapsible sidebar and mobile overlay.

#### MainNav
Navigation items with icons, active states, collapsed mode.

#### UserMenu
User profile with avatar, name, logout dropdown.

### Layout Specifications

- Sidebar width (expanded): 240px
- Sidebar width (collapsed): 64px
- Sidebar background: slate-50 (light) / slate-900 (dark)

### Responsive Behavior

- **Desktop:** Full sidebar, collapsible
- **Tablet:** Collapsed by default
- **Mobile:** Hidden, hamburger menu opens overlay

---

## Milestone 3: Problem Workspace

Build the problem browsing and selection interface.

### Components

#### ProblemWorkspace
Main container with search, filters, and problem grid.

#### SearchBar
Autocomplete search with keyboard navigation.

#### PatternFilter
Multi-select pattern chips.

#### ProblemCard
Cards showing difficulty, title, description, patterns, completion status.

### Data Types

```typescript
interface Problem {
  id: string
  title: string
  description: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  patterns: string[]
  completionStatus: 'Solved' | 'Attempted' | 'Untouched'
}
```

---

## Milestone 4: Socratic Coach

Build the AI-powered quiz-based coaching interface.

### Components

#### SocraticCoach
Main container with sticky header and chat area.

#### SessionHeader
Problem info and timer.

#### PhaseProgress
Four-phase progress indicator.

#### QuestionCard
Single/multi-select interactive questions.

#### MessageBubble
Coach messages and feedback.

### Four Phases

1. Problem Understanding
2. Approach Selection
3. Implementation
4. Edge Cases & Optimization

### Data Types

```typescript
interface Phase {
  id: string
  title: string
  status: 'locked' | 'active' | 'completed'
  questionsTotal: number
  questionsCompleted: number
}

interface QuestionMessage {
  id: string
  type: 'question'
  questionType: 'single-select' | 'multi-select'
  content: string
  options: Option[]
}
```

---

## Milestone 5: Code Editor

Build the split-panel coding environment.

### Components

#### CodeEditor
Split panel container.

#### ApproachPanel
Left panel with approach summary.

#### EditorPanel
Code textarea with line numbers.

#### TestCasesPanel
Collapsible test cases with add/delete.

#### CritiquePanel
AI feedback with suggestions.

#### SubmissionModal
Results modal with score and actions.

### Data Types

```typescript
interface TestCase {
  id: string
  type: 'example' | 'user'
  input: string
  expectedOutput: string
  status: 'pending' | 'running' | 'passed' | 'failed'
}

interface SubmissionResult {
  score: number
  status: 'accepted' | 'wrong_answer' | 'time_limit' | 'runtime_error'
}
```

---

## Milestone 6: Progress Dashboard

Build the read-only progress tracking dashboard.

### Components

#### ProgressDashboard
Main dashboard container.

#### StatCard
Summary stat cards.

#### PatternCard
Pattern progress with SVG ring.

#### SessionRow
Recent activity rows.

### Data Types

```typescript
interface PatternProgress {
  id: string
  name: string
  problemsCompleted: number
  problemsTotal: number
  successRate: number
  status: 'mastered' | 'in-progress' | 'not-started'
}

interface RecentSession {
  id: string
  problemName: string
  date: string
  outcome: 'solved' | 'not-solved'
  duration: string
}
```

---

## Design System Reference

### Colors
- Primary: emerald
- Secondary: amber
- Neutral: slate

### Typography
- Heading/Body: Inter
- Monospace: JetBrains Mono

### Common Patterns
- Difficulty badges: Easy=emerald, Medium=amber, Hard=red
- Active states: emerald-500 background, white text
- Hover states: slate-100 (light), slate-800 (dark)
- Border colors: slate-200 (light), slate-800 (dark)

### Responsive Breakpoints
- Mobile: default
- Tablet: `md:` (768px)
- Desktop: `lg:` (1024px)
- Wide: `xl:` (1280px)
