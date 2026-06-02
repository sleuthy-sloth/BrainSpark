import { create } from "zustand";
import type { GameResult, GameId, DailyEntry, Proficiency, Category } from "@/lib/db";
import {
  getResults,
  getToday,
  saveDaily,
  getDailyHistory,
  getAllProficiency,
  calculateStreak,
  calculateBrainQuotient,
  generateDailyWorkout,
  saveGameSession,
} from "@/lib/db";

/* ─── Types ─────────────────────────────────────────── */

export interface GameMeta {
  id: GameId;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  category: Category;
  color: string;
  icon: string;
  gradient: string;
}

export type GamePhase =
  | "idle"
  | "instructions"
  | "countdown"
  | "playing"
  | "paused"
  | "timeup"
  | "result";

export interface ProgressState {
  totalPlays: number;
  streak: number;
  brainQuotient: number;
  todayCompleted: boolean;
  todayScore: number;
  dailyHistory: DailyEntry[];
  proficiency: Proficiency[];
  workout: GameId[];
}

export interface StoreState {
  /* Global progress */
  progress: ProgressState;
  /* Current game session */
  currentGame: GameId | null;
  currentPhase: GamePhase;
  /* Actions */
  loadProgress: () => Promise<void>;
  refreshWorkout: () => Promise<void>;
  completeGame: (result: GameResult) => void;
  setGamePhase: (phase: GamePhase) => void;
  setCurrentGame: (id: GameId | null) => void;
}

export const GAMES_META: GameMeta[] = [
  {
    id: "quick-equations",
    title: "Quick Equations",
    subtitle: "True or false?",
    description: "Rapidly verify math equations under time pressure.",
    href: "/games/quick-equations",
    category: "math",
    color: "#4a9eff",
    icon: "∑",
    gradient: "text-gradient",
  },
  {
    id: "memory-matrix",
    title: "Memory Matrix",
    subtitle: "Recall the pattern",
    description: "Memorize highlighted tiles and reproduce the pattern.",
    href: "/games/memory-matrix",
    category: "memory",
    color: "#34d399",
    icon: "◆",
    gradient: "text-gradient-green",
  },
  {
    id: "stroop-match",
    title: "Stroop Match",
    subtitle: "Ignore the word",
    description: "Identify the ink color, not the word itself.",
    href: "/games/stroop-match",
    category: "focus",
    color: "#fb7185",
    icon: "◉",
    gradient: "text-gradient-rose",
  },
  {
    id: "math-quiz",
    title: "Math Sprint",
    subtitle: "Quick calculations",
    description: "Solve arithmetic problems against the clock.",
    href: "/games/math-quiz",
    category: "math",
    color: "#4a9eff",
    icon: "∑",
    gradient: "text-gradient",
  },
  {
    id: "memory-match",
    title: "Memory Match",
    subtitle: "Find the pairs",
    description: "Flip cards and match pairs from memory.",
    href: "/games/memory-match",
    category: "memory",
    color: "#34d399",
    icon: "◆",
    gradient: "text-gradient-green",
  },
  {
    id: "speed-reaction",
    title: "Speed Tap",
    subtitle: "Reflex challenge",
    description: "React as fast as you can when the signal changes.",
    href: "/games/speed-reaction",
    category: "focus",
    color: "#fbbf24",
    icon: "⚡",
    gradient: "text-gradient-amber",
  },
  {
    id: "word-scramble",
    title: "Word Twist",
    subtitle: "Unscramble words",
    description: "Rearrange letters to form words.",
    href: "/games/word-scramble",
    category: "focus",
    color: "#a78bfa",
    icon: "✦",
    gradient: "text-gradient-violet",
  },
  {
    id: "sequence-memory",
    title: "Sequence Memory",
    subtitle: "Repeat the pattern",
    description: "Watch tiles light up, then tap them back in the same order.",
    href: "/games/sequence-memory",
    category: "memory",
    color: "#34d399",
    icon: "◈",
    gradient: "text-gradient-green",
  },
];

export function getGameMeta(id: GameId): GameMeta {
  return GAMES_META.find((g) => g.id === id)!;
}

/* ─── Store ─────────────────────────────────────────── */

export const useStore = create<StoreState>((set) => ({
  progress: {
    totalPlays: 0,
    streak: 0,
    brainQuotient: 0,
    todayCompleted: false,
    todayScore: 0,
    dailyHistory: [],
    proficiency: [],
    workout: [],
  },
  currentGame: null,
  currentPhase: "idle",

  loadProgress: async () => {
    const [streak, bq, history, proficiency, today] = await Promise.all([
      calculateStreak(),
      calculateBrainQuotient(),
      getDailyHistory(30),
      getAllProficiency(),
      getToday(),
    ]);

    const totalPlays = proficiency.reduce((s, p) => s + p.totalPlays, 0);
    const workout = await generateDailyWorkout();

    set({
      progress: {
        totalPlays,
        streak,
        brainQuotient: bq,
        todayCompleted: today?.completed ?? false,
        todayScore: today?.totalScore ?? 0,
        dailyHistory: history,
        proficiency,
        workout,
      },
    });
  },

  refreshWorkout: async () => {
    const workout = await generateDailyWorkout();
    set((s) => ({ progress: { ...s.progress, workout } }));
  },

  completeGame: (result) => {
    set((s) => ({
      progress: {
        ...s.progress,
        totalPlays: s.progress.totalPlays + 1,
      },
    }));
    // Fire-and-forget Supabase sync
    saveGameSession({
      gameId: result.gameId,
      score: result.score,
      maxScore: result.maxScore,
      accuracy: result.accuracy,
      difficulty: result.difficulty,
      duration: result.duration,
    });
  },

  setGamePhase: (phase) => set({ currentPhase: phase }),
  setCurrentGame: (id) => set({ currentGame: id }),
}));
