import { openDB, type IDBPDatabase } from "idb";

export type GameId = "math-quiz" | "memory-match" | "speed-reaction" | "word-scramble" | "quick-equations" | "memory-matrix" | "stroop-match";

export type Category = "math" | "memory" | "focus";

export const GAME_CATEGORIES: Record<GameId, Category> = {
  "math-quiz": "math",
  "quick-equations": "math",
  "memory-match": "memory",
  "memory-matrix": "memory",
  "speed-reaction": "focus",
  "stroop-match": "focus",
  "word-scramble": "focus",
};

export interface GameResult {
  id: string;
  gameId: GameId;
  score: number;
  maxScore: number;
  accuracy: number;
  difficulty: string;
  duration: number;
  timestamp: number;
}

export interface DailyEntry {
  date: string;         // YYYY-MM-DD
  completed: boolean;
  gamesPlayed: string[]; // list of GameId slugs
  totalScore: number;
  duration: number;     // total seconds
  brainQuotient: number;
}

export interface Proficiency {
  gameId: GameId;
  category: Category;
  totalPlays: number;
  bestScore: number;
  bestAccuracy: number;
  cumulativeScore: number;
  lastPlayed: number;
}

const DB_NAME = "brainspark";
const DB_VERSION = 2;

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("results")) {
        const results = db.createObjectStore("results", { keyPath: "id" });
        results.createIndex("gameId", "gameId");
        results.createIndex("timestamp", "timestamp");
      }
      if (!db.objectStoreNames.contains("daily")) {
        const daily = db.createObjectStore("daily", { keyPath: "date" });
        daily.createIndex("date", "date");
      }
      if (!db.objectStoreNames.contains("proficiency")) {
        const prof = db.createObjectStore("proficiency", { keyPath: "gameId" });
        prof.createIndex("category", "category");
      }
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" });
      }
    },
  });
}

/* ─── Results ──────────────────────────────────────── */

export async function saveResult(result: Omit<GameResult, "id" | "timestamp"> & { timestamp?: number }): Promise<void> {
  const db = await getDB();
  const entry: GameResult = {
    ...result,
    id: crypto.randomUUID(),
    timestamp: result.timestamp ?? Date.now(),
  };
  await db.add("results", entry);

  // Update proficiency
  const prof = await getProficiency(result.gameId);
  const category = GAME_CATEGORIES[result.gameId];
  await db.put("proficiency", {
    gameId: result.gameId,
    category,
    totalPlays: prof.totalPlays + 1,
    bestScore: Math.max(prof.bestScore, result.score),
    bestAccuracy: Math.max(prof.bestAccuracy, result.accuracy),
    cumulativeScore: prof.cumulativeScore + result.score,
    lastPlayed: result.timestamp,
  });
}

export async function getResults(gameId?: GameId, limit = 50): Promise<GameResult[]> {
  const db = await getDB();
  const tx = db.transaction("results", "readonly");
  const store = tx.objectStore("results");
  let results: GameResult[];
  if (gameId) {
    const index = store.index("gameId");
    results = await index.getAll(gameId);
  } else {
    results = await store.getAll();
  }
  results.sort((a, b) => b.timestamp - a.timestamp);
  return results.slice(0, limit);
}

export async function getRecentResults(days = 7): Promise<GameResult[]> {
  const cutoff = Date.now() - days * 86400000;
  const all = await getResults();
  return all.filter((r) => r.timestamp >= cutoff);
}

/* ─── Daily ─────────────────────────────────────────── */

export async function getToday(): Promise<DailyEntry | undefined> {
  const db = await getDB();
  const today = new Date().toISOString().slice(0, 10);
  return db.get("daily", today);
}

export async function saveDaily(entry: DailyEntry): Promise<void> {
  const db = await getDB();
  await db.put("daily", entry);
}

