# NeuralPulse — Architecture & Onboarding

## Overview

NeuralPulse is a brain training web app built with Next.js 16 (App Router), deployed on Vercel. It's a client-side SPA with optional Supabase sync. Everything works offline for guest users.

## Key Architecture Decisions

- **Static generation + client data**: Pages are statically generated at build time; game results and progress are loaded client-side from IndexedDB
- **Offline-first**: Game results always go to IndexedDB first; Supabase sync is additive
- **Guest mode**: No auth walls. Guest flag in localStorage allows full gameplay
- **Deterministic daily challenges**: Same date → same seed → same game sequence for all users
- **No chart libraries**: All visualizations (radar, sparklines, calendar) are hand-rolled SVG
- **Toast system**: Lightweight Zustand slice + fixed-position div — no library

## Project Structure

```
src/
├── app/
│   ├── games/           # Game pages (one per game, Suspense-wrapped)
│   │   ├── math-quiz/
│   │   ├── memory-match/
│   │   ├── memory-matrix/
│   │   ├── quick-equations/
│   │   ├── sequence-memory/
│   │   ├── speed-reaction/
│   │   ├── stroop-match/
│   │   └── word-scramble/
│   ├── daily/           # Daily Challenge page
│   ├── daily-workout/   # AI-recommended workout page
│   ├── stats/           # Stats dashboard
│   ├── auth/            # Supabase auth callback
│   ├── layout.tsx       # Root layout (metadata, OG tags, viewport)
│   ├── RootClient.tsx   # Client wrapper (auth provider, toasts, install prompt)
│   └── page.tsx         # Homepage (game grid + daily banner)
├── components/
│   ├── games/           # Game component implementations
│   ├── stats/           # Stats dashboard components
│   ├── AuthModal.tsx    # Google OAuth / magic link / guest
│   ├── AuthProvider.tsx # Auth context
│   ├── GameCard.tsx     # Homepage game card
│   ├── NavBar.tsx       # Top navigation (back + stats link)
│   ├── ErrorBoundary.tsx
│   ├── Skeleton.tsx
│   ├── ToastNotification.tsx
│   ├── ShareScore.tsx
│   ├── InstallPrompt.tsx
│   ├── DailyCountdown.tsx
│   ├── DailyStreak.tsx
│   └── UserMenu.tsx
├── lib/
│   ├── db.ts            # IndexedDB layer (results, proficiency, daily, settings, Supabase sync)
│   ├── storage.ts       # (Re-exports from db.ts)
│   ├── dailyChallenge.ts # Seeded RNG, sequence generation, game mappings
│   ├── streaks.ts       # Streak calculation (localStorage + Supabase)
│   ├── statsEngine.ts   # Pure data functions (aggregation, skills, trends, calendar)
│   ├── supabase.ts      # Supabase client + getUser helper
│   └── useSeedParams.ts # Hook for ?seed & ?daily URL params
├── store/
│   └── index.ts         # Zustand store (progress, game state, toasts)
└── engine/
    └── GameWrapper.tsx   # Shared game lifecycle (timer, scoring, phases)
```

## Environment Variables

Required for Supabase auth/sync (app works without them for guest mode):

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | For auth | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | For auth | Supabase anon/public key |

Set in `.env.local` for local dev, Vercel dashboard for production.

## Supabase Schema

Migration file: `supabase/migrations/001_initial_schema.sql`

Tables:
- `profiles` — user profiles, streak tracking, last_played_date
- `game_sessions` — individual game results (game_type, score, duration, difficulty)
- `daily_challenges` — daily challenge definitions (date, game_sequence JSON)
- `daily_completions` — which challenges each user completed (date, total_score)

Row-Level Security is enabled on all tables with policies scoped to `auth.uid()`.

## Daily Challenge Seeding

The daily challenge system uses deterministic seeds so all users see the same 3-game sequence on the same day (like Wordle).

```
Date string (e.g. "2026-06-02")
    → getDailySeed() → numeric seed
    → generateDailySequence(seed) → 3 DailyGame objects {game, difficulty, seed}
    → each game gets seed param in URL → game component createsRng(seed)
```

**File chain:**
1. `dailyChallenge.ts` generates the sequence + provides `createRng(seed)` (mulberry32)
2. `daily/page.tsx` generates the sequence and navigates to games with `?seed=N`
3. Game components use `useSeedParams()` hook → `createRng(seed)` for deterministic play

## Adding a New Game

Touch all 8 files in this order:

1. `src/components/games/GameName.tsx` — game component
2. `src/app/games/game-name/page.tsx` — Suspense-wrapped page
3. `src/lib/db.ts` — GameId type, GAME_CATEGORIES, gamesByCat, mapGameType
4. `src/store/index.ts` — GAMES_META entry
5. `src/lib/dailyChallenge.ts` — DailyGameId, GAME_POOL, routes, names, icons
6. `src/lib/statsEngine.ts` — SKILL_DEFS group
7. `README.md` — game table
8. Build: `npm run build`

## Deployment

- **Platform**: Vercel (auto-deploy from `main`)
- **CI**: `.github/workflows/ci.yml` — build check on every PR/push
- **Env vars**: Set in Vercel project settings

## Key Constraints

- All pages are static (`○` in build output) — data loads client-side
- `useSearchParams` consumers must be wrapped in `<Suspense>` (Next.js requirement)
- IndexedDB version must be bumped (DB_VERSION) when adding new stores
- Touch targets ≥44×44px, safe areas via `env(safe-area-inset-*)`
- Animations use only `transform`/`opacity` for GPU performance
- Text inputs must have `text-base` (16px) to prevent iOS zoom
