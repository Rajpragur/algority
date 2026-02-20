# Milestone 3: Problem Workspace

Build the problem browsing and selection interface.

## Overview

The Problem Workspace is where users browse, search, and select coding problems to practice. It features a search bar with autocomplete, pattern-based filtering, and problem cards that show key details.

## User Flows

1. Search for problems using the autocomplete search bar
2. Filter problems by algorithmic patterns (sliding window, two pointers, etc.)
3. View problem cards with title, difficulty, patterns, and completion status
4. Click a problem card to start a coaching session (navigates to Socratic Coach)

## Components to Build

### 3.1 ProblemWorkspace

Main container component with:
- Header with title and stats bar
- Search bar and pattern filters
- Problem cards grid
- Empty state when no problems match filters

**Props:**
```typescript
interface ProblemWorkspaceProps {
  problems: Problem[]
  patterns: Pattern[]
  onSelectProblem?: (problemId: string) => void
  onSearch?: (query: string) => void
  onFilterByPattern?: (patternIds: string[]) => void
}
```

### 3.2 SearchBar

Autocomplete search component:
- Shows matching problems as user types
- Keyboard navigation (arrow keys, enter, escape)
- Shows problem title and truncated description in dropdown

### 3.3 PatternFilter

Multi-select pattern filter:
- Chip-style buttons for each pattern
- Selected patterns are highlighted in emerald
- "Clear" button when filters are active

### 3.4 ProblemCard

Individual problem card showing:
- Difficulty badge (Easy=emerald, Medium=amber, Hard=red)
- Problem title
- Truncated description
- Pattern tags
- Completion status icon (Solved=checkmark, Attempted=clock, Untouched=circle)

## Data Types

```typescript
interface Pattern {
  id: string
  name: string
}

type Difficulty = 'Easy' | 'Medium' | 'Hard'
type CompletionStatus = 'Solved' | 'Attempted' | 'Untouched'

interface Problem {
  id: string
  title: string
  description: string
  difficulty: Difficulty
  patterns: string[]
  completionStatus: CompletionStatus
}
```

## Layout

- Responsive grid: 1 column on mobile, 2 on tablet, 3 on desktop
- Max content width: 1152px (max-w-6xl)
- Cards have hover states with subtle shadow

## Acceptance Criteria

- [ ] Search filters problems in real-time
- [ ] Pattern filters work correctly (OR logic - matches any selected pattern)
- [ ] Problem cards are clickable and navigate to coach
- [ ] Empty state shows when no problems match
- [ ] Difficulty badges have correct colors
- [ ] Completion status icons are visible
- [ ] Layout is responsive
- [ ] Dark mode works correctly
