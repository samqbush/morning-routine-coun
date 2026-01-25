# Morning Routine Timer - AI Agent Instructions

## Project Overview
A TV-optimized React timer app helping children follow morning and evening routines. Built for large screen readability (8+ feet viewing distance) with visual countdowns and activity progression.

## Architecture & Key Patterns

### Single-Component Design
All application logic lives in [src/App.tsx](../src/App.tsx) (~1200 lines). This is intentional for this simple app - avoid splitting into smaller components unless explicitly requested.

### Routine System
Routines are configuration-driven and loaded at runtime from [`public/routines.json`](../public/routines.json) via [`src/lib/routineLoader.ts`](../src/lib/routineLoader.ts).
- **Morning routines** and **evening routines** (e.g., school prep, ballet, karate days, bath days, game time) are defined as data in `routines.json` rather than hardcoded arrays or conditional logic in `App.tsx`.
- The loader is responsible for parsing the JSON, validating it against the expected schema, and exposing the routines to `App.tsx`.

Each configured step is a `RoutineStep` object with: `time`, `activity`, `description`, `timeInMinutes` (minutes since midnight), `icon`, `iconColor`, and `routineType: 'morning' | 'evening'`.

### Timer Logic
- Calculates current step by comparing `Date.now()` against `timeInMinutes`
- Handles edge cases: early access (before first step), late start (after last step), weekend detection
- Sound alerts and speech synthesis trigger at activity transitions

## UI Component Library

Using **shadcn/ui** (New York style) with Radix UI primitives:
- Import path alias: `@/components/ui/*`
- Config: [components.json](../components.json) defines aliases and icon library
- All UI components are pre-built in [src/components/ui/](../src/components/ui/)
- Icons: **Phosphor Icons** (`@phosphor-icons/react`) for routine step icons, Lucide (via shadcn/ui config) for UI elements

### Styling System
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin
- Custom theme defined in [theme.json](../theme.json) with Radix UI color tokens
- Utility function: `cn()` from [src/lib/utils.ts](../src/lib/utils.ts) for conditional class merging
- TV-optimized: Large text (48-72px headings), high contrast, generous padding (8-12 Tailwind units)

## Development Workflow

### Commands
```bash
npm run dev          # Start dev server on localhost:5173
npm run build        # TypeScript check + Vite build to dist/
npm run preview      # Test production build with /morning-routine-coun/ base path
npm run lint         # ESLint check
```

### Deployment
Automatic GitHub Pages deployment via [.github/workflows/deploy.yml](../.github/workflows/deploy.yml):
- Pushes to `main` → builds → deploys `dist/` to `gh-pages` branch
- Base path: `/morning-routine-coun/` (configured in [vite.config.ts](../vite.config.ts))
- Always test with `npm run preview` before pushing to verify routing works

### Path Aliasing
- `@/*` resolves to `src/*` (defined in [tsconfig.json](../tsconfig.json) and [vite.config.ts](../vite.config.ts))
- Use absolute imports: `import { Button } from '@/components/ui/button'`

## Project-Specific Conventions

### Color Strategy
Follows PRD triadic color scheme (bright, energetic):
- Primary: Morning Blue - urgency and alertness
- Secondary: Sunny Yellow & Warm Orange - highlights and action
- Success: Fresh Green - completion indicators
- All color combinations meet WCAG AA contrast ratios for TV viewing

### Adding New Routine Steps
1. Define `RoutineStep` object with all required fields
2. Calculate `timeInMinutes` as `(hours * 60) + minutes` (24-hour format)
3. Choose icon from Phosphor Icons library and assign semantic color
4. Set `routineType: 'morning'` or `'evening'`
5. Add to appropriate routine array or `createEveningRoutine()` conditional logic

### Audio Features
App uses Web Audio API and Speech Synthesis:
- Sound alerts play on activity transitions
- Text-to-speech announces activities
- Mute toggle stored in component state (not persisted)

## Critical Files

- [src/App.tsx](../src/App.tsx) - Entire application logic and UI
- [PRD.md](../PRD.md) - Product requirements with design rationale
- [vite.config.ts](../vite.config.ts) - Build config with base path for GitHub Pages
- [components.json](../components.json) - shadcn/ui configuration
- [theme.json](../theme.json) - Custom color palette and design tokens

## Common Tasks

**Modifying morning schedule**: Edit `WEEKDAY_MORNING_ROUTINE` or `SATURDAY_MORNING_ROUTINE` arrays  
**Changing evening logic**: Update `createEveningRoutine()` conditional blocks  
**Adjusting TV text sizes**: Modify Tailwind text classes in App.tsx (currently `text-6xl`, `text-5xl`, etc.)  
**Adding UI components**: Run `npx shadcn@latest add [component-name]` (auto-configures with existing setup)

## What NOT to Do

- Don't refactor App.tsx into smaller components unless asked - single-file is intentional
- Don't use Lucide icons for routine step icons - use Phosphor Icons for consistency  
- Don't change base path in vite.config.ts without updating deployment workflow
- Don't add testing frameworks or complex state management - this is intentionally a simple app
