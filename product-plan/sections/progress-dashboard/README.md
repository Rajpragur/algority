# Progress Dashboard

Read-only dashboard showing pattern mastery and recent activity.

## Components

- `ProgressDashboard` - Main dashboard container
- `StatCard` - Summary stat cards
- `PatternCard` - Pattern progress with SVG ring
- `SessionRow` - Recent activity rows

## Props

See `types.ts` for full interface definitions.

## Usage

```tsx
import { ProgressDashboard } from './components'
import type { SummaryStats, PatternProgress, RecentSession } from './types'

const summaryStats: SummaryStats = {...}
const patternProgress: PatternProgress[] = [...]
const recentSessions: RecentSession[] = [...]

<ProgressDashboard
  summaryStats={summaryStats}
  patternProgress={patternProgress}
  recentSessions={recentSessions}
/>
```
