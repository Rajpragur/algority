# Project Context

> Critical rules and patterns for AI agents working on Algority

## Project Identity

**Algority** - AI coaching tool for coding interview preparation using Socratic questioning.

## Tech Stack (Do Not Deviate)

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js (App Router) | 15.1.3 |
| Language | TypeScript | 5.7.2 |
| UI | React | 19.0.0 |
| Styling | Tailwind CSS | 3.4.17 |
| Database | Supabase (PostgreSQL) | 2.89.0 |
| AI | OpenAI | 6.15.0 |
| Validation | Zod | 4.3.5 |
| Icons | lucide-react | 0.468.0 |

## Critical Patterns

### 1. Server Components First
```typescript
// DEFAULT: Server Component (no directive needed)
export default async function Page() {
  const data = await fetchData() // Direct async
  return <Component data={data} />
}

// ONLY when needed: Client Component
'use client'
export function InteractiveComponent() {
  const [state, setState] = useState()
  // ...
}
```

### 2. Server Actions for Mutations
```typescript
// src/app/actions.ts
'use server'

export async function myAction(formData: FormData) {
  const supabase = await createServerSupabaseClient()
  // Perform mutation
  revalidatePath('/affected-route')
}
```

### 3. Supabase SSR Pattern
```typescript
// ALWAYS use this for server-side
import { createServerSupabaseClient } from '@/lib/supabase'
const supabase = await createServerSupabaseClient()

// NEVER use createClient() on server - that's for browser only
```

### 4. OpenAI Structured Outputs
```typescript
import { zodResponseFormat } from 'openai/helpers/zod'

const completion = await openai.chat.completions.parse({
  model: 'gpt-4o',
  response_format: zodResponseFormat(MyZodSchema, 'schema_name'),
})
const parsed = completion.choices[0]?.message?.parsed
```

### 5. Type Assertions for Supabase Joins
```typescript
// Complex joins need type assertion
const result = data.joined_table as unknown as ExpectedType
```

## File Locations

| Purpose | Path |
|---------|------|
| Server Actions | `src/app/actions.ts` |
| Database Queries | `src/lib/data.ts` |
| AI Integration | `src/lib/openai.ts` |
| Supabase Client | `src/lib/supabase.ts` |
| Type Definitions | `src/lib/types.ts` |
| App Shell | `src/components/shell/` |
| Problem Workspace | `src/components/problem-workspace/` |
| Socratic Coach | `src/components/socratic-coach/` |
| Auth Components | `src/components/auth/` |
| Route Protection | `src/middleware.ts` |
| OAuth Callback | `src/app/api/auth/callback/route.ts` |

## Design System

| Token | Value |
|-------|-------|
| Primary | `emerald-500`, `emerald-600` |
| Secondary | `amber-500` |
| Neutral | `slate-50` through `slate-950` |
| Font (body) | Inter |
| Font (code) | JetBrains Mono |
| Dark mode | `dark:` variants, `darkMode: 'class'` |

## Database Tables

| Table | Purpose |
|-------|---------|
| `patterns` | Algorithmic patterns (sliding window, BFS, etc.) |
| `problems` | LeetCode problems with descriptions |
| `problem_patterns` | Many-to-many junction |
| `coaching_sessions` | User coaching sessions |
| `coaching_messages` | Chat history per session |

## Constraints

1. **No tests yet** - Test infrastructure not set up
2. **Placeholder routes** - `/progress`, `/settings` are stubs

## When Adding Features

1. Check if route exists (may be placeholder)
2. Use Server Components unless interactivity required
3. Add Server Actions to `src/app/actions.ts`
4. Add database functions to `src/lib/data.ts`
5. Follow existing component patterns in `src/components/`
6. Use Tailwind with design system colors

---

## Eval Infrastructure (eval/)

> CLI-based quality evaluation system for Socratic Coach

### Tech Stack (Eval-Specific)

| Layer | Technology | Purpose |
|-------|------------|---------|
| CLI | Commander.js | Command routing |
| Runtime | tsx | Direct TypeScript execution |
| Judge | Claude (Anthropic) | LLM-as-a-Judge (decorrelated) |
| Tracing | Langsmith | Observability |
| Config | YAML + Zod | Tunable parameters |

### Critical Patterns (Eval)

#### 1. Standalone Supabase Client
```typescript
// eval/lib/supabase.ts - Uses service role, NOT cookies
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // Service role for CLI
)
```

#### 2. Config Loading with Zod
```typescript
// eval/lib/config.ts
import { z } from 'zod'
import { parse } from 'yaml'

const EvalConfigSchema = z.object({
  coaching: z.object({
    min_questions_per_phase: z.number().min(2).max(10),
    confidence_threshold: z.number().min(0.5).max(1.0),
  }),
  judge: z.object({
    model: z.string(),
    criteria_weights: z.record(z.number()),
  }),
})
```

