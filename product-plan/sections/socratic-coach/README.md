# Socratic Coach

AI-powered quiz-based coaching interface that guides users through understanding coding problems.

## Components

- `SocraticCoach` - Main container with sticky header and chat interface
- `SessionHeader` - Problem info and session timer
- `PhaseProgress` - Four-phase progress indicator
- `QuestionCard` - Interactive single/multi-select questions
- `MessageBubble` - Coach messages and feedback

## Props

See `types.ts` for full interface definitions.

## Usage

```tsx
import { SocraticCoach } from './components'
import type { Problem, Session, Phase, Message } from './types'

const problem: Problem = {...}
const session: Session = {...}
const phases: Phase[] = [...]
const messages: Message[] = [...]

<SocraticCoach
  problem={problem}
  session={session}
  phases={phases}
  messages={messages}
  onSelectOption={(qId, optIds) => console.log(qId, optIds)}
  onSubmitAnswer={(qId) => console.log(qId)}
  onReviewPhase={(phaseId) => console.log(phaseId)}
  onProceedToEditor={() => navigate('/editor')}
/>
```
