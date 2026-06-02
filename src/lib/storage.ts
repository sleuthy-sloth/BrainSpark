"use client";

/* ─── Types ─────────────────────────────────────────── */

export type GameId = "math-quiz" | "memory-match" | "speed-reaction" | "word-scramble";

export interface GameResult {
  id: string;
  gameId: GameId;
  score: number;
  maxScore: number;
  accuracy: number;
  difficulty: string;
  duration: number;        // seconds
  timestamp: number;       // Date.now()
}

export interface GameStats {
  totalPlays: number;
  bestScore: number;
  bestAccuracy: number;
  averageScore: number;
  averageAccuracy: number;
  recentResults: GameResult[];
  streak: number;           // consecutive days played
  lastPlayedDate: string;   // YYYY-MM-DD
}

/* ─── Storage ───────────────────────────────────────── */

const STORAGE_PREFIX = "brainspark_";

function getAllResults(): GameResult[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}results`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setAllResults(results: GameResult[]): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}results`, JSON.stringify(results));
  } catch { /* quota exceeded — silently fail */ }
}

export function saveResult(result: Omit<GameResult, "id" | "timestamp">): void {
  const entry: GameResult = {
    ...result,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  const all = getAllResults();
  all.push(entry);
  // Keep last 500 results max
  if (all.length > 500) all.splice(0, all.length - 500);
  setAllResults(all);
}

export function getGameStats(gameId: GameId): GameStats {
  const all = getAllResults();
  const filtered = all.filter((r) => r.gameId === gameId);

  if (filtered.length === 0) {
    return {
      totalPlays: 0,
      bestScore: 0,
      bestAccuracy: 0,
      averageScore: 0,
      averageAccuracy: 0,
      recentResults: [],
      streak: 0,
      lastPlayedDate: "",
    };
  }

  const sorted = [...filtered].sort((a, b) => b.timestamp - a.timestamp);
  const totalPlays = sorted.length;
  const bestScore = Math.max(...sorted.map((r) => r.score));
  const bestAccuracy = Math.max(...sorted.map((r) => r.accuracy));
  const averageScore = Math.round(sorted.reduce((s, r) => s + r.score, 0) / totalPlays);
  const averageAccuracy = Math.round(
    sorted.reduce((s, r) => s + r.accuracy, 0) / totalPlays
  );

  return {
    totalPlays,
    bestScore,
    bestAccuracy,
    averageScore,
    averageAccuracy,
    recentResults: sorted.slice(0, 10),
    streak: 0,
    lastPlayedDate: "",
  };
}

export function getAllGamesStats(): Record<GameId, GameStats> {
  const ids: GameId[] = ["math-quiz", "memory-match", "speed-reaction", "word-scramble"];
  const result = {} as Record<GameId, GameStats>;
  for (const id of ids) result[id] = getGameStats(id);
  return result;
}

export function getTotalPlays(): number {
  return getAllResults().length;
}

export function getOverallBestScore(): number {
  const all = getAllResults();
  if (all.length === 0) return 0;
  return Math.max(...all.map((r) => r.score));
}
