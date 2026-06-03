/**
 * Stats engine — pure functions for aggregating, calculating, and trending
 * game session data. Works with IndexedDB GameResult[] (guest/offline) or
 * Supabase game_sessions (signed-in).
 *
 * All functions accept `GameResult[]` and return derived stats.
 */
import type { GameResult, GameId } from "./db";
import { GAMES_META } from "@/store";

/* ─── Types ─────────────────────────────────────────── */

export interface PerGameStats {
  gameId: GameId;
  title: string;
  color: string;
  icon: string;
  gradient: string;
  totalPlays: number;
  bestScore: number;
  bestAccuracy: number;
  avgScore: number;
  avgAccuracy: number;
  cumulativeScore: number;
  /** Personal best per difficulty level */
  difficultyBests: Record<string, number>;
  lastPlayed: number;
  lastWeekPlays: number;
}

export interface SkillScore {
  skill: string;
  score: number; // 0–100 normalized
  color: string;
}

export interface TrendPoint {
  timestamp: number;
  score: number;
}

export interface TrendInfo {
  gameId: GameId;
  points: TrendPoint[];
  direction: "up" | "down" | "stable";
  directionPct: number;
}

export interface CalendarDay {
  date: string;            // YYYY-MM-DD
  dayOfMonth: number;
  dayOfWeek: number;       // 0=Sun
  intensity: "none" | "played" | "daily" | "high";
  sessions: GameResult[];
  totalScore: number;
}

export interface CalendarMonth {
  year: number;
  month: number;           // 1-12
  monthName: string;
  days: CalendarDay[];
}

export const SKILL_DEFS: { skill: string; games: GameId[]; color: string }[] = [
  { skill: "Numeracy", games: ["math-quiz", "quick-equations"], color: "#4a9eff" },
  { skill: "Memory", games: ["memory-match", "memory-matrix", "sequence-memory"], color: "#34d399" },
  { skill: "Reflexes", games: ["speed-reaction"], color: "#fbbf24" },
  { skill: "Vocabulary", games: ["word-scramble"], color: "#a78bfa" },
  { skill: "Focus", games: ["stroop-match"], color: "#fb7185" },
  { skill: "Logic", games: ["star-battle"], color: "#22d3ee" },
];

/* ─── Aggregation ───────────────────────────────────── */

export function aggregateByGame(sessions: GameResult[]): PerGameStats[] {
  return GAMES_META.map((meta) => {
    const gameSessions = sessions.filter((s) => s.gameId === meta.id);
    const totalPlays = gameSessions.length;
    const cumulativeScore = gameSessions.reduce((s, r) => s + r.score, 0);
    const avgScore = totalPlays > 0 ? Math.round(cumulativeScore / totalPlays) : 0;
    const avgAccuracy = totalPlays > 0
      ? Math.round(gameSessions.reduce((s, r) => s + r.accuracy, 0) / totalPlays)
      : 0;

    const difficultyBests: Record<string, number> = {};
    for (const r of gameSessions) {
      const diff = r.difficulty || "any";
      if (!difficultyBests[diff] || r.score > difficultyBests[diff]) {
        difficultyBests[diff] = r.score;
      }
    }

    const now = Date.now();
    const lastWeek = gameSessions.filter((r) => r.timestamp > now - 7 * 86400000);

    return {
      gameId: meta.id,
      title: meta.title,
      color: meta.color,
      icon: meta.icon,
      gradient: meta.gradient,
      totalPlays,
      bestScore: Math.max(...gameSessions.map((r) => r.score), 0),
      bestAccuracy: Math.max(...gameSessions.map((r) => r.accuracy), 0),
      avgScore,
      avgAccuracy,
      cumulativeScore,
      difficultyBests,
      lastPlayed: Math.max(...gameSessions.map((r) => r.timestamp), 0),
      lastWeekPlays: lastWeek.length,
    };
  });
}

/* ─── Skill Scores (0–100 normalized) ──────────────── */

export function calculateSkillScores(sessions: GameResult[]): SkillScore[] {
  return SKILL_DEFS.map(({ skill, games, color }) => {
    const relevant = sessions.filter((s) => games.includes(s.gameId));
    if (relevant.length === 0) {
      return { skill, score: 0, color };
    }
    // Average accuracy across all sessions for this skill group,
    // weighted slightly by recency (last 7 days count double)
    const recent = relevant.filter((r) => r.timestamp > Date.now() - 7 * 86400000);
    const scores = relevant.map((r) => r.accuracy);
    const recentScores = recent.map((r) => r.accuracy);
    const all = [...scores, ...recentScores, ...recentScores]; // double-weight recent
    const avg = all.reduce((s, v) => s + v, 0) / all.length;
    return { skill, score: Math.round(Math.max(0, Math.min(100, avg))), color };
  });
}

