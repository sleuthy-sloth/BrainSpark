# NeuralPulse ✦

**Daily brain training. Sharpen your edge.**

NeuralPulse is an open-source brain training web app — think Elevate or Lumosity, but free, open, and playable entirely in your browser on desktop or mobile.

## Live Site

👉 **[neuralpulse.app](https://neuralpulse.app)**

## Games

| Game | Skill | Description |
|------|-------|-------------|
| **Quick Equations** | Numeracy | True or false? Rapidly verify math equations under time pressure. |
| **Math Sprint** | Numeracy | Solve arithmetic problems against the clock. 3 difficulty levels. |
| **Memory Match** | Memory | Flip cards and find matching pairs. Train your visual short-term memory. |
| **Memory Matrix** | Memory | Memorize highlighted tiles and reproduce the pattern on an expanding grid. |
| **Sequence Memory** | Memory | Watch tiles light up in a sequence, then tap them back in order. Simon-style. |
| **Stroop Match** | Focus | Identify the ink color, not the word itself. |
| **Speed Tap** | Reflexes | React as fast as you can when the signal changes. Measure your response time. |
| **Word Twist** | Vocabulary | Unscramble letters to form words. Expand your mental agility. |
| **Star Battle** | Logic | Place one star in each row, column, and region. No two stars may touch. |
| **Digit Span** | Memory | Remember and recall sequences of digits. Gets harder each round! |
| **Flanker Task** | Focus | Identify the center arrow while ignoring distracting flanking arrows. |
| **Reaction Grid** | Reflexes | Tap targets that appear on a grid as fast as you can! |
| **Pattern Matrix** | Logic | Find the missing piece in a 3x3 pattern. Raven's matrices style. |

## Project Status

[![GitHub](https://img.shields.io/github/license/sleuthy-sloth/NeuralPulse)](LICENSE)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)
[![CI](https://github.com/sleuthy-sloth/NeuralPulse/actions/workflows/ci.yml/badge.svg)](https://github.com/sleuthy-sloth/NeuralPulse/actions/workflows/ci.yml)

## Features

- **13 brain games** — memory, math, reflexes, vocabulary, focus, and logic challenges
- **Daily Challenge** — 3-game sequence, same for everyone (like Wordle)
- **Dark theme** — easy on the eyes, with glassmorphism cards and subtle gradients
- **Stats dashboard** — skill radar charts, trend sparklines, calendar heatmap, personal bests
- **Streak tracking** — consecutive daily completions with heatmap calendar
- **Share scores** — Wordle-style text card for daily challenge results
- **Guest mode** — everything works offline in IndexedDB
- **Optional account** — sync progress across devices via Supabase (Google OAuth / magic link)
- **Mobile-first** — touch-optimized, PWA installable, safe-area-aware
- **Free & open source** — CC BY-NC 4.0 licensed

## Tech Stack

- **Next.js 16** — server-rendered React, deployed on Vercel
- **TypeScript** — full type safety
- **Tailwind CSS** — utility-first styling
- **Zustand** — lightweight global state (progress, toasts)
- **IndexedDB (idb)** — offline-first game storage
- **Supabase** — optional account sync (Postgres + Auth)
- **Vercel** — hosting with auto-deploy from `main`

## Self-Hosting

To run NeuralPulse locally or deploy your own instance:

1. **Clone the repo:**
   ```bash
   git clone https://github.com/sleuthy-sloth/NeuralPulse.git
   cd NeuralPulse
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Supabase (optional — app works without it for guest mode):**
   - Create a project at [supabase.com](https://supabase.com)
   - Run the migration in `supabase/migrations/001_initial_schema.sql` via the SQL Editor
   - Enable Google OAuth + Email Magic Link in Auth → Providers
   - Copy your project URL and anon key

4. **Configure environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

5. **Run locally:**
   ```bash
   npm run dev
   ```

6. **Deploy to Vercel:**
   - Push to GitHub → Vercel auto-deploys from `main`
   - Set environment variables in Vercel dashboard:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Configure Supabase Auth redirect URLs to point to your Vercel domain

## Development

```bash
npm run dev      # local dev server
npm run build    # production build
```

## License

CC BY-NC 4.0 — see [LICENSE](./LICENSE).
