# CodeBoss Documentation

> AI coaching tool for coding interview preparation using Socratic questioning

**Generated:** 2026-01-05 | **Scan Level:** Deep | **Project Type:** Web (Next.js 15)

## Quick Reference

| Aspect | Details |
|--------|---------|
| **Framework** | Next.js 15.1.3 (App Router) |
| **Language** | TypeScript 5.7.2 (strict) |
| **Database** | Supabase (PostgreSQL) |
| **AI** | OpenAI GPT-4o with Zod structured outputs |
| **Styling** | Tailwind CSS 3.4.17 |

## Documentation Index

| Document | Purpose |
|----------|---------|
| [Project Context](./project-context.md) | Concise rules for AI agents |
| [Technology Stack](./technology-stack.md) | Complete tech stack with justifications |
| [Architecture Patterns](./architecture-patterns.md) | Code patterns and conventions |
| [API Reference](./api-reference.md) | Server Actions and data layer |
| [Data Models](./data-models.md) | Database schema and TypeScript types |
| [Component Inventory](./component-inventory.md) | UI components catalog |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── actions.ts          # Server Actions (7 functions)
│   ├── page.tsx            # Problem Workspace (/)
│   ├── coach/              # Coaching feature
│   │   ├── page.tsx        # Sessions list (/coach)
│   │   └── [sessionId]/    # Session detail (/coach/[id])
│   ├── editor/             # Code editor (placeholder)
│   ├── progress/           # Progress dashboard (placeholder)
│   └── settings/           # Settings (placeholder)
├── components/             # React components (20 total)
│   ├── shell/              # App shell (5 components)
│   ├── problem-workspace/  # Problem browsing (6 components)
│   └── socratic-coach/     # Coaching UI (9 components)
└── lib/                    # Shared utilities
    ├── data.ts             # Database queries (21+ functions)
    ├── openai.ts           # AI integration with Zod schemas
    ├── supabase.ts         # Supabase client setup
    └── types.ts            # TypeScript interfaces
```

## Feature Status

| Feature | Route | Status |
|---------|-------|--------|
| Problem Workspace | `/` | Done |
| Coaching Sessions List | `/coach` | Done |
| Socratic Coach | `/coach/[sessionId]` | Done |
| Code Editor | `/editor` | Placeholder |
| Progress Dashboard | `/progress` | Placeholder |
| Settings | `/settings` | Placeholder |

## Key Decisions

1. **Server Components by default** - Data fetching in RSC, `'use client'` only for interactivity
2. **AI-determined phase transitions** - GPT-4o decides when student advances phases
3. **Zod structured outputs** - Type-safe AI responses via `zodResponseFormat()`
4. **Atomic session initialization** - `is_initialized` flag prevents race conditions

## Related Documentation

- `CLAUDE.md` - AI assistant context (in project root)
- `product-plan/` - Original product planning docs
- `supabase/*.sql` - Database schema files
