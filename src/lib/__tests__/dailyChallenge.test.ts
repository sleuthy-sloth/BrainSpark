import { describe, it, expect } from "vitest";
import {
  getDailySeed,
  generateDailySequence,
  createRng,
  getTodayUTC,
  getTomorrowUTC,
  dailyGameRoute,
  dailyGameToAppId,
  DAILY_GAME_NAMES,
} from "../dailyChallenge";

// ─── getDailySeed ─────────────────────────────────────

describe("getDailySeed", () => {
  it("returns the same seed for the same date", () => {
    expect(getDailySeed("2026-06-01")).toBe(getDailySeed("2026-06-01"));
  });

  it("returns different seeds for different dates", () => {
    const seed1 = getDailySeed("2026-06-01");
    const seed2 = getDailySeed("2026-06-02");
    expect(seed1).not.toBe(seed2);
  });

  it("returns a positive number", () => {
    expect(getDailySeed("2026-06-01")).toBeGreaterThan(0);
  });
});

// ─── generateDailySequence ────────────────────────────

describe("generateDailySequence", () => {
  it("returns exactly 3 games", () => {
    const result = generateDailySequence("2026-06-01");
    expect(result.length).toBe(3);
  });

  it("returns unique games (no duplicates)", () => {
    const result = generateDailySequence("2026-06-01");
    const gameIds = result.map((g) => g.game);
    const unique = new Set(gameIds);
    expect(unique.size).toBe(3);
  });

  it("is deterministic — same date produces same sequence", () => {
    const result1 = generateDailySequence("2026-06-01");
    const result2 = generateDailySequence("2026-06-01");
    expect(result1).toEqual(result2);
  });

  it("different dates produce different sequences", () => {
    const result1 = generateDailySequence("2026-06-01");
    const result2 = generateDailySequence("2026-07-15");
    const games1 = result1.map((g) => g.game).join(",");
    const games2 = result2.map((g) => g.game).join(",");
    expect(games1).not.toBe(games2);
  });

  it("each game has a valid difficulty", () => {
    const result = generateDailySequence("2026-06-01");
    for (const game of result) {
      expect(["easy", "medium", "hard"]).toContain(game.difficulty);
    }
  });

  it("each game has a seed", () => {
    const result = generateDailySequence("2026-06-01");
    for (const game of result) {
      expect(game.seed).toBeGreaterThan(0);
    }
  });

  it("all games are from the pool", () => {
    const pool = ["math_sprint", "memory_match", "speed_tap", "word_twist", "sequence_memory"];
    const result = generateDailySequence("2026-06-01");
    for (const game of result) {
      expect(pool).toContain(game.game);
    }
  });
});

// ─── createRng ────────────────────────────────────────

describe("createRng", () => {
  it("returns a function", () => {
    const rng = createRng(42);
    expect(typeof rng).toBe("function");
  });

  it("produces values in [0, 1)", () => {
    const rng = createRng(42);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("is deterministic — same seed produces same sequence", () => {
    const rng1 = createRng(42);
    const rng2 = createRng(42);
    for (let i = 0; i < 10; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it("different seeds produce different sequences", () => {
    const rng1 = createRng(42);
    const rng2 = createRng(99);
    const seq1 = Array.from({ length: 5 }, () => rng1());
    const seq2 = Array.from({ length: 5 }, () => rng2());
    expect(seq1).not.toEqual(seq2);
  });
});

// ─── getTodayUTC / getTomorrowUTC ─────────────────────

describe("getTodayUTC", () => {
  it("returns a valid YYYY-MM-DD string", () => {
    const result = getTodayUTC();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("getTomorrowUTC", () => {
  it("returns a valid YYYY-MM-DD string", () => {
    const result = getTomorrowUTC();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("tomorrow is one day after today", () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const expected = `${tomorrow.getUTCFullYear()}-${String(tomorrow.getUTCMonth() + 1).padStart(2, "0")}-${String(tomorrow.getUTCDate()).padStart(2, "0")}`;
    expect(getTomorrowUTC()).toBe(expected);
  });
});

// ─── dailyGameRoute ───────────────────────────────────

describe("dailyGameRoute", () => {
  it("maps all games to valid routes", () => {
    const games = ["math_sprint", "memory_match", "speed_tap", "word_twist", "sequence_memory"] as const;
    for (const game of games) {
      const route = dailyGameRoute(game);
      expect(route).toMatch(/^\/games\//);
    }
  });
});

// ─── dailyGameToAppId ─────────────────────────────────

describe("dailyGameToAppId", () => {
  it("maps all games to app IDs", () => {
    const games = ["math_sprint", "memory_match", "speed_tap", "word_twist", "sequence_memory"] as const;
    for (const game of games) {
      const id = dailyGameToAppId(game);
      expect(id.length).toBeGreaterThan(0);
    }
  });

  it("maps math_sprint to math-quiz", () => {
    expect(dailyGameToAppId("math_sprint")).toBe("math-quiz");
  });
});

// ─── DAILY_GAME_NAMES ─────────────────────────────────

describe("DAILY_GAME_NAMES", () => {
  it("has names for all pooled games", () => {
    const games = ["math_sprint", "memory_match", "speed_tap", "word_twist", "sequence_memory"];
    for (const game of games) {
      expect(DAILY_GAME_NAMES[game]).toBeTruthy();
    }
  });
});
