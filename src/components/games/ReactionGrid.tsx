"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import { saveResult } from "@/lib/storage";

type Phase = "idle" | "playing" | "game_over";

const GRID_SIZE = 5;
const TOTAL_TARGETS = 25;
const TARGET_LIFETIME = 3000; // ms before a target disappears

export default function ReactionGrid({
  seed,
  dailyMode = false,
  dailyGameIdx = null,
}: {
  seed?: number;
  dailyMode?: boolean;
  dailyGameIdx?: number | null;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [grid, setGrid] = useState<Set<number>>(new Set());
  const [hit, setHit] = useState<number[]>([]);
  const [missed, setMissed] = useState(0);
  const [score, setScore] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [lastTarget, setLastTarget] = useState<number | null>(null);
  const activeTargets = useRef<Map<number, number>>(new Map());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameStart = useRef(Date.now());

  const spawnTarget = useCallback(() => {
    const available: number[] = [];
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      if (!activeTargets.current.has(i)) available.push(i);
    }
    if (available.length === 0) return;

    const idx = available[Math.floor(Math.random() * available.length)];
    const now = Date.now();
    activeTargets.current.set(idx, now);
    setGrid(new Set(activeTargets.current.keys()));
    setLastTarget(idx);
  }, []);

  const startGame = () => {
    activeTargets.current.clear();
    setHit([]);
    setMissed(0);
    setScore(0);
    setReactionTimes([]);
    setTimeLeft(30);
    setGrid(new Set());
    setLastTarget(null);
    gameStart.current = Date.now();

    setPhase("playing");

    // Spawn first few targets
    spawnTarget();

    // Continuous spawning
    spawnRef.current = setInterval(() => {
      if (activeTargets.current.size < 4) {
        spawnTarget();
      }
    }, 600);

    // Timer countdown
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          clearInterval(spawnRef.current!);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (spawnRef.current) clearInterval(spawnRef.current);
    };
  }, []);

  const handleTap = (idx: number) => {
    if (phase !== "playing" || timeLeft <= 0) return;

    if (activeTargets.current.has(idx)) {
      const now = Date.now();
      const spawnTime = activeTargets.current.get(idx)!;
      const rt = now - spawnTime;
      setReactionTimes((t) => [...t, rt]);
      setScore((s) => s + 1);
      setHit((h) => [...h, idx]);
      activeTargets.current.delete(idx);
      setGrid(new Set(activeTargets.current.keys()));
    }
  };

  // Check for expired targets
  useEffect(() => {
    if (phase !== "playing") return;
    const check = setInterval(() => {
      const now = Date.now();
      let expired = 0;
      activeTargets.current.forEach((spawnTime, idx) => {
        if (now - spawnTime > TARGET_LIFETIME) {
          activeTargets.current.delete(idx);
          expired++;
        }
      });
      if (expired > 0) {
        setMissed((m) => m + expired);
        setGrid(new Set(activeTargets.current.keys()));
      }
    }, 500);
    return () => clearInterval(check);
  }, [phase]);

  // End game when time runs out
  useEffect(() => {
    if (timeLeft <= 0 && phase === "playing") {
      setPhase("game_over");
      clearInterval(timerRef.current!);
      clearInterval(spawnRef.current!);
      const elapsed = Math.round((Date.now() - gameStart.current) / 1000);
      saveResult({
        gameId: "reaction-grid",
        score,
        maxScore: TOTAL_TARGETS,
        accuracy: Math.round((score / Math.max(score + missed, 1)) * 100),
        difficulty: "medium",
        duration: elapsed,
      });
    }
  }, [timeLeft, phase, score, missed]);

  const avgRT = reactionTimes.length > 0
    ? Math.round(reactionTimes.reduce((s, t) => s + t, 0) / reactionTimes.length)
    : 0;

  return (
    <>
      <NavBar />
      <main className="relative z-10 min-h-dvh flex flex-col items-center justify-center px-4">
        {phase === "idle" && (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="text-5xl mb-4 opacity-60">⚡</div>
            <h1 className="text-3xl font-extrabold text-gradient-amber mb-1">Reaction Grid</h1>
            <p className="text-text-secondary text-sm mb-6 text-center max-w-xs">
              Tap targets that appear on the grid as fast as you can.
              They disappear after 3 seconds!
            </p>
            <button onClick={startGame} className="btn btn-lg btn-success animate-pulse-glow">
              Start Game
            </button>
          </div>
        )}

        {phase === "playing" && (
          <div className="flex flex-col items-center w-full max-w-sm">
            {/* HUD */}
            <div className="w-full flex justify-between mb-3 text-sm">
              <span className="text-text-muted">🎯 {score}</span>
              <span className={`font-bold ${timeLeft <= 10 ? "text-[var(--accent-rose)] animate-pulse" : "text-text-muted"}`}>
                {timeLeft}s
              </span>
              <span className="text-text-muted">⏱ {avgRT > 0 ? `${avgRT}ms` : "---"}</span>
            </div>

            {/* Grid */}
            <div
              className="grid gap-1.5 w-full max-w-[320px]"
              style={{
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              }}
            >
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => {
                const isActive = grid.has(idx);
                return (
                  <button
                    key={idx}
                    onClick={() => handleTap(idx)}
                    className={`aspect-square rounded-xl transition-all duration-150 flex items-center justify-center text-lg ${
                      isActive
                        ? "bg-[var(--accent-amber)] shadow-lg scale-105 animate-pulse cursor-pointer"
                        : "bg-[var(--bg-card)] opacity-40"
                    }`}
                    style={{
                      boxShadow: isActive ? "0 0 15px rgba(251, 191, 36, 0.5)" : "none",
                    }}
                  >
                    {isActive && "⚡"}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {phase === "game_over" && (
          <div className="flex flex-col items-center animate-scale-in">
            <div className="text-5xl mb-3">⚡</div>
            <h1 className="text-3xl font-extrabold text-gradient-amber mb-1">Time&apos;s Up!</h1>
            <div className="glass-card-static p-6 w-full max-w-xs space-y-4 text-center mb-6">
              <div>
                <p className="text-4xl font-extrabold text-gradient">{score}</p>
                <p className="text-xs text-text-muted mt-1">Targets Hit</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xl font-bold text-[var(--accent-amber)]">{avgRT}ms</p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Avg Reaction</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-[var(--accent-rose)]">{missed}</p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Missed</p>
                </div>
              </div>
            </div>
            <button onClick={startGame} className="btn btn-md btn-primary">Play Again</button>
            {dailyMode && dailyGameIdx !== null && (
              <Link href={`/daily?game=${dailyGameIdx}&score=${score}`} className="btn btn-md btn-ghost mt-3">
                ← Back to Daily Challenge
              </Link>
            )}
          </div>
        )}
      </main>
    </>
  );
}
