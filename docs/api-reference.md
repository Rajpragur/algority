# API Reference

> Server Actions and Data Layer functions

## Server Actions

**Location:** `src/app/actions.ts`

All functions are marked with `'use server'` and can be called from Client Components.

### searchProblems()

Search problems with pagination and pattern filtering.

```typescript
interface SearchParams {
  query?: string        // Text search in title/description
  patternIds?: string[] // Filter by pattern UUIDs
  page?: number         // Page number (1-indexed)
  limit?: number        // Results per page (default: 24)
}

interface SearchResult {
  problems: Problem[]
  total: number
  page: number
  totalPages: number
}

async function searchProblems(params: SearchParams): Promise<SearchResult>
```

**Example:**
```typescript
const results = await searchProblems({
  query: 'two sum',
  patternIds: ['uuid-of-hash-map-pattern'],
  page: 1,
  limit: 24,
})
```

---

### initializeCoachingSession()

Create or resume a coaching session for a problem. Generates AI intro and first question.

```typescript
async function initializeCoachingSession(problemId: number): Promise<{
  session: CoachingSession
  problem: Problem
  messages: Message[]
  phases: Phase[]
}>
```

**Behavior:**
- If incomplete session exists for problem → resumes it
- If no session → creates new one with AI-generated intro
- Uses atomic `is_initialized` flag to prevent race conditions

---

### submitCoachingAnswer()

Submit user's answer to a quiz question. AI evaluates and decides phase advancement.

```typescript
async function submitCoachingAnswer(
  sessionId: string,
  questionId: string,
  selectedOptions: string[]  // e.g., ['a'] or ['a', 'c']
): Promise<{
  messages: Message[]
  phases: Phase[]
}>
```

**Behavior:**
- Saves user answer to database
- AI evaluates correctness and provides feedback
- AI decides if student should advance to next phase
- Generates next question (same phase or new phase intro)

---

### askCoachQuestion()

Submit a free-form question to the AI coach.

```typescript
async function askCoachQuestion(
  sessionId: string,
  question: string
): Promise<{
  messages: Message[]
  phases: Phase[]
}>
```

**Behavior:**
- Saves user question to database
- AI responds using Socratic method (guides without giving answers)
- AI may decide to follow up with a quiz
- AI may advance phase if student demonstrates understanding

---

### updateCoachingSessionTime()

Update the elapsed time for a session.

```typescript
async function updateCoachingSessionTime(
  sessionId: string,
  elapsedSeconds: number
): Promise<void>
```

---

### deleteCoachingSession()

Delete a coaching session and all its messages.

```typescript
async function deleteCoachingSession(sessionId: string): Promise<boolean>
```

**Side effects:** Calls `revalidatePath('/coach')` to refresh sessions list.

---

### restartCoachingSession()

Create a new session for the same problem (doesn't delete old one).

```typescript
async function restartCoachingSession(problemId: number): Promise<CoachingSession | null>
```

**Side effects:** Calls `revalidatePath('/coach')` to refresh sessions list.

---

## Data Layer Functions

**Location:** `src/lib/data.ts`

### Problem Functions

| Function | Returns | Description |
|----------|---------|-------------|
| `getProblems(limit?)` | `Problem[]` | Fetch problems with patterns |
| `getPatterns()` | `Pattern[]` | Fetch all patterns |
| `getProblemById(id)` | `Problem \| null` | Fetch single problem |

### Session Functions

| Function | Returns | Description |
|----------|---------|-------------|
| `createCoachingSession(problemId)` | `CoachingSession \| null` | Create new session |
| `getCoachingSession(sessionId)` | `CoachingSession \| null` | Fetch session |
| `getOrCreateSession(problemId)` | `CoachingSession \| null` | Resume or create |
| `getUserSessions()` | `SessionWithProblem[]` | All sessions with problem data |
| `deleteSession(sessionId)` | `boolean` | Delete session |
| `updateSessionPhase(sessionId, phase)` | `boolean` | Update current phase |
| `updateSessionTime(sessionId, seconds)` | `boolean` | Update elapsed time |
| `completeSession(sessionId)` | `boolean` | Mark as completed |

### Message Functions

| Function | Returns | Description |
|----------|---------|-------------|
| `getSessionMessages(sessionId)` | `Message[]` | All messages for session |
| `saveCoachMessage(sessionId, phase, content)` | `string \| null` | Save coach intro |
| `saveQuestionMessage(sessionId, phase, question)` | `string \| null` | Save quiz question |
| `saveUserAnswerMessage(sessionId, phase, options)` | `string \| null` | Save user answer |
| `saveFeedbackMessage(sessionId, phase, feedback)` | `string \| null` | Save AI feedback |
| `saveUserQuestionMessage(sessionId, phase, content)` | `string \| null` | Save user question |
| `saveCoachResponseMessage(sessionId, phase, content)` | `string \| null` | Save coach response |

---

## AI Functions

**Location:** `src/lib/openai.ts`

### generateCoachingQuestion()

Generate a multiple-choice quiz question for the current phase.

```typescript
interface GenerateQuestionParams {
  problem: Problem
  phase: Phase
  previousMessages: Message[]
}

async function generateCoachingQuestion(params): Promise<QuestionMessage>
```

---

### evaluateAnswer()

Evaluate user's answer and decide phase progression.

```typescript
interface EvaluateAnswerParams {
  question: QuestionMessage
  selectedOptions: string[]
  problem: Problem
  phase: Phase
  previousMessages: Message[]
}

async function evaluateAnswer(params): Promise<FeedbackMessage>
```

**Returns feedback with:**
- `isCorrect`: Whether answer was correct
- `content`: Feedback text
- `shouldAdvancePhase`: AI's decision on phase progression
- `nextPhase`: Next phase ID if advancing

---

### generatePhaseIntroWithQuestion()

Generate phase intro and first question together (prevents intro from spoiling quiz).

```typescript
async function generatePhaseIntroWithQuestion(params): Promise<{
  intro: string
  question: QuestionMessage
}>
```

---

### respondToUserQuestion()

Respond to a free-form user question using Socratic method.

```typescript
async function respondToUserQuestion(params): Promise<{
  response: string
  shouldFollowUpWithQuiz: boolean
  quizTopic: string | null
  shouldAdvancePhase: boolean
  nextPhase: string | null
}>
```

---

## Routes

| Route | Method | Handler | Description |
|-------|--------|---------|-------------|
| `/` | GET | `page.tsx` | Problem Workspace |
| `/coach` | GET | `page.tsx` | Sessions list |
| `/coach/[sessionId]` | GET | `page.tsx` | Coaching session |
| `/editor` | GET | `page.tsx` | Code editor (placeholder) |
| `/progress` | GET | `page.tsx` | Progress dashboard (placeholder) |
| `/settings` | GET | `page.tsx` | Settings (placeholder) |

**Note:** No traditional API routes - all mutations use Server Actions.
