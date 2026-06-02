# NeuralPulse ✦

**Daily brain training. Sharpen your edge.**

NeuralPulse is an open-source brain training web app — think Elevate or Lumosity, but free, open, and playable entirely in your browser on desktop or mobile.

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

## Features

- **Dark theme** — easy on the eyes, with glassmorphism cards and subtle gradients
- **Stats tracking** — all scores saved locally, view progress per game
- **Mobile-first** — touch-optimized, responsive layout
- **No account needed** — everything runs client-side in your browser
- **Free & open source** — CC BY-NC 4.0 licensed

## Tech Stack

- **Next.js 16** — static export via GitHub Pages
- **TypeScript** — full type safety
- **Tailwind CSS** — utility-first styling
- **IndexedDB + localStorage** — game results stored locally, works fully offline
- **Supabase** — optional account sync (Google OAuth / email magic link)

## Development

```bash
npm install
npm run dev      # local dev server
npm run build    # static export to ./out
```

## Live Site

👉 **[sleuthy-sloth.github.io/NeuralPulse](https://sleuthy-sloth.github.io/NeuralPulse/)**

## License

CC BY-NC 4.0 — see [LICENSE.md](./LICENSE.md).
