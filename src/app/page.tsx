"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import GameCard from "@/components/GameCard";
import { GAMES_META, useStore } from "@/store";
import { getTodayUTC, generateDailySequence, DAILY_GAME_NAMES } from "@/lib/dailyChallenge";
import { getStreakInfo, isDailyDone } from "@/lib/streaks";

function Greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

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
    const today = getTodayUTC();
    isDailyDone(today).then(setDailyDone);
    getStreakInfo().then((info) => setDailyStreak(info.currentStreak));
    try {
      const raw = localStorage.getItem("np_daily_progress");
      if (raw) {
        const p = JSON.parse(raw);
        if (p.dateStr === today) setDailyTotalScore(p.totalScore || 0);
      }
    } catch {}
  }, [loadProgress]);

  useEffect(() => {
    if (searchParams.get("welcome") === "true") {
      setShowWelcome(true);
      const timer = setTimeout(() => setShowWelcome(false), 4000);
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

  // Determine workout count
  const workoutLength = 3;

  return (
    <main className="relative z-10 px-5 pt-6 pb-4 has-bottom-nav">
      {/* Welcome toast */}
      {showWelcome && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 elevate-card px-5 py-3 animate-slide-down">
          <p className="text-sm font-medium text-white text-center">
            Welcome back! Progress synced ✨
          </p>
        </div>
      )}

      {/* Greeting */}
      <div className="mb-2">
        <h1 className="text-[28px] font-bold text-white tracking-tight">
          {Greeting()}
        </h1>
        <p className="text-[15px] text-[var(--text-secondary)] mt-0.5">
          {dailyStreak > 0
            ? `🔥 ${dailyStreak}-day streak — keep it going`
            : "Ready for today's training?"}
        </p>
      </div>

      {/* Daily Workout CTA */}
      <div className="mb-6">
        <Link
          href="/daily"
          className="elevate-card p-5 block"
        >
          {dailyDone ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">
                  Today's Workout
                </p>
                <p className="text-lg font-bold text-[var(--accent-green)]">Completed ✓</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white font-mono-digits">{dailyTotalScore}</p>
                <p className="text-[11px] text-[var(--text-muted)]">points</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">
                  Today's Workout
                </p>
                <p className="text-[17px] font-semibold text-white">
                  {workoutLength} games to train
                </p>
                <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
                  Memory · Math · Focus
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "var(--accent-blue)" }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}
        </Link>
      </div>

      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[17px] font-semibold text-white">Games</h2>
        <p className="text-[11px] text-[var(--text-muted)]">
          {totalPlays > 0 ? `${totalPlays} played` : ""}
        </p>
      </div>

      {/* Game list */}
      <div className="stagger space-y-3">
        {GAMES_META.filter((g) => g.id !== "math-quiz").map((game, i) => (
          <div key={game.id} className="animate-fade-in" style={{ animationDelay: `${i * 0.06}s` }}>
            <GameCard game={game} index={i} />
          </div>
        ))}
      </div>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
