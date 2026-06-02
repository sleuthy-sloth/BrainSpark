"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import DailyCountdown from "@/components/DailyCountdown";
import DailyStreak from "@/components/DailyStreak";
import ShareScore from "@/components/ShareScore";
import {
  getTodayUTC,
  generateDailySequence,
  dailyGameRoute,
  dailyGameToAppId,
  DAILY_GAME_NAMES,
  DAILY_GAME_ICONS,
  DAILY_GAME_COLORS,
  DAILY_GAME_CATEGORIES,
  type DailyGame,
} from "@/lib/dailyChallenge";
import { getStreakInfo, recordDailyCompletion, isDailyDone } from "@/lib/streaks";

const DAILY_PROGRESS_KEY = "np_daily_progress";

interface DailyProgress {
  dateStr: string;
  completed: boolean;
  gameResults: { index: number; score: number }[];
  totalScore: number;
  startTime: number;
}

function loadProgress(dateStr: string): DailyProgress | null {
  try {
    const raw = localStorage.getItem(DAILY_PROGRESS_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p.dateStr === dateStr) return p;
    }
  } catch {}
  return null;
}

function saveProgress(p: DailyProgress) {
  localStorage.setItem(DAILY_PROGRESS_KEY, JSON.stringify(p));
}

function clearProgress(dateStr: string) {
  const p = loadProgress(dateStr);
  if (p) {
    p.completed = true;
    saveProgress(p);
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function DailyChallengeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [dateStr, setDateStr] = useState("");
  const [sequence, setSequence] = useState<DailyGame[]>([]);
  const [progress, setLocalProgress] = useState<DailyProgress | null>(null);
  const [done, setDone] = useState(false);
  const [streakInfo, setStreakInfo] = useState<{
    currentStreak: number;
    longestStreak: number;
    completedDates: string[];
  }>({ currentStreak: 0, longestStreak: 0, completedDates: [] });
  const [saving, setSaving] = useState(false);

  // Check for returning from a game via query params
  const completedGameIndex = searchParams.get("game");
  const completedScore = searchParams.get("score");

  const init = useCallback(async () => {
    const today = getTodayUTC();
    setDateStr(today);
    setSequence(generateDailySequence(today));

    // Load saved progress
    const p = loadProgress(today);
    setLocalProgress(p);

    // Check if already completed (from Supabase/localStorage)
    const alreadyDone = await isDailyDone(today);
    setDone(alreadyDone || p?.completed === true);

    // Load streak info
    const info = await getStreakInfo();
    setStreakInfo(info);
    setMounted(true);
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  // Handle returning from a game
  useEffect(() => {
    if (!mounted || !completedGameIndex || !completedScore) return;
    if (done) return;

    const gameIdx = parseInt(completedGameIndex);
    const score = parseInt(completedScore);

    if (isNaN(gameIdx) || isNaN(score)) return;

    const p = progress || {
      dateStr,
      completed: false,
      gameResults: [],
      totalScore: 0,
      startTime: Date.now(),
    };

    // Check if this game result is already recorded
    if (p.gameResults.some((r) => r.index === gameIdx)) return;

    p.gameResults.push({ index: gameIdx, score });
    p.totalScore += score;

    if (p.gameResults.length >= 3) {
      // All 3 games complete!
      p.completed = true;
      saveProgress(p);
      setDone(true);
      setLocalProgress(p);

      // Record streak and daily completion
      setSaving(true);
      recordDailyCompletion(dateStr, p.totalScore).then((streakResult) => {
        // Refresh streak info
        getStreakInfo().then((info) => setStreakInfo(info));
        setSaving(false);
      });
    } else {
      saveProgress(p);
      setLocalProgress(p);
    }

    // Clean URL params
    window.history.replaceState({}, "", "/daily");
  }, [mounted, completedGameIndex, completedScore, dateStr, done, progress]);

  // Launch a game in the daily sequence
  const launchGame = (gameIdx: number) => {
    if (!sequence[gameIdx]) return;

    const game = sequence[gameIdx];
    const route = dailyGameRoute(game.game);
    const gameId = dailyGameToAppId(game.game);

    // Save in-progress state
    const p = progress || {
      dateStr,
      completed: false,
      gameResults: [],
      totalScore: 0,
      startTime: Date.now(),
    };
    saveProgress(p);

    // Navigate to the game with seed params
    router.push(`${route}?seed=${game.seed}&daily=true&dailyGame=${gameIdx}&gameId=${gameId}`);
  };

  // Launch the first uncompleted game
  const startChallenge = () => {
    const completedIndices = progress?.gameResults.map((r) => r.index) || [];
    const nextIdx = sequence.findIndex((_, i) => !completedIndices.includes(i));
    if (nextIdx >= 0) {
      launchGame(nextIdx);
    }
  };

  if (!mounted) {
    return (
      <>
        <NavBar />
        <main className="relative z-10 min-h-dvh flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
        </main>
      </>
    );
  }

  const completedCount = progress?.gameResults?.length || 0;
  const showCompletion = done || completedCount >= 3;

  return (
    <>
      <NavBar />
      <main className="relative z-10 px-4 pb-8 pt-16">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <header className="text-center mb-6">
            <h1 className="text-3xl font-extrabold text-gradient">Daily Challenge</h1>
            <p className="text-text-secondary text-sm mt-1">{formatDate(dateStr)}</p>
            {showCompletion && <DailyCountdown />}
          </header>

          {/* COMPLETED: Results view */}
          {showCompletion ? (
            <div className="space-y-4 animate-fade-in">
              {/* Completion card */}
              <div className="glass-card-static p-6 text-center">
                <div className="text-5xl mb-3">🏆</div>
                <h2 className="text-2xl font-extrabold text-gradient-green mb-1">
                  Challenge Complete!
                </h2>
                <p className="text-4xl font-extrabold text-[var(--accent-blue)] my-4">
                  {progress?.totalScore || 0}
                </p>
                <p className="text-xs text-text-muted">Total Daily Score</p>

                {/* Game breakdown */}
                <div className="mt-4 space-y-2">
                  {sequence.map((game, i) => {
                    const result = progress?.gameResults?.find((r) => r.index === i);
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between px-3 py-2 rounded-xl bg-[var(--bg-secondary)]"
                      >
                        <div className="flex items-center gap-2">
                          <span style={{ color: DAILY_GAME_COLORS[game.game] }}>
                            {DAILY_GAME_ICONS[game.game]}
                          </span>
                          <span className="text-sm font-medium text-text-primary">
                            {DAILY_GAME_NAMES[game.game]}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-[var(--accent-blue)]">
                          {result ? result.score : 0}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Streak heatmap */}
              <DailyStreak
                completedDates={streakInfo.completedDates}
                currentStreak={streakInfo.currentStreak}
                longestStreak={streakInfo.longestStreak}
              />

              {/* Share Score */}
              <ShareScore
                dateStr={dateStr}
                totalScore={progress?.totalScore || 0}
                streak={streakInfo.currentStreak}
              />

              {/* Practice link */}
              <div className="text-center pt-2">
                <Link
                  href="/"
                  className="btn btn-md btn-ghost"
                >
                  Practice Games
                </Link>
              </div>
            </div>
          ) : (
            /* NOT COMPLETED: Challenge track view */
            <div className="space-y-4 animate-fade-in">
              {/* Game sequence track */}
              <div className="glass-card-static p-5">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-4 text-center">
                  3-Game Challenge
                </p>

                <div className="space-y-3">
                  {sequence.map((game, i) => {
                    const isDone = progress?.gameResults?.some((r) => r.index === i);
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                          isDone
                            ? "bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/20"
                            : "bg-[var(--bg-secondary)]"
                        }`}
                      >
                        {/* Game number circle */}
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 ${
                            isDone
                              ? "bg-[var(--accent-green)] text-white"
                              : "bg-[var(--bg-card)] text-text-muted"
                          }`}
                        >
                          {isDone ? "✓" : i + 1}
                        </div>

                        {/* Game info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span style={{ color: DAILY_GAME_COLORS[game.game] }}>
                              {DAILY_GAME_ICONS[game.game]}
                            </span>
                            <p className="text-sm font-bold text-text-primary">
                              {DAILY_GAME_NAMES[game.game]}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-text-muted uppercase tracking-wider">
                              {DAILY_GAME_CATEGORIES[game.game]}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-medium capitalize ${
                                game.difficulty === "easy"
                                  ? "bg-[var(--accent-green)]/20 text-[var(--accent-green)]"
                                  : game.difficulty === "medium"
                                  ? "bg-[var(--accent-amber)]/20 text-[var(--accent-amber)]"
                                  : "bg-[var(--accent-rose)]/20 text-[var(--accent-rose)]"
                              }`}
                            >
                              {game.difficulty}
                            </span>
                          </div>
                        </div>

                        {/* Score if done */}
                        {isDone && progress && (
                          <span className="text-sm font-bold text-[var(--accent-blue)] shrink-0">
                            {progress.gameResults.find((r) => r.index === i)?.score || 0}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Progress bar */}
                {completedCount > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                      <span>Progress</span>
                      <span>{completedCount}/3</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--accent-green)] transition-all"
                        style={{ width: `${(completedCount / 3) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* CTA Button */}
              <button
                onClick={startChallenge}
                className="btn btn-lg w-full justify-center btn-primary animate-pulse-glow"
              >
                {completedCount === 0
                  ? "Start Today's Challenge"
                  : completedCount === 1
                  ? "Continue Game 2"
                  : "Final Game!"}
              </button>

              {/* Streak preview */}
              <div className="text-center">
                <p className="text-sm text-text-muted">
                  {streakInfo.currentStreak > 0 ? (
                    <>🔥 <strong className="text-text-secondary">{streakInfo.currentStreak}</strong> day streak</>
                  ) : (
                    "Complete today for a 1-day streak!"
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default function DailyChallengePage() {
  return (
    <Suspense fallback={
      <main className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <DailyChallengeContent />
    </Suspense>
  );
}
