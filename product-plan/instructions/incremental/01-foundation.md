# Milestone 1: Foundation

Set up the project foundation including the tech stack, design system, and basic routing.

## Prerequisites

Before starting, clarify with the user:
- Authentication approach (OAuth, email/password, magic link, etc.)
- Hosting/deployment target (Vercel, AWS, self-hosted, etc.)
- Database choice (PostgreSQL, MongoDB, etc.)

## Tasks

### 1.1 Project Setup

Create a new React project with:
- React 18+
- TypeScript
- Tailwind CSS v4
- React Router (or Next.js App Router)
- lucide-react for icons

### 1.2 Design System Configuration

Configure the design tokens:

**Colors (Tailwind built-in)**
- Primary: `emerald` (emerald-500, emerald-600, etc.)
- Secondary: `amber` (amber-500, amber-600, etc.)
- Neutral: `slate` (slate-50 through slate-950)

**Typography (Google Fonts)**
- Heading & Body: Inter
- Monospace: JetBrains Mono

Add to your CSS:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
```

### 1.3 Base Layout Structure

Create the base layout with:
- A root layout component
- Light/dark mode support using `dark:` Tailwind variants
- Responsive breakpoints: `sm:`, `md:`, `lg:`, `xl:`

### 1.4 Route Structure

Set up routes for:
- `/` - Problem Workspace (home)
- `/coach/:sessionId` - Socratic Coach
- `/editor/:sessionId` - Code Editor
- `/progress` - Progress Dashboard
- `/settings` - Settings (placeholder)

## Acceptance Criteria

- [ ] Project builds without errors
- [ ] Tailwind CSS is working with emerald, amber, slate colors
- [ ] Inter and JetBrains Mono fonts are loading
- [ ] Dark mode toggle works (can be a simple button for now)
- [ ] All routes are accessible and render placeholder content
- [ ] Mobile responsive layout foundation is in place
