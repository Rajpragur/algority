# Milestone 6: Progress Dashboard

Build the read-only progress tracking dashboard.

## Overview

A read-only dashboard showing the user's progress across algorithmic patterns, displaying mastery levels with problem counts and accuracy rates. Includes recent activity.

## User Flows

1. View overall summary stats
2. See each pattern with completion and accuracy
3. Identify weak patterns (low accuracy, few problems)
4. Review recent sessions

## Components to Build

### 6.1 ProgressDashboard

Main dashboard container.

**Props:**
```typescript
interface ProgressDashboardProps {
  summaryStats: SummaryStats
  patternProgress: PatternProgress[]
  recentSessions: RecentSession[]
}
```

### 6.2 StatCard

Summary stat cards showing:
- Label (small, uppercase)
- Value (large number)
- Subtext
- Type-specific formatting:
  - count: plain number
  - percentage: number with %
  - streak: number with fire emoji

### 6.3 PatternCard

Pattern progress card showing:
- Circular progress ring (SVG)
- Success rate in center of ring
- Pattern name and description
- Problems completed / total
- Status badge (Mastered=emerald, In Progress=amber, Not Started=slate)

Ring colors by status:
- Mastered: emerald-500
- In Progress: amber-500
- Not Started: slate-300

### 6.4 SessionRow

Recent activity row showing:
- Status icon (checkmark for solved, X for not solved)
- Problem name
- Pattern tag
- Duration
- Relative date (Today, Yesterday, X days ago)

## Data Types

```typescript
interface SummaryStats {
  totalProblemsSolved: number
  totalProblemsAttempted: number
  overallAccuracy: number
  patternsMastered: number
  patternsInProgress: number
  patternsNotStarted: number
  totalPracticeTime: string
  currentStreak: number
}

interface PatternProgress {
  id: string
  name: string
  description: string
  problemsCompleted: number
  problemsTotal: number
  successRate: number
  status: 'mastered' | 'in-progress' | 'not-started'
}

interface RecentSession {
  id: string
  problemName: string
  problemId: string
  pattern: string
  date: string
  outcome: 'solved' | 'not-solved'
  duration: string
}
```

## Layout

- Summary stats: 2x2 grid on mobile, 4 columns on desktop
- Pattern cards: 1 column on mobile, 2 on tablet, 4 on desktop
- Recent activity: full-width card with rows
- Max content width: 1152px (max-w-6xl)

## Progress Ring Implementation

SVG circle with stroke-dasharray animation:
```typescript
const radius = 28
const circumference = 2 * Math.PI * radius
const strokeDashoffset = circumference - (progressPercent / 100) * circumference
```

## Acceptance Criteria

- [ ] Summary stats display correctly
- [ ] Progress rings animate and show correct percentages
- [ ] Pattern status colors are correct
- [ ] Recent sessions show relative dates
- [ ] Solved/not-solved icons are correct
- [ ] Layout is responsive
- [ ] Legend for status colors is visible
- [ ] Dark mode works correctly
- [ ] No action buttons (view-only)
