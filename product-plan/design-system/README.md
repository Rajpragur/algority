# Design System

CodeBoss uses Tailwind CSS built-in colors and Google Fonts.

## Colors

| Role | Color | Usage |
|------|-------|-------|
| Primary | `emerald` | Actions, success states, active navigation |
| Secondary | `amber` | Warnings, in-progress states, coach feedback |
| Neutral | `slate` | Text, backgrounds, borders |

### Common Color Classes

```css
/* Primary */
bg-emerald-500 hover:bg-emerald-600 text-emerald-600

/* Secondary */
bg-amber-500 hover:bg-amber-600 text-amber-600

/* Neutral */
bg-slate-50 bg-slate-100 bg-slate-900
text-slate-900 text-slate-600 text-slate-400
border-slate-200 dark:border-slate-800
```

### Difficulty Badges

- Easy: `text-emerald-600 dark:text-emerald-400`
- Medium: `text-amber-600 dark:text-amber-400`
- Hard: `text-red-500 dark:text-red-400`

## Typography

| Role | Font | Usage |
|------|------|-------|
| Heading | Inter | Page titles, section headers |
| Body | Inter | Paragraphs, descriptions |
| Mono | JetBrains Mono | Code, timers, technical values |

### Font Setup

Add to your HTML `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

Or in CSS:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
```

### Tailwind Configuration

```css
/* In your CSS */
body {
  font-family: 'Inter', sans-serif;
}

.font-mono {
  font-family: 'JetBrains Mono', monospace;
}
```

## Dark Mode

All components support dark mode using Tailwind's `dark:` variants:

```css
bg-white dark:bg-slate-900
text-slate-900 dark:text-slate-100
border-slate-200 dark:border-slate-800
```

## Responsive Breakpoints

Use Tailwind's standard breakpoints:

- `sm:` - 640px (small)
- `md:` - 768px (medium/tablet)
- `lg:` - 1024px (large/desktop)
- `xl:` - 1280px (extra large)
