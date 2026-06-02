"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import GameCard from "@/components/GameCard";
import NavBar from "@/components/NavBar";
import { GAMES_META, useStore } from "@/store";
import { getTodayUTC, generateDailySequence, DAILY_GAME_NAMES } from "@/lib/dailyChallenge";
import { getStreakInfo, isDailyDone } from "@/lib/streaks";

function HomeContent() {
  const [mounted, setMounted] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [dailyDone, setDailyDone] = useState(false);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [dailyTotalScore, setDailyTotalScore] = useState(0);
  const progress = useStore((s) => s.progress);
  const loadProgress = useStore((s) => s.loadProgress);
  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);
    loadProgress();
    // Check daily challenge status
    const today = getTodayUTC();
    isDailyDone(today).then(setDailyDone);
    getStreakInfo().then((info) => setDailyStreak(info.currentStreak));
    // Load daily progress from localStorage for score
    try {
      const raw = localStorage.getItem("np_daily_progress");
      if (raw) {
        const p = JSON.parse(raw);
        if (p.dateStr === today) setDailyTotalScore(p.totalScore || 0);
      }
    } catch {}
  }, [loadProgress]);

  // Show welcome toast after sign-in
  useEffect(() => {
    if (searchParams.get("welcome") === "true") {
      setShowWelcome(true);
      const timer = setTimeout(() => setShowWelcome(false), 4000);
      // Clean URL without reload
      window.history.replaceState({}, "", "/");
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  if (!mounted) {
    return (
      <main className="relative z-10 min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  const { totalPlays, streak, brainQuotient, todayCompleted } = progress;

  return (
    <>
      <NavBar />
      <main className="relative z-10 px-4 pb-8">

        {/* Welcome toast */}
        {showWelcome && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 glass-card-static px-5 py-3 animate-slide-down">
            <p className="text-sm font-medium text-gradient text-center">
              Welcome back! Progress synced. ✨
            </p>
          </div>
        )}

        {/* Header */}
        <header className="pt-16 pb-6 text-center">
          <h1 className="text-4xl font-extrabold text-gradient">NeuralPulse</h1>
          <p className="text-text-secondary text-sm mt-2">
            Daily brain training. Sharpen your edge.
          </p>
        </header>

        {/* Stats Bar */}
        {totalPlays > 0 && (
          <div className="max-w-lg mx-auto mb-6 glass-card-static p-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xl font-bold text-[var(--accent-blue)]">{brainQuotient}</p>
                <p className="text-[10px] text-text-muted uppercase tracking-wider">Brain Q</p>
              </div>
              <div>
                <p className="text-xl font-bold text-[var(--accent-amber)]">
                  {streak}
                  <span className="text-sm font-normal text-text-muted">🔥</span>
                </p>
                <p className="text-[10px] text-text-muted uppercase tracking-wider">Day Streak</p>
              </div>
              <div>
                <p className="text-xl font-bold text-[var(--accent-green)]">{totalPlays}</p>
                <p className="text-[10px] text-text-muted uppercase tracking-wider">
                  {totalPlays === 1 ? "Game" : "Games"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Today's Challenge Banner */}
        <div className="max-w-lg mx-auto mb-5">
          <Link
            href="/daily"
            className={`glass-card p-5 block text-center transition-all ${dailyDone ? "" : "animate-pulse-glow hover:scale-[1.02]"}`}
          >
            <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1.5 font-semibold">
              {dailyDone ? "✓ Today's Challenge" : "🔥 Daily Challenge"}
            </p>
            {dailyDone ? (
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl font-extrabold text-gradient-green">Done!</span>
                <span className="text-lg font-bold text-[var(--accent-blue)]">{dailyTotalScore} pts</span>
              </div>
            ) : (
              <>
                <p className="text-lg font-bold text-gradient mb-0.5">Train your mind today</p>
                <p className="text-[11px] text-text-muted">
                  3 games · {dailyStreak > 0 ? `🔥 ${dailyStreak} day streak` : "Start your streak!"}
                </p>
              </>
            )}
          </Link>
        </div>

        {/* Game Grid */}
        <div className="max-w-lg mx-auto stagger space-y-3">
          {GAMES_META.filter((g) => g.id !== "math-quiz").map((game, i) => (
            <GameCard key={game.id} game={game} index={i} />
          ))}
        </div>

        {/* Bottom Links */}
        <div className="max-w-lg mx-auto mt-6 flex justify-center gap-3">
          <Link href="/daily" className="btn btn-sm btn-ghost">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Daily
          </Link>
          <Link href="/stats" className="btn btn-md btn-ghost">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Stats
          </Link>
        </div>
      </main>
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
