"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import GameCard from "@/components/GameCard";
import NavBar from "@/components/NavBar";
import { GAMES_META, useStore } from "@/store";

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const progress = useStore((s) => s.progress);
  const loadProgress = useStore((s) => s.loadProgress);

  useEffect(() => {
    setMounted(true);
    loadProgress();
  }, [loadProgress]);

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
        {/* Header */}
        <header className="pt-16 pb-6 text-center">
          <h1 className="text-4xl font-extrabold text-gradient">BrainSpark</h1>
          <p className="text-text-secondary text-sm mt-2">
            Train your mind with daily brain games
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

        {/* Daily Workout */}
        {progress.workout.length > 0 && (
          <div className="max-w-lg mx-auto mb-6">
            <Link
              href="/daily-workout"
              className={`glass-card p-4 block text-center ${todayCompleted ? "" : "animate-pulse-glow"}`}
            >
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                {todayCompleted ? "Today's Workout" : "Start Daily Workout"}
              </p>
              <p className="text-lg font-bold text-gradient">
                {todayCompleted ? "✓ Complete" : `${progress.workout.length} games`}
              </p>
            </Link>
          </div>
        )}

        {/* Game Grid */}
        <div className="max-w-lg mx-auto stagger space-y-3">
          {GAMES_META.filter((g) => g.id !== "math-quiz").map((game, i) => (
            <GameCard key={game.id} game={game} index={i} />
          ))}
        </div>

        {/* Bottom Links */}
        <div className="max-w-lg mx-auto mt-6 flex justify-center gap-3">
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
