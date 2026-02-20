# Problem Workspace

The Problem Workspace is where users browse, search, and select coding problems to practice.

## Components

- `ProblemWorkspace` - Main container with search, filters, and problem grid
- `SearchBar` - Autocomplete search with keyboard navigation
- `PatternFilter` - Multi-select pattern filter chips
- `ProblemCard` - Individual problem cards with status indicators

## Props

See `types.ts` for full interface definitions.

## Usage

```tsx
import { ProblemWorkspace } from './components'
import type { Problem, Pattern } from './types'

const problems: Problem[] = [...]
const patterns: Pattern[] = [...]

<ProblemWorkspace
  problems={problems}
  patterns={patterns}
  onSelectProblem={(id) => navigate(`/coach/${id}`)}
  onSearch={(query) => console.log(query)}
  onFilterByPattern={(ids) => console.log(ids)}
/>
```
