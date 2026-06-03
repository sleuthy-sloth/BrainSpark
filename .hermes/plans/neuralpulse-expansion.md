# Implementation Plan: NeuralPulse Expansion

## Slices (in order)

### 1. Foundation: Category System Fix
- Align Category type to 5 skills + Logic
- Recategorize Speed Tap → Reflexes, Word Twist → Vocabulary
- Update all files (db.ts, store, statsEngine, dailyChallenge)

### 2. Skill-Based Homepage
- Filter tabs at top
- Games grouped by skill with color-coded sections
- Updated GameCard with skill badge

### 3. Star Battle (Queens Puzzle) — Logic
- N×N grid with regions, place one star per row/col/region
- No adjacent stars (including diagonals)

### 4. Digit Span — Memory
- Recall increasingly long digit sequences forward and backward

### 5. Flanker Task — Focus
- Identify center arrow direction ignoring flanking arrows

### 6. Reaction Grid — Reflexes
- Tap randomly appearing targets against the clock

### 7. Pattern Matrix — Logic
- Raven's Progressive Matrices style

### 8. Existing Game Polish
- Difficulty tiers
- Better end-game feedback
- Animated transitions
