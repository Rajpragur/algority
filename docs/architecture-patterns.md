# Architecture Patterns

> Code patterns and conventions used in CodeBoss

## Overall Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
├─────────────────────────────────────────────────────────────┤
│  Client Components          │  Server Components             │
│  (Interactive UI)           │  (Data Fetching)               │
│  - useState/useEffect       │  - async/await                 │
│  - Event handlers           │  - Direct DB access            │
├─────────────────────────────┴───────────────────────────────┤
│                    Server Actions                            │
│                   (src/app/actions.ts)                       │
├─────────────────────────────────────────────────────────────┤
│                     Data Layer                               │
│                   (src/lib/data.ts)                          │
├─────────────────────────────────────────────────────────────┤
│                   Supabase (PostgreSQL)                      │
└─────────────────────────────────────────────────────────────┘
```

## Pattern 1: Server Components for Data Fetching

**Location:** All `page.tsx` files

```typescript
// src/app/page.tsx - Server Component (default)
import { getProblems, getPatterns } from '@/lib/data'

export default async function HomePage() {
  // Direct async data fetching - no useEffect needed
  const [problems, patterns] = await Promise.all([
    getProblems(),
    getPatterns(),
  ])

  return <ProblemWorkspace problems={problems} patterns={patterns} />
}
```

**When to use:** Any page that displays data from the database.

## Pattern 2: Client Components for Interactivity

**Location:** Components with `'use client'` directive

```typescript
// src/components/shell/AppShell.tsx
'use client'

import { useState } from 'react'

export function AppShell({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <div>
      <button onClick={() => setIsCollapsed(!isCollapsed)}>Toggle</button>
      {children}
    </div>
  )
}
```

**When to use:** Components with:
- useState, useEffect, useRef
- Event handlers (onClick, onChange)
- Browser APIs (localStorage, window)

## Pattern 3: Server Actions for Mutations

**Location:** `src/app/actions.ts`

```typescript
'use server'

import { createServerSupabaseClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function deleteCoachingSession(sessionId: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('coaching_sessions')
    .delete()
    .eq('id', sessionId)

  if (error) {
    console.error('Error:', error)
    return false
  }

  revalidatePath('/coach')  // Invalidate cache
  return true
}
```

**Calling from Client:**
```typescript
'use client'

import { deleteCoachingSession } from '@/app/actions'

function DeleteButton({ sessionId }) {
  const handleDelete = async () => {
    await deleteCoachingSession(sessionId)
  }
  return <button onClick={handleDelete}>Delete</button>
}
```

## Pattern 4: Supabase SSR Client

**Location:** `src/lib/supabase.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

**Usage in data layer:**
```typescript
// src/lib/data.ts
export async function getProblems(): Promise<Problem[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('problems')
    .select('*')
  return data || []
}
```

## Pattern 5: OpenAI Structured Outputs with Zod

**Location:** `src/lib/openai.ts`

```typescript
import OpenAI from 'openai'
import { z } from 'zod'
import { zodResponseFormat } from 'openai/helpers/zod'

// 1. Define schema
const FeedbackSchema = z.object({
  isCorrect: z.boolean(),
  feedback: z.string(),
  shouldAdvancePhase: z.boolean(),
  nextPhase: z.string().nullable(),
})

// 2. Use in API call
const completion = await openai.chat.completions.parse({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ],
  response_format: zodResponseFormat(FeedbackSchema, 'feedback'),
})

// 3. Get typed result
const parsed = completion.choices[0]?.message?.parsed
// parsed is fully typed as { isCorrect: boolean, feedback: string, ... }
```

## Pattern 6: Loading States with Suspense

**Location:** `loading.tsx` files in app directory

```typescript
// src/app/loading.tsx
export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-1/4 mb-4" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-200 rounded" />
        ))}
      </div>
    </div>
  )
}
```

**Next.js automatically shows this during page transitions.**

## Pattern 7: Type Assertions for Supabase Joins

**Problem:** Supabase join types are complex and don't match app types.

```typescript
// src/lib/data.ts
export async function getUserSessions(): Promise<SessionWithProblem[]> {
  const { data } = await supabase
    .from('coaching_sessions')
    .select(`
      id, problem_id, current_phase,
      problems!inner ( id, title, difficulty )
    `)

  return data.map((s) => {
    // Type assertion needed for joined data
    const problem = s.problems as unknown as {
      id: number
      title: string
      difficulty: string
    }

    return {
      id: s.id,
      problemId: s.problem_id,
      problem: {
        id: problem.id,
        title: problem.title,
        difficulty: problem.difficulty as Difficulty,
      },
    }
  })
}
```

## Pattern 8: Atomic Operations with Flags

**Problem:** React Strict Mode causes double-mounting, leading to race conditions.

**Solution:** Use database flag for atomic claim.

```typescript
// src/app/actions.ts
export async function initializeCoachingSession(problemId: number) {
  const session = await getOrCreateSession(problemId)

  // Atomic claim: Only one caller can set is_initialized
  const { data: claimed } = await supabase
    .from('coaching_sessions')
    .update({ is_initialized: true })
    .eq('id', session.id)
    .eq('is_initialized', false)  // Only if currently false
    .select('id')
    .single()

  if (!claimed) {
    // Lost the race - wait for winner to finish
    await new Promise(resolve => setTimeout(resolve, 3000))
    return await getSessionMessages(session.id)
  }

  // Won the race - do expensive initialization
  const { intro, question } = await generatePhaseIntroWithQuestion(...)
  // ...
}
```

## Component Composition Pattern

```typescript
// Parent: Server Component fetches data
// src/app/coach/[sessionId]/page.tsx
export default async function CoachPage({ params }) {
  const { session, problem, messages } = await initializeCoachingSession(
    parseInt(params.sessionId)
  )

  // Child: Client Component handles interactivity
  return <CoachingClient session={session} problem={problem} messages={messages} />
}

// Child: Client Component
// src/app/coach/[sessionId]/CoachingClient.tsx
'use client'

export function CoachingClient({ session, problem, messages }) {
  const [currentMessages, setCurrentMessages] = useState(messages)
  // Handle user interactions...
}
```