/* ─── Streak History (for calendar heatmap) ────────── */

export function getStreakHistory(
  sessions: GameResult[],
  dailyCompletionDates: string[]
): CalendarMonth[] {
  const now = new Date();
  const months: CalendarMonth[] = [];

  // Generate last 3 months
  for (let offset = 2; offset >= 0; offset--) {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1; // 1-indexed
    const daysInMonth = new Date(year, month, 0).getDate();

    const days: CalendarDay[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const startOfDay = new Date(dateStr + "T00:00:00Z").getTime();
      const endOfDay = startOfDay + 86400000;

      const daySessions = sessions.filter(
        (s) => s.timestamp >= startOfDay && s.timestamp < endOfDay
      );
      const totalScore = daySessions.reduce((sum, s) => sum + s.score, 0);
      const isDailyDone = dailyCompletionDates.includes(dateStr);

      let intensity: CalendarDay["intensity"] = "none";
      if (isDailyDone) {
        intensity = "daily";
      } else if (totalScore > 500) {
        intensity = "high";
      } else if (daySessions.length > 0) {
        intensity = "played";
      }

      days.push({
        date: dateStr,
        dayOfMonth: day,
        dayOfWeek: new Date(startOfDay).getDay(),
        intensity,
        sessions: daySessions,
        totalScore,
      });
    }

    months.push({
      year,
      month,
      monthName: d.toLocaleDateString("en-US", { month: "long" }),
      days,
    });
  }

  return months;
}

/* ─── Trend Data (last N sessions per game for sparklines) ── */

export function getTrendData(
  sessions: GameResult[],
  gameId: GameId,
  n = 14
): TrendInfo {
  const gameSessions = sessions
    .filter((s) => s.gameId === gameId)
    .sort((a, b) => a.timestamp - b.timestamp) // oldest first
    .slice(-n);

  const points: TrendPoint[] = gameSessions.map((s) => ({
    timestamp: s.timestamp,
    score: s.score,
  }));

  // Determine direction: compare first half avg vs second half avg
  let direction: "up" | "down" | "stable" = "stable";
  let directionPct = 0;
  if (points.length >= 4) {
    const mid = Math.floor(points.length / 2);
    const firstHalf = points.slice(0, mid).reduce((s, p) => s + p.score, 0) / mid;
    const secondHalf = points.slice(mid).reduce((s, p) => s + p.score, 0) / (points.length - mid);
    if (firstHalf > 0) {
      directionPct = Math.round(((secondHalf - firstHalf) / firstHalf) * 100);
      if (directionPct > 5) direction = "up";
      else if (directionPct < -5) direction = "down";
    }
  }

  return { gameId, points, direction, directionPct };
}

/* ─── Rank Calculation ────────────────────────────────── */

export function calculateRank(stats: PerGameStats[]): {
  title: string;
  emoji: string;
  color: string;
} {
  const played = stats.filter((s) => s.totalPlays > 0);
  if (played.length === 0) {
    return { title: "Newcomer", emoji: "🌱", color: "var(--text-muted)" };
  }

  const avgAccuracy = played.reduce((s, p) => s + p.avgAccuracy, 0) / played.length;
  const totalGames = played.reduce((s, p) => s + p.totalPlays, 0);

  if (avgAccuracy >= 85 && totalGames >= 50) {
    return { title: "Genius", emoji: "🧠", color: "var(--accent-violet)" };
  }
  if (avgAccuracy >= 70 && totalGames >= 20) {
    return { title: "Elite", emoji: "🏆", color: "var(--accent-blue)" };
  }
  if (avgAccuracy >= 50 && totalGames >= 5) {
    return { title: "Sharp", emoji: "🔥", color: "var(--accent-amber)" };
  }
  return { title: "Growing", emoji: "🌱", color: "var(--accent-green)" };
}

/* ─── Best Daily Challenge Score ────────────────────── */

export function getBestDailyScore(
  dailyCompletionDates: string[],
  dailyScores: Record<string, number>
): number {
  return Math.max(...dailyCompletionDates.map((d) => dailyScores[d] || 0), 0);
}
