# Data Model

## Entities

### User
Someone using Algority to practice and learn. Tracks their progress across sessions, patterns mastered, and overall interview readiness.

### Problem
A coding challenge the user can work on. Includes a description, examples, constraints, and test cases. Problems are tagged with the algorithmic patterns they exercise.

### Pattern
An algorithmic pattern like sliding window, two pointers, BFS/DFS, dynamic programming, etc. Patterns help users recognize common approaches that transfer across problems.

### Session
A user's coaching session on a specific problem. Captures the full Socratic Q&A dialogue, including questions asked, user responses, hints given, and concept detours. Tracks whether the user successfully solved the problem.

### Submission
Code the user writes and runs during a session. Includes the code itself and the execution results (pass/fail, runtime, memory usage).

## Relationships

- User has many Sessions
- Session belongs to one User
- Session belongs to one Problem
- Problem uses one or more Patterns
- Pattern is used by many Problems
- Session has many Submissions
- Submission belongs to one Session