#### 3. Judge Model (Decorrelated)
```typescript
// eval/lib/judge.ts - MUST use different model family
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()
// Use Claude for judging, NOT GPT-4o (coaching model)
```

### Naming Conventions (Eval)

| Context | Convention | Example |
|---------|------------|---------|
| Files | kebab-case | `phase-transition-timing.md` |
| YAML keys | snake_case | `min_questions_per_phase` |
| TypeScript | camelCase | `loadGoldenDataset()` |
| Types | PascalCase | `CriterionScore` |

### File Locations (Eval)

| Purpose | Path |
|---------|------|
| CLI Commands | `eval/cli/*.ts` |
| Utilities | `eval/lib/*.ts` |
| Judge Prompts | `eval/prompts/*.md` |
| Golden Datasets | `eval/golden/{training,holdout}/*.yaml` |
| Config | `eval.config.yaml` (root) |

### Environment Variables (Eval)

```bash
SUPABASE_SERVICE_ROLE_KEY=   # Full DB access for CLI
ANTHROPIC_API_KEY=           # Claude judge model
LANGSMITH_API_KEY=           # Tracing
LANGSMITH_PROJECT=           # algority-eval (NOT algority-prod)
```

### Anti-Patterns (Eval)

```typescript
// WRONG: Using cookies-based client in CLI
import { createServerSupabaseClient } from '@/lib/supabase'  // ❌

// WRONG: Using same model for judging as coaching
const judge = openai.chat.completions.create({ model: 'gpt-4o' })  // ❌

// WRONG: camelCase in YAML config
coaching:
  minQuestionsPerPhase: 3  // ❌ Use snake_case
```

### When Adding Eval Features

1. Add CLI command to `eval/cli/`
2. Add utilities to `eval/lib/`
3. Use standalone Supabase client (service role)
4. Import shared types from `src/lib/types.ts`
5. Follow kebab-case for new files
6. Use snake_case for YAML keys

---

## Code Editor Feature

> Patterns specific to the Code Editor implementation

### New Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @monaco-editor/react | latest | VS Code editor component |

### Environment Variables (Code Editor)

```bash
JUDGE0_API_URL=           # Judge0 API endpoint
JUDGE0_API_KEY=           # Judge0 authentication (server-side only)
```

### Critical Patterns (Code Editor)

#### 6. localStorage Persistence
```typescript
// src/lib/storage.ts
const STORAGE_KEYS = {
  draft: (problemId: number) => `algority:editor:draft:${problemId}`,
  tests: (problemId: number) => `algority:editor:tests:${problemId}`,
}

interface EditorDraft {
  code: string
  timestamp: number
}
```

#### 7. External API Integration (Judge0)
```typescript
// src/lib/judge0.ts - Server-side only wrapper
// NEVER expose API key to client
export async function submitCode(code: string, languageId: number) {
  // Submit via fetch with JUDGE0_API_KEY header
}

export async function pollResults(token: string) {
  // Poll with exponential backoff, max 2 retries
}
```

#### 8. Dynamic Component Loading
```typescript
// For heavy components like Monaco (~2MB)
import dynamic from 'next/dynamic'

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react'),
  { ssr: false, loading: () => <EditorSkeleton /> }
)
```

#### 9. Feature-Scoped Component Organization
```
src/components/code-editor/
├── CodeEditor.tsx           # Monaco wrapper
├── EditorSkeleton.tsx       # Loading state
├── ProblemTabs.tsx          # Problem/Solution/Insights
├── TestsPanel.tsx           # Test cases + results
├── EvaluateButton.tsx       # AI evaluation trigger
├── ExecutionResults.tsx     # Run/Submit results
└── InlineResponse.tsx       # AI feedback display
```

#### 10. AI Evaluation Schema
```typescript
// src/lib/openai.ts - Extend existing file
const CodeEvaluationSchema = z.object({
  isCorrect: z.boolean(),
  feedback: z.string(),
  issueType: z.enum(['syntax', 'logic', 'edge-case', 'efficiency', 'none']).nullable(),
  hint: z.string().nullable(),
})
```

### File Locations (Code Editor)

| Purpose | Path |
|---------|------|
| Editor Route | `src/app/editor/[problemId]/` |
| Editor Components | `src/components/code-editor/` |
| Judge0 Wrapper | `src/lib/judge0.ts` |
| localStorage Helpers | `src/lib/storage.ts` |

### Anti-Patterns (Code Editor)

