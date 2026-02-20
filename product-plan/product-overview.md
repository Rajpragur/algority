# Algority - Product Overview

## Description

Algority is an AI coaching tool that teaches you how to think about coding problems, not just how to solve them. Using quiz-based Socratic questioning, it guides you to discover solutions yourself while building transferable problem-solving intuition.

## Problems & Solutions

### Problem 1: Passive learning feels productive but doesn't stick
**Solution:** Forces active engagement through targeted questions at every step - you can't just nod along.

### Problem 2: Memorizing solutions doesn't transfer to new problems
**Solution:** Builds pattern recognition and reasoning skills that work on problems you've never seen.

### Problem 3: Grinding problems doesn't prepare for interview dynamics
**Solution:** Trains the thought process interviewers actually want to see, not just correct answers.

## Key Features

- Socratic questioning that checks understanding before you code
- Adaptive coaching with hints, concept detours, and difficulty adjustment
- Progress tracking for patterns mastered and weak areas
- Code execution with correctness and efficiency feedback
- Pattern library (sliding window, two pointers, BFS/DFS, etc.)

## Target Users

- Engineers preparing for technical interviews (FAANG, startups)
- CS students learning DSA who want deeper understanding
- Self-taught developers filling knowledge gaps

## Sections

### 1. Problem Workspace
The core experience where users select a problem and work through it with AI coaching.

### 2. Socratic Coach
The quiz-based questioning system that guides users to discover solutions and identifies reasoning gaps.

### 3. Code Editor
Write, run, and test code with feedback on correctness and efficiency.

### 4. Progress Dashboard
Track patterns mastered, weak areas, and overall interview readiness.

## Data Model

### Entities

- **User** - Someone using Algority to practice and learn. Tracks progress across sessions, patterns mastered, and overall interview readiness.
- **Problem** - A coding challenge with description, examples, constraints, and test cases. Tagged with algorithmic patterns.
- **Pattern** - An algorithmic pattern like sliding window, two pointers, BFS/DFS, dynamic programming, etc.
- **Session** - A user's coaching session on a specific problem. Captures the full Socratic Q&A dialogue.
- **Submission** - Code the user writes and runs during a session. Includes execution results.

### Relationships

- User has many Sessions
- Session belongs to one User
- Session belongs to one Problem
- Problem uses one or more Patterns
- Pattern is used by many Problems
- Session has many Submissions
- Submission belongs to one Session
