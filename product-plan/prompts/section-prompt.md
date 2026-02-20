# Section Implementation Prompt Template

Use this template to implement Algority one section at a time.

---

## Prompt for [SECTION NAME]

I need you to implement the **[Section Name]** section of Algority.

### Context

Algority is an AI coaching tool for coding interview prep. I'm building it incrementally and this section is part of the larger application.

**Previous sections implemented:**
- [List any previously completed sections]

**Current tech stack:**
- [List your current setup: framework, database, auth, etc.]

### What to Build

[Copy the relevant milestone from `instructions/incremental/`]

### Reference Files

- `sections/[section-name]/README.md` - Component overview
- `sections/[section-name]/types.ts` - TypeScript interfaces
- `sections/[section-name]/components/` - Reference implementations
- `sections/[section-name]/tests.md` - Acceptance criteria

### Design System

- Primary: emerald
- Secondary: amber
- Neutral: slate
- Font: Inter, JetBrains Mono (mono)
- Icons: lucide-react

### Requirements

1. Use the provided component files as reference
2. Adapt imports for your project structure
3. Wire up to your data layer/API
4. Verify against the test specifications

---

## Example: Problem Workspace

I need you to implement the **Problem Workspace** section of Algority.

### Context

Algority is an AI coaching tool for coding interview prep. I've already completed:
- Project setup with React + Vite + TypeScript
- Tailwind CSS v4 configuration
- App shell with sidebar navigation

### What to Build

See `instructions/incremental/03-problem-workspace.md` for full details.

Key components:
- SearchBar with autocomplete
- PatternFilter with multi-select
- ProblemCard grid
- Empty state handling

### Reference Files

The `sections/problem-workspace/` folder contains:
- `types.ts` - Problem, Pattern, ProblemWorkspaceProps
- `components/` - All React components
- `tests.md` - Acceptance criteria

Please implement this section, connecting it to my existing API endpoints for fetching problems.
