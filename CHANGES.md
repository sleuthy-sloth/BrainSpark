# NeuralPulse Mobile & Desktop Audit — CHANGES.md

## 1. Touch Targets (44×44px minimum)

- **NavBar back button**: `w-9 h-9` → `w-11 h-11 min-w-[44px] min-h-[44px]` (was 36px, below threshold)
- **`.btn` base class**: Added `min-width: 44px; min-height: 44px` so all buttons meet the threshold
- **GameCard icon area**: Added `min-w-[44px] min-h-[44px]` to the icon container
- **Memory Match cards**: Added `min-h-[56px] min-w-[56px]` — well above 44px on small screens
- **InstallPrompt dismiss button**: Added `min-w-[44px] min-h-[44px]`

## 2. Viewport & Layout

- **`viewport` meta**: Added `viewportFit: "cover"` so `env(safe-area-*)` variables work on iOS
- **Body base**: Added `min-height: -webkit-fill-available` for iOS Safari viewport consistency
- **Speed Tap circle**: Changed `w-64 h-64` (256px) → `w-[min(80vw,320px)] h-[min(80vw,320px)]` and added `min-h-[40dvh]` so it fills 40%+ of viewport height on all screens
- **Memory Match grid**: Cards use `min-w-[56px] min-h-[56px]` preventing tiny cards on small viewports

## 3. Keyboard & Input

- **Word Twist input**: Added `autoComplete="off"`, `autoCorrect="off"`, `autoCapitalize="none"`, `spellCheck="false"` for proper mobile keyboard behavior; added `text-base` (`16px`) to prevent iOS zoom-on-focus
- **Speed Tap desktop**: Added `onKeyDown` handler for Space bar (`" "`, `"Spacebar"`, `"Space"`) as alternative to touch/click
- **Memory Match desktop**: Added full keyboard navigation — arrow keys move focus between cards, Enter/Space flips the focused card; `role="grid"`, `aria-label` on each card

## 4. Animations & Performance

- **`.glass-card` transition**: `transition: all 0.2s ease` → explicit `transform, opacity, background, border-color` (GPU-accelerated only)
- **`.btn` transition**: Explicit properties instead of `all`
- **`will-change: transform`**: Added to `.glass-card`, `.animate-fade-in`, `.animate-slide-up`, `.animate-scale-in`, `.animate-shake`, `.animate-slide-down`, `.stagger > *`, Speed Tap circle, Memory Match cards
- **`pulse-glow` animation**: Redesigned to animate `opacity` instead of `box-shadow` (box-shadow transitions are expensive on mobile GPU)

## 5. Safe Areas (Notch / Home Indicator)

- **Body**: Added `padding-top/right/bottom/left: env(safe-area-inset-*)` — ensures content clears the notch and home indicator on iPhone X+ and Android gesture bars
- **InstallPrompt**: Uses `padding-bottom: max(env(safe-area-inset-bottom), 8px)` so the bottom bar clears the home indicator
- **Utility class**: `.safe-area-bottom` added for any future bottom-anchored elements

## 6. PWA Install Experience

- **New component** `src/components/InstallPrompt.tsx`:
  - Listens for `beforeinstallprompt` event
  - Shows a custom install banner at screen bottom (glass card with NeuralPulse icon, "Install App" CTA, dismiss button)
  - Mobile-only (checks `navigator.userAgent`)
  - Dismiss sets `np_install_dismissed` timestamp in localStorage, suppresses banner for 7 days
  - Checks `display-mode: standalone` to avoid showing on already-installed PWAs
  - Uses slideUp animation, safe-area padding
- **Added to `RootClient.tsx`** so it renders on every page
- **Layout**: `appleWebApp` already configured (`capable`, `black-translucent` status bar)

## 7. Files Modified

| File | Changes |
|---|---|
| `src/app/globals.css` | Animation perf (explicit transitions, will-change, pulse-glow redesign), safe areas, touch targets, memory card focus style, install prompt animation |
| `src/app/layout.tsx` | Added `viewportFit: "cover"` |
| `src/app/RootClient.tsx` | Added `InstallPrompt` component |
| `src/components/NavBar.tsx` | Back button 36px → 44px minimum |
| `src/components/GameCard.tsx` | Icon area min 44px, card min-h-[72px] |
| `src/components/InstallPrompt.tsx` | **New** — PWA install banner |
| `src/app/games/word-scramble/page.tsx` | Input attributes (autocomplete/autocorrect/spellcheck), text-base font |
| `src/app/games/speed-reaction/page.tsx` | Responsive circle (80vw/40dvh min), Space bar support |
| `src/app/games/memory-match/page.tsx` | Arrow key navigation + Enter/Space, ARIA labels, role="grid", min card size |
