import { describe, it, expect } from "vitest";
import type { GameResult, GameId } from "../db";
import {
  aggregateByGame,
  calculateSkillScores,
  getTrendData,
  calculateRank,
  getBestDailyScore,
  getStreakHistory,
} from "../statsEngine";

// ─── Helpers ──────────────────────────────────────────

function makeSession(overrides: Partial<GameResult> & { gameId: GameId }): GameResult {
  return {
    id: crypto.randomUUID(),
    score: 100,
    maxScore: 200,
    accuracy: 75,
    difficulty: "medium",
    duration: 30,
    timestamp: Date.now(),
    ...overrides,
  };
}

// ─── aggregateByGame ──────────────────────────────────

describe("aggregateByGame", () => {
  it("returns stats for all games even with no sessions", () => {
    const result = aggregateByGame([]);
    expect(result.length).toBeGreaterThan(0);
    for (const stat of result) {
      expect(stat.totalPlays).toBe(0);
      expect(stat.bestScore).toBe(0);
      expect(stat.avgScore).toBe(0);
    }
  });

  it("correctly aggregates sessions for a single game", () => {
    const sessions: GameResult[] = [
      makeSession({ gameId: "math-quiz", score: 100, accuracy: 80 }),
      makeSession({ gameId: "math-quiz", score: 200, accuracy: 90 }),
      makeSession({ gameId: "math-quiz", score: 150, accuracy: 85 }),
    ];
    const result = aggregateByGame(sessions);
    const mathStats = result.find((s) => s.gameId === "math-quiz")!;
    expect(mathStats.totalPlays).toBe(3);
    expect(mathStats.bestScore).toBe(200);
    expect(mathStats.bestAccuracy).toBe(90);
    expect(mathStats.avgScore).toBe(150);
    expect(mathStats.avgAccuracy).toBe(85);
    expect(mathStats.cumulativeScore).toBe(450);
  });

  it("tracks difficulty bests separately", () => {
    const sessions: GameResult[] = [
      makeSession({ gameId: "math-quiz", score: 100, difficulty: "easy" }),
      makeSession({ gameId: "math-quiz", score: 200, difficulty: "hard" }),
      makeSession({ gameId: "math-quiz", score: 150, difficulty: "easy" }),
    ];
    const result = aggregateByGame(sessions);
    const mathStats = result.find((s) => s.gameId === "math-quiz")!;
    expect(mathStats.difficultyBests["easy"]).toBe(150);
    expect(mathStats.difficultyBests["hard"]).toBe(200);
  });

  it("counts last week plays correctly", () => {
    const now = Date.now();
    const sessions: GameResult[] = [
      makeSession({ gameId: "math-quiz", timestamp: now - 86400000 }), // 1 day ago
      makeSession({ gameId: "math-quiz", timestamp: now - 86400000 * 3 }), // 3 days ago
      makeSession({ gameId: "math-quiz", timestamp: now - 86400000 * 10 }), // 10 days ago
    ];
    const result = aggregateByGame(sessions);
    const mathStats = result.find((s) => s.gameId === "math-quiz")!;
    expect(mathStats.lastWeekPlays).toBe(2);
  });
});

// ─── calculateSkillScores ─────────────────────────────

describe("calculateSkillScores", () => {
  it("returns 0 for all skills with no sessions", () => {
    const result = calculateSkillScores([]);
    for (const skill of result) {
      expect(skill.score).toBe(0);
    }
  });

  it("calculates skill scores from sessions", () => {
    const sessions: GameResult[] = [
      makeSession({ gameId: "math-quiz", accuracy: 80 }),
      makeSession({ gameId: "quick-equations", accuracy: 90 }),
    ];
    const result = calculateSkillScores(sessions);
    const numeracy = result.find((s) => s.skill === "Numeracy")!;
    expect(numeracy.score).toBeGreaterThan(0);
    expect(numeracy.score).toBeLessThanOrEqual(100);
  });

  it("double-weights recent sessions", () => {
    const now = Date.now();
    const oldSessions: GameResult[] = [
      makeSession({ gameId: "math-quiz", accuracy: 50, timestamp: now - 86400000 * 10 }),
    ];
    const recentSessions: GameResult[] = [
      makeSession({ gameId: "math-quiz", accuracy: 90, timestamp: now - 86400000 }),
    ];
    const oldScore = calculateSkillScores(oldSessions).find((s) => s.skill === "Numeracy")!.score;
    const recentScore = calculateSkillScores(recentSessions).find((s) => s.skill === "Numeracy")!.score;
    expect(recentScore).toBeGreaterThan(oldScore);
  });
});

