import type { GameId } from "./db";

/**
 * Shared daily game selection logic used by both the daily challenge
 * (deterministic, date-seeded) and the daily workout (proficiency-weighted).
 */

/** Snake_case identifier used for daily challenge game types */
export type DailyGameId = "math_sprint" | "memory_match" | "speed_tap" | "word_twist" | "sequence_memory" | "quick_equations" | "memory_matrix" | "stroop_match" | "digit_span" | "flanker_task" | "reaction_grid";

/** All games eligible for daily challenge / workout selection */
export const DAILY_GAME_POOL: GameId[] = [
  "math-quiz",
  "memory-match",
  "speed-tap",
  "word-scramble",
  "sequence-memory",
  "quick-equations",
  "memory-matrix",
  "stroop-match",
  "digit-span",
  "flanker-task",
  "reaction-grid",
];

/** Map from app GameId to daily challenge snake_case ID */
const GAME_ID_TO_DAILY: Record<GameId, string> = {
  "math-quiz": "math_sprint",
  "memory-match": "memory_match",
  "speed-tap": "speed_tap",
  "word-scramble": "word_twist",
  "sequence-memory": "sequence_memory",
  "quick-equations": "quick_equations",
  "memory-matrix": "memory_matrix",
  "stroop-match": "stroop_match",
  "digit-span": "digit_span",
  "flanker-task": "flanker_task",
  "reaction-grid": "reaction_grid",
  "star-battle": "star_battle",
  "pattern-matrix": "pattern_matrix",
};

/**
 * Pick N games from the daily pool.
 *
 * @param count - Number of games to pick
 * @param dateStr - If provided, uses deterministic date-based selection (daily challenge).
 *                  If omitted, uses random selection (workout).
 * @returns Array of GameId, length = min(count, pool size)
 */
export function pickDailyGames(count: number, dateStr?: string): GameId[] {
  const pool = [...DAILY_GAME_POOL];

  if (dateStr) {
    // Deterministic: use date as seed (like Wordle)
    const seed = dateStr
      .split("")
      .reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 7) * 31, 0);
    // Fisher-Yates shuffle with seeded random
    const rng = createRng(seed);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
  } else {
    // Random shuffle for workout
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
  }

  return pool.slice(0, count);
}

/**
 * Pick N daily game IDs (snake_case) from the daily pool.
 * Used by generateDailySequence which needs DailyGameId type.
 */
export function pickDailyGameIds(count: number, dateStr?: string): DailyGameId[] {
  return pickDailyGames(count, dateStr).map((id) => GAME_ID_TO_DAILY[id] as DailyGameId);
}

/**
 * Create a seedable pseudo-random number generator (mulberry32).
 */
function createRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
