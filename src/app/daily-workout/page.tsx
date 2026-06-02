"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import { useStore, getGameMeta } from "@/store";
import { getToday, saveDaily, generateDailyWorkout } from "@/lib/db";
import type { GameId } from "@/lib/db";

type WorkoutState = "loading" | "ready" | "playing" | "complete";

export default function DailyWorkoutPage() {
  const router = useRouter();
  const [state, setState] = useState<WorkoutState>("loading");
  const [workout, setWorkout] = useState<GameId[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [startTime] = useState(Date.now());
  const loadProgress = useStore((s) => s.loadProgress);

  useEffect(() => {
    (async () => {
      const today = await getToday();
      if (today?.completed) {
        setState("complete");
        setScores(new Array(today.gamesPlayed.length).fill(0));
        setTotalScore(today.totalScore);
        return;
      }
      const w = await generateDailyWorkout();
      setWorkout(w);
      setScores(new Array(w.length).fill(0));
      setState("ready");
    })();
  }, []);

  const handlePlay = (index: number) => {
    setCurrentIndex(index);
    router.push(getGameMeta(workout[index]).href);
  };

  const handleComplete = useCallback(async () => {
    const duration = Math.round((Date.now() - startTime) / 1000);
    await saveDaily({
      date: new Date().toISOString().slice(0, 10),
      completed: true,
      gamesPlayed: workout,
      totalScore,
      duration,
      brainQuotient: 0, // Recalculated on next load
    });
    loadProgress();
    setState("complete");
  }, [workout, totalScore, startTime, loadProgress]);

  if (state === "loading") {
    return (
      <>
        <NavBar />
        <main className="relative z-10 min-h-dvh flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
        </main>
      </>
    );
  }

  if (state === "complete") {
    return (
      <>
        <NavBar />
        <main className="relative z-10 min-h-dvh flex flex-col items-center justify-center px-4 animate-scale-in">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-extrabold text-gradient mb-2">Workout Complete</h1>
          <p className="text-text-secondary text-sm mb-6">
            {scores.length} {scores.length === 1 ? "game" : "games"} played
          </p>
          <div className="glass-card-static p-6 w-full max-w-xs text-center">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Total Score</p>
            <p className="text-4xl font-extrabold text-gradient">{totalScore}</p>
          </div>
          <Link href="/" className="btn btn-md btn-primary mt-6">
            Back to Home
          </Link>
        </main>
      </>
    );
  }

  // Ready state
  return (
    <>
      <NavBar />
      <main className="relative z-10 px-4 pt-20 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-extrabold text-gradient">Daily Workout</h1>
            <p className="text-text-secondary text-sm mt-1">
              {workout.length} {workout.length === 1 ? "game" : "games"} to complete
            </p>
          </div>

          <div className="space-y-3 stagger">
            {workout.map((gameId, i) => {
              const meta = getGameMeta(gameId);
              const done = scores[i] > 0;
              return (
                <button
                  key={gameId}
                  onClick={() => handlePlay(i)}
                  disabled={done}
                  className={`glass-card p-4 w-full flex items-center gap-4 text-left transition-all ${
                    done ? "opacity-50" : "hover:scale-[1.02] active:scale-[0.98]"
                  } ${i === currentIndex ? "ring-2 ring-[var(--accent-blue)]" : ""}`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                      done ? "bg-[var(--accent-green)]/20" : ""
                    }`}
                    style={!done ? { background: `${meta.color}15`, color: meta.color } : {}}
                  >
                    {done ? "✓" : meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-sm ${meta.gradient}`}>{meta.title}</h3>
                    <p className="text-xs text-text-muted">{meta.subtitle}</p>
                  </div>
                  <span className={`text-sm font-bold ${
                    done ? "text-[var(--accent-green)]" : "text-text-muted"
                  }`}>
                    {done ? `${scores[i]}pts` : `#${i + 1}`}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Mark complete */}
          {scores.every((s) => s > 0) && (
            <div className="mt-6 text-center animate-fade-in">
              <button onClick={handleComplete} className="btn btn-lg btn-success animate-pulse-glow">
                Complete Workout
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