// ─── getTrendData ─────────────────────────────────────

describe("getTrendData", () => {
  it("returns stable direction for insufficient data", () => {
    const sessions: GameResult[] = [
      makeSession({ gameId: "math-quiz", score: 100 }),
      makeSession({ gameId: "math-quiz", score: 110 }),
      makeSession({ gameId: "math-quiz", score: 105 }),
    ];
    const result = getTrendData(sessions, "math-quiz");
    expect(result.direction).toBe("stable");
    expect(result.points.length).toBe(3);
  });

  it("detects upward trend", () => {
    const sessions: GameResult[] = Array.from({ length: 10 }, (_, i) =>
      makeSession({ gameId: "math-quiz", score: 50 + i * 20, timestamp: Date.now() + i * 1000 })
    );
    const result = getTrendData(sessions, "math-quiz");
    expect(result.direction).toBe("up");
    expect(result.directionPct).toBeGreaterThan(5);
  });

  it("detects downward trend", () => {
    const sessions: GameResult[] = Array.from({ length: 10 }, (_, i) =>
      makeSession({ gameId: "math-quiz", score: 250 - i * 20, timestamp: Date.now() + i * 1000 })
    );
    const result = getTrendData(sessions, "math-quiz");
    expect(result.direction).toBe("down");
    expect(result.directionPct).toBeLessThan(-5);
  });

  it("limits to last N sessions", () => {
    const sessions: GameResult[] = Array.from({ length: 20 }, (_, i) =>
      makeSession({ gameId: "math-quiz", score: 100 + i, timestamp: Date.now() + i * 1000 })
    );
    const result = getTrendData(sessions, "math-quiz", 5);
    expect(result.points.length).toBe(5);
  });
});

// ─── calculateRank ────────────────────────────────────

describe("calculateRank", () => {
  it("returns Newcomer for no plays", () => {
    const result = calculateRank([]);
    expect(result.title).toBe("Newcomer");
  });

  it("returns Growing for minimal plays", () => {
    const stats = [
      { totalPlays: 2, avgAccuracy: 30 } as any,
    ];
    const result = calculateRank(stats);
    expect(result.title).toBe("Growing");
  });

  it("returns Sharp for moderate accuracy and plays", () => {
    const stats = [
      { totalPlays: 10, avgAccuracy: 60 } as any,
    ];
    const result = calculateRank(stats);
    expect(result.title).toBe("Sharp");
  });

  it("returns Elite for high accuracy and plays", () => {
    const stats = [
      { totalPlays: 25, avgAccuracy: 75 } as any,
    ];
    const result = calculateRank(stats);
    expect(result.title).toBe("Elite");
  });

  it("returns Genius for very high accuracy and many plays", () => {
    const stats = [
      { totalPlays: 60, avgAccuracy: 90 } as any,
    ];
    const result = calculateRank(stats);
    expect(result.title).toBe("Genius");
  });
});

// ─── getBestDailyScore ────────────────────────────────

describe("getBestDailyScore", () => {
  it("returns 0 for no completions", () => {
    expect(getBestDailyScore([], {})).toBe(0);
  });

  it("returns the best score from completed dates", () => {
    const dates = ["2026-06-01", "2026-06-02", "2026-06-03"];
    const scores = { "2026-06-01": 150, "2026-06-02": 300, "2026-06-03": 200 };
    expect(getBestDailyScore(dates, scores)).toBe(300);
  });

  it("handles missing scores gracefully", () => {
    const dates = ["2026-06-01", "2026-06-02"];
    const scores = { "2026-06-01": 100 };
    expect(getBestDailyScore(dates, scores)).toBe(100);
  });
});

// ─── getStreakHistory ─────────────────────────────────

describe("getStreakHistory", () => {
  it("returns 3 months of data", () => {
    const result = getStreakHistory([], []);
    expect(result.length).toBe(3);
  });

  it("correctly marks daily completion intensity", () => {
    const result = getStreakHistory([], ["2026-06-01"]);
    // Find the day in the result
    for (const month of result) {
      for (const day of month.days) {
        if (day.date === "2026-06-01") {
          expect(day.intensity).toBe("daily");
        }
      }
    }
  });

  it("marks high intensity for score > 500", () => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const sessions: GameResult[] = [
      makeSession({ gameId: "math-quiz", score: 600, timestamp: Date.now() }),
    ];
    const result = getStreakHistory(sessions, []);
    for (const month of result) {
      for (const day of month.days) {
        if (day.date === today) {
          expect(day.intensity).toBe("high");
        }
      }
    }
  });
});
