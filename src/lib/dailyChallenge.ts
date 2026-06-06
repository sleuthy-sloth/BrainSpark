/**
 * Deterministic seed generation for daily challenges.
 * Same date → same seed → same game sequence for every user.
 */

export type DailyGameId = "math_sprint" | "memory_match" | "speed_tap" | "word_twist" | "sequence_memory" | "quick_equations" | "memory_matrix" | "stroop_match" | "digit_span" | "flanker_task" | "reaction_grid";

export interface DailyGame {
  game: DailyGameId;
  difficulty: "easy" | "medium" | "hard";
  seed: number;
}

const GAME_POOL: DailyGameId[] = ["math_sprint", "memory_match", "speed_tap", "word_twist", "sequence_memory", "quick_equations", "memory_matrix", "stroop_match", "digit_span", "flanker_task", "reaction_grid"];
const DIFFICULTIES = ["easy", "medium", "hard"] as const;

/**
 * Simple seeded hash from a date string like "2026-06-02".
 * Produces the same number for the same string every time.
 */
export function getDailySeed(dateStr: string): number {
  return dateStr
    .split("")
    .reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 7) * 31, 0);
}

/**
 * Generate a deterministic 3-game sequence for a given date.
 * Same date → same sequence for all users (like Wordle).
 */
export function generateDailySequence(dateStr: string): DailyGame[] {
  const seed = getDailySeed(dateStr);

  // Pick 3 of 11 games deterministically, with difficulty
  const poolSize = GAME_POOL.length;
  const games: DailyGame[] = [
    {
      game: GAME_POOL[seed % poolSize],
      difficulty: DIFFICULTIES[seed % 3],
      seed: seed,
    },
    {
      game: GAME_POOL[(seed + 1) % poolSize],
      difficulty: DIFFICULTIES[(seed + 2) % 3],
      seed: seed + 1,
    },
    {
      game: GAME_POOL[(seed + 2) % poolSize],
      difficulty: DIFFICULTIES[(seed + 1) % 3],
      seed: seed + 2,
    },
  ];

  // Deduplicate — if any game is repeated, replace with the missing game
  const seen = new Set<DailyGameId>();
  const result: DailyGame[] = [];
  const missing = GAME_POOL.filter((g) => !games.some((dg) => dg.game === g));

  for (const g of games) {
    if (!seen.has(g.game)) {
      seen.add(g.game);
      result.push(g);
    }
  }
  // Fill any gaps with missing games
  while (result.length < 3) {
    const m = missing[result.length - 1];
    if (m) {
      result.push({
        game: m,
        difficulty: DIFFICULTIES[(seed + result.length) % 3],
        seed: seed + result.length + 10,
      });
    }
  }

  return result;
}

/**
 * Get today's date as YYYY-MM-DD in UTC.
 */
export function getTodayUTC(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/**
 * Get tomorrow's date as YYYY-MM-DD in UTC.
 */
export function getTomorrowUTC(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/**
 * Map from our DailyGameId to the app's route path.
 */
export function dailyGameRoute(game: DailyGameId): string {
  const map: Record<DailyGameId, string> = {
    math_sprint: "/games/math-quiz",
    memory_match: "/games/memory-match",
    speed_tap: "/games/speed-tap",
    word_twist: "/games/word-scramble",
    sequence_memory: "/games/sequence-memory",
    quick_equations: "/games/quick-equations",
    memory_matrix: "/games/memory-matrix",
    stroop_match: "/games/stroop-match",
    digit_span: "/games/digit-span",
    flanker_task: "/games/flanker-task",
    reaction_grid: "/games/reaction-grid",
  };
  return map[game];
}

/**
 * Map from our DailyGameId to the app's gameId for saveResult.
 */
export function dailyGameToAppId(game: DailyGameId): string {
  const map: Record<DailyGameId, string> = {
    math_sprint: "math-quiz",
    memory_match: "memory-match",
    speed_tap: "speed-tap",
    word_twist: "word-scramble",
    sequence_memory: "sequence-memory",
    quick_equations: "quick-equations",
    memory_matrix: "memory-matrix",
    stroop_match: "stroop-match",
    digit_span: "digit-span",
    flanker_task: "flanker-task",
    reaction_grid: "reaction-grid",
  };
  return map[game];
}

/**
 * Human-readable names for daily games.
 */
export const DAILY_GAME_NAMES: Record<DailyGameId, string> = {
  math_sprint: "Math Sprint",
  memory_match: "Memory Match",
  speed_tap: "Speed Tap",
  word_twist: "Word Twist",
  sequence_memory: "Sequence Memory",
  quick_equations: "Quick Equations",
  memory_matrix: "Memory Matrix",
  stroop_match: "Stroop Match",
  digit_span: "Digit Span",
  flanker_task: "Flanker Task",
  reaction_grid: "Reaction Grid",
};

export const DAILY_GAME_ICONS: Record<DailyGameId, string> = {
  math_sprint: "∑",
  memory_match: "◆",
  speed_tap: "⚡",
  word_twist: "✦",
  sequence_memory: "◈",
  quick_equations: "∑",
  memory_matrix: "◆",
  stroop_match: "◉",
  digit_span: "🔢",
  flanker_task: "◉",
  reaction_grid: "⚡",
};

export const DAILY_GAME_COLORS: Record<DailyGameId, string> = {
  math_sprint: "var(--accent-blue)",
  memory_match: "var(--accent-green)",
  speed_tap: "var(--accent-amber)",
  word_twist: "var(--accent-violet)",
  sequence_memory: "var(--accent-green)",
  quick_equations: "var(--accent-blue)",
  memory_matrix: "var(--accent-green)",
  stroop_match: "var(--accent-rose)",
  digit_span: "var(--accent-green)",
  flanker_task: "var(--accent-rose)",
  reaction_grid: "var(--accent-amber)",
};

export const DAILY_GAME_CATEGORIES: Record<DailyGameId, string> = {
  math_sprint: "Numeracy",
  memory_match: "Memory",
  speed_tap: "Reflexes",
  word_twist: "Vocabulary",
  sequence_memory: "Memory",
  quick_equations: "Numeracy",
  memory_matrix: "Memory",
  stroop_match: "Focus",
  digit_span: "Memory",
  flanker_task: "Focus",
  reaction_grid: "Reflexes",
};

/**
 * Create a seedable pseudo-random number generator.
 * Based on mulberry32 — returns a function that produces [0, 1).
 */
export function createRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
