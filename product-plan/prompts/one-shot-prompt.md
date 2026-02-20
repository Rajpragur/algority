# CodeBoss Implementation Prompt

I need you to implement CodeBoss, an AI coaching tool for coding interview preparation.

## Before You Start

Please ask me about:
1. **Authentication**: What auth method should we use? (OAuth, email/password, magic link)
2. **Database**: Which database? (PostgreSQL, MongoDB, Supabase, etc.)
3. **Hosting**: Where will this be deployed? (Vercel, AWS, etc.)
4. **Framework**: React with Vite, Next.js, or other?

## What You'll Build

CodeBoss has 4 main sections:
1. **Problem Workspace** - Browse and select coding problems
2. **Socratic Coach** - Quiz-based AI coaching
3. **Code Editor** - Write, test, and submit solutions
4. **Progress Dashboard** - Track pattern mastery

## Instructions

I've provided a complete implementation guide in `instructions/one-shot-instructions.md`. This includes:
- Project setup and design system
- App shell with navigation
- All 4 sections with component specifications
- TypeScript types for all data structures

## Design System

- **Colors**: emerald (primary), amber (secondary), slate (neutral)
- **Fonts**: Inter (body), JetBrains Mono (code)
- **Icons**: lucide-react

## Reference Components

The `sections/` folder contains reference React components with the exact styling and structure needed. Use these as templates.

## Test Specifications

Each section has a `tests.md` file with acceptance criteria and edge cases to verify.

---

Please start by asking the clarifying questions above, then work through the milestones systematically.
