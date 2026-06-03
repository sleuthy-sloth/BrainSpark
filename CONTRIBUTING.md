# Contributing to NeuralPulse

Thanks for your interest in NeuralPulse! 🧠

## How to Contribute

### 🐛 Bug Reports

Open an [issue](https://github.com/sleuthy-sloth/NeuralPulse/issues/new?template=bug_report.yaml) and include:

- Steps to reproduce
- Expected vs actual behavior
- Browser/device info
- Screenshots or screen recordings if relevant

### ✨ Feature Requests

Open a [feature request](https://github.com/sleuthy-sloth/NeuralPulse/issues/new?template=feature_request.yaml) describing:

- What you want to add
- Why it's valuable
- How it might work

### 🛠️ Pull Requests

1. Fork the repo and create a branch from `main`
2. Install dependencies: `npm install`
3. Make your changes
4. Run `npm run lint` and fix any issues
5. Run `npm run build` to verify it compiles
6. Open a PR against `main` with a clear description

### 🎮 Adding a New Game

See the [CLAUDE.md](CLAUDE.md) file for the full 8-step checklist. The key files to touch are:

1. `src/components/games/GameName.tsx` — game component
2. `src/app/games/game-name/page.tsx` — Suspense-wrapped page
3. `src/lib/db.ts` — GameId type and mappings
4. `src/store/index.ts` — GAMES_META entry
5. `src/lib/dailyChallenge.ts` — DailyGameId and GAME_POOL
6. `src/lib/statsEngine.ts` — SKILL_DEFS group
7. `README.md` — game table
8. Build: `npm run build`

### ✅ Guidelines

- **Offline-first**: Games must work without network access
- **Touch-friendly**: All targets ≥44×44px
- **Mobile-first**: Test on small viewports
- **GPU-friendly**: Animations should use only `transform`/`opacity`
- **No libraries for charts**: Hand-rolled SVG only
- **No auth walls**: Guest mode must always be available

## Development Setup

```bash
npm install
npm run dev    # local dev at http://localhost:3000
npm run build  # production build
```

## Code of Conduct

Please note the [Code of Conduct](CODE_OF_CONDUCT.md). Be excellent to each other.
