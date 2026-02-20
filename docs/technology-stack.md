# Technology Stack

> Complete technology inventory for Algority

## Core Stack

| Category | Technology | Version | Justification |
|----------|------------|---------|---------------|
| **Framework** | Next.js | 15.1.3 | App Router, React 19 support, standalone output for deployment |
| **Language** | TypeScript | 5.7.2 | Strict mode enabled, bundler module resolution |
| **UI Library** | React | 19.0.0 | Server Components, latest concurrent features |
| **Styling** | Tailwind CSS | 3.4.17 | Utility-first, dark mode via `class` strategy |
| **Database** | Supabase | 2.89.0 | PostgreSQL with @supabase/ssr for SSR, RLS enabled |
| **AI** | OpenAI | 6.15.0 | GPT-4o with Zod structured outputs |
| **Validation** | Zod | 4.3.5 | Runtime validation, OpenAI response_format integration |
| **Icons** | lucide-react | 0.468.0 | Consistent, tree-shakeable icon library |

## Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @types/node | 22.10.5 | Node.js type definitions |
| @types/react | 19.0.2 | React type definitions |
| @types/react-dom | 19.0.2 | React DOM type definitions |
| eslint | 9.17.0 | Code linting |
| eslint-config-next | 15.1.3 | Next.js ESLint rules |
| postcss | 8.4.49 | CSS processing for Tailwind |
| tailwindcss | 3.4.17 | Utility CSS framework |
| typescript | 5.7.2 | TypeScript compiler |

## Configuration Files

### TypeScript (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "strict": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### Tailwind (`tailwind.config.ts`)
```typescript
{
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
}
```

### Next.js (`next.config.js`)
```javascript
{
  output: 'standalone'  // Optimized for containerized deployment
}
```

## External Services

### Supabase (PostgreSQL)
- **Purpose:** Primary database and backend-as-a-service
- **Features Used:**
  - PostgreSQL database
  - Row Level Security (RLS)
  - Server-side client via @supabase/ssr
- **Environment Variables:**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_KEY` (service role, server-only)

### OpenAI API
- **Purpose:** AI-powered Socratic coaching
- **Model:** GPT-4o
- **Features Used:**
  - Chat completions with structured outputs
  - Zod schema integration via `zodResponseFormat()`
- **Environment Variables:**
  - `OPENAI_API_KEY`

## Architecture Decisions

### Why Next.js 15 App Router?
- Server Components reduce client bundle size
- Built-in data fetching with async components
- Server Actions eliminate API route boilerplate
- Streaming and Suspense for better UX

### Why Supabase over raw PostgreSQL?
- Instant REST API (though we primarily use direct queries)
- Built-in RLS for row-level security
- Easy SSR integration with @supabase/ssr
- Real-time capabilities (not yet used)

### Why Zod for AI Responses?
- Type-safe structured outputs from OpenAI
- Runtime validation ensures AI responses match expected shape
- Eliminates JSON.parse() error handling
- Single source of truth for response schemas

### Why Tailwind CSS?
- Consistent design system via utility classes
- Dark mode with minimal configuration
- No CSS-in-JS runtime overhead
- Co-located styles with components

## Not Yet Implemented

| Technology | Reason |
|------------|--------|
| Authentication | MVP focused on single-user experience |
| Testing framework | Prioritized feature development |
| CI/CD pipeline | Manual deployment for now |
| Error monitoring | To be added (Sentry recommended) |
| Analytics | To be added post-MVP |