export async function getDailyHistory(days = 30): Promise<DailyEntry[]> {
  const db = await getDB();
  const all = await db.getAll("daily");
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return all
    .filter((d) => d.date >= cutoff.toISOString().slice(0, 10))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/* ─── Proficiency ──────────────────────────────────── */

export async function getProficiency(gameId?: GameId): Promise<Proficiency> {
  const db = await getDB();
  if (gameId) {
    const p = await db.get("proficiency", gameId);
    if (p) return p;
    return {
      gameId,
      category: GAME_CATEGORIES[gameId],
      totalPlays: 0,
      bestScore: 0,
      bestAccuracy: 0,
      cumulativeScore: 0,
      lastPlayed: 0,
    };
  }
  const all = await db.getAll("proficiency");
  return {
    gameId: "math-quiz" as GameId,
    category: "math",
    totalPlays: all.reduce((s, p) => s + p.totalPlays, 0),
    bestScore: Math.max(...all.map((p) => p.bestScore), 0),
    bestAccuracy: Math.max(...all.map((p) => p.bestAccuracy), 0),
    cumulativeScore: all.reduce((s, p) => s + p.cumulativeScore, 0),
    lastPlayed: Math.max(...all.map((p) => p.lastPlayed), 0),
  };
}

export async function getAllProficiency(): Promise<Proficiency[]> {
  const db = await getDB();
  return db.getAll("proficiency");
}

export async function getCategoryProficiency(category: Category): Promise<Proficiency[]> {
  const db = await getDB();
  const index = db.transaction("proficiency").store.index("category");
  return index.getAll(category);
}

/* ─── Settings ──────────────────────────────────────── */

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const db = await getDB();
  const entry = await db.get("settings", key);
  return entry?.value ?? fallback;
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  const db = await getDB();
  await db.put("settings", { key, value });
}

/* ─── Streak Calculation ────────────────────────────── */

export async function calculateStreak(): Promise<number> {
  const history = await getDailyHistory(365);
  if (history.length === 0) return 0;
  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  let check = today;
  for (const entry of history) {
    if (entry.date === check && entry.completed) {
      streak++;
      // Move to previous day
      const d = new Date(check);
      d.setDate(d.getDate() - 1);
      check = d.toISOString().slice(0, 10);
    } else {
      break;
    }
  }
  // If today isn't in history but yesterday was, we still have continuity
  if (streak === 0 && history[0]?.date < today) {
    return streak; // 0
  }
  return streak;
}

/* ─── Brain Quotient ────────────────────────────────── */

export async function calculateBrainQuotient(): Promise<number> {
  const profs = await getAllProficiency();
  if (profs.length === 0) return 0;

  // BQ = normalized weighted score across all categories
  let total = 0;
  let count = 0;
  for (const p of profs) {
    if (p.totalPlays > 0) {
      const avg = Math.round(p.cumulativeScore / p.totalPlays);
      const weighted = avg * Math.min(p.totalPlays / 5, 1); // weight by experience
      total += weighted;
      count++;
    }
  }
  if (count === 0) return 0;
  return Math.round(total / count * 10);
}

/* ─── Daily Workout Generator ────────────────────────── */

export async function generateDailyWorkout(): Promise<GameId[]> {
  const profs = await getAllProficiency();
  const counts: Record<Category, number> = { math: 0, memory: 0, focus: 0 };
  const lastPlayed: Record<Category, number> = { math: 0, memory: 0, focus: 0 };

  for (const p of profs) {
    const cat = GAME_CATEGORIES[p.gameId];
    if (p.totalPlays > 0) {
      counts[cat]++;
      lastPlayed[cat] = Math.max(lastPlayed[cat], p.lastPlayed);
    }
  }

  // Pick the least-played / oldest category to prioritize
  const categories: Category[] = ["math", "memory", "focus"];
  categories.sort((a, b) => {
    const diff = (counts[a] || 0) - (counts[b] || 0);
    if (diff !== 0) return diff; // least played first
    return (lastPlayed[a] || 0) - (lastPlayed[b] || 0); // oldest first
  });

  // Pick one game from each category (top 3)
  const gamesByCat: Record<Category, GameId[]> = {
    math: ["quick-equations", "math-quiz"],
    memory: ["memory-matrix", "memory-match"],
    focus: ["stroop-match", "speed-reaction", "word-scramble"],
  };

  const workout: GameId[] = [];
  for (const cat of categories) {
    const pool = gamesByCat[cat];
    // Pick the one with highest relative need
    const catProfs = await getCategoryProficiency(cat);
    const scored = pool.map((gid) => {
      const p = catProfs.find((p) => p.gameId === gid);
      return { gid, weight: p ? (p.totalPlays || 0) + (p.lastPlayed ? (Date.now() - p.lastPlayed) / 86400000 : 1000) : 0 };
    });
    scored.sort((a, b) => a.weight - b.weight);
    workout.push(scored[0]?.gid || pool[0]);
  }

  // Shuffle order for variety
  for (let i = workout.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [workout[i], workout[j]] = [workout[j], workout[i]];
  }

  return workout;
}
