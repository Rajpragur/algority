# Algority Export Package

This package contains everything you need to implement Algority - an AI coaching tool for coding interview preparation.

## Quick Start

1. **Full Implementation (One-Shot)**
   - Copy `prompts/one-shot-prompt.md` to your coding agent
   - Provide `instructions/one-shot-instructions.md` as context
   - The agent will implement the complete application

2. **Incremental Implementation**
   - Use `prompts/section-prompt.md` as a template
   - Work through milestones in `instructions/incremental/` one at a time
   - Start with `01-foundation.md`, then `02-shell.md`, then each section

## Package Contents

```
product-plan/
├── README.md                      # This file
├── product-overview.md            # Product summary and requirements
│
├── prompts/                       # Ready-to-use prompts
│   ├── one-shot-prompt.md         # Full implementation prompt
│   └── section-prompt.md          # Incremental implementation template
│
├── instructions/                  # Implementation guides
│   ├── one-shot-instructions.md   # All milestones combined
│   └── incremental/               # Step-by-step milestones
│       ├── 01-foundation.md       # Project setup + design system
│       ├── 02-shell.md            # App shell + navigation
│       ├── 03-problem-workspace.md
│       ├── 04-socratic-coach.md
│       ├── 05-code-editor.md
│       └── 06-progress-dashboard.md
│
├── design-system/                 # Design tokens
│   ├── colors.json
│   └── typography.json
│
├── data-model/                    # Types and sample data
│   ├── data-model.md
│   └── types/                     # TypeScript interfaces per section
│
├── shell/                         # App shell components
│   └── components/
│
└── sections/                      # Section components
    ├── problem-workspace/
    ├── socratic-coach/
    ├── code-editor/
    └── progress-dashboard/
```

## Design System

- **Primary**: emerald (green accent)
- **Secondary**: amber (warnings, highlights)
- **Neutral**: slate (grays)
- **Heading/Body Font**: Inter
- **Monospace Font**: JetBrains Mono

## Sections Overview

1. **Problem Workspace** - Browse and select coding problems
2. **Socratic Coach** - AI-guided quiz-based learning
3. **Code Editor** - Write, test, and submit solutions
4. **Progress Dashboard** - Track mastery and progress

## Technology Notes

These components are designed for:
- React 18+
- TypeScript
- Tailwind CSS v4
- lucide-react icons

Adapt as needed for your specific tech stack.