```typescript
// WRONG: Exposing Judge0 API key to client
const response = await fetch(JUDGE0_URL, {
  headers: { 'X-Auth-Token': process.env.JUDGE0_API_KEY }  // ❌ Client-side
})

// RIGHT: Use Server Action
export async function executeCode(code: string) {  // ✅ Server-side
  // API key stays on server
}

// WRONG: Importing Monaco without dynamic
import Editor from '@monaco-editor/react'  // ❌ Blocks SSR

// RIGHT: Dynamic import with ssr: false
const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false })  // ✅

// WRONG: Creating separate action files
// src/app/editor-actions.ts  // ❌

// RIGHT: Extend existing actions file
// src/app/actions.ts (add executeCode, evaluateCode)  // ✅
```

### When Adding Code Editor Features

1. Add Server Actions to `src/app/actions.ts` (not a new file)
2. Add components to `src/components/code-editor/`
3. Use `dynamic()` for Monaco and heavy components
4. Store user data in localStorage (MVP), not database
5. Keep Judge0 API calls server-side via Server Actions
6. Extend `src/lib/openai.ts` for new AI schemas

---

## Authentication Feature

> Patterns specific to the Authentication implementation

### New Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| sonner | latest | Toast notifications |

### Critical Patterns (Auth)

#### 11. Auth Context Provider
```typescript
// src/components/auth/AuthProvider.tsx
'use client'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  openAuthModal: (tab?: 'login' | 'signup' | 'magic-link') => void
  closeAuthModal: () => void
  signOut: () => Promise<void>
}

// Usage in components:
const { user, openAuthModal } = useAuth()
```

#### 12. Middleware Route Protection
```typescript
// middleware.ts
const protectedRoutes = ['/coach', '/editor', '/progress', '/settings']

export async function middleware(request: NextRequest) {
  const supabase = createMiddlewareClient(request)
  const { data: { session } } = await supabase.auth.getSession()

  const isProtected = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtected && !session) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('auth_required', 'true')
    return NextResponse.redirect(url)
  }
}
```

#### 13. OAuth Callback Handler
```typescript
// src/app/api/auth/callback/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createServerSupabaseClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL('/', request.url))
}
```

#### 14. Generic Error Messages (Security)
```typescript
// NEVER reveal user existence
// ❌ WRONG:
throw new Error("User not found")
throw new Error("Invalid password")

// ✅ RIGHT:
throw new Error("Invalid email or password")
throw new Error("Unable to sign in. Please try again.")
```

### File Locations (Auth)

| Purpose | Path |
|---------|------|
| Auth Provider | `src/components/auth/AuthProvider.tsx` |
| Auth Modal | `src/components/auth/AuthModal.tsx` |
| Login Form | `src/components/auth/LoginForm.tsx` |
| Signup Form | `src/components/auth/SignupForm.tsx` |
| OAuth Buttons | `src/components/auth/OAuthButtons.tsx` |
| Magic Link Form | `src/components/auth/MagicLinkForm.tsx` |
| Route Protection | `src/middleware.ts` |
| OAuth Callback | `src/app/api/auth/callback/route.ts` |

### Database (Auth)

| Table | Column | Purpose |
|-------|--------|---------|
| `coaching_sessions` | `user_id` | FK to `auth.users(id)`, nullable |
| `auth.users` | (managed) | Supabase Auth managed table |

**RLS Pattern:**
```sql
-- User can only access their own sessions
CREATE POLICY "Users access own sessions"
ON coaching_sessions FOR ALL
USING (auth.uid() = user_id);
```

### Anti-Patterns (Auth)

```typescript
// WRONG: Creating separate auth actions file
src/app/auth-actions.ts  // ❌

// RIGHT: Add to existing actions file
src/app/actions.ts  // ✅ Add signIn, signUp, signOut here

// WRONG: Revealing user existence in errors
"No account found for this email"  // ❌

// RIGHT: Generic error messages
"Invalid email or password"  // ✅

// WRONG: Flat component organization
src/components/AuthModal.tsx  // ❌

// RIGHT: Feature-scoped folder
src/components/auth/AuthModal.tsx  // ✅

// WRONG: Inconsistent hook naming
useAuthContext()  // ❌
useAuthState()    // ❌
useAuthentication()  // ❌

// RIGHT: Simple, standard naming
useAuth()  // ✅
```

### When Adding Auth Features

1. Add Server Actions to `src/app/actions.ts` (not a new file)
2. Add components to `src/components/auth/`
3. Use `useAuth()` hook for auth state access
4. Use generic error messages (no user enumeration)
5. Protected routes go in middleware.ts `protectedRoutes` array
6. All user-owned data needs `user_id` column + RLS policy