"use client";

import { Suspense, useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import { saveResult } from "@/lib/storage";
import { createRng } from "@/lib/dailyChallenge";
import { useSeedParams } from "@/lib/useSeedParams";

type Phase = "start" | "waiting" | "ready" | "too-early" | "result-round" | "done";

function SpeedReactionContent() {
  const router = useRouter();
  const { dailyMode, seed } = useSeedParams();
  const rng = dailyMode ? createRng(seed) : Math.random;
  const dailyGameIdx = useSeedParams().dailyGame;
  const [phase, setPhase] = useState<Phase>("start");
  const [round, setRound] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [earlyCount, setEarlyCount] = useState(0);
  const [showTime, setShowTime] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyAt = useRef(0);
  const startTime = useRef(Date.now());
  const btnRef = useRef<HTMLButtonElement>(null);
  const TOTAL = 10;

  const clearTimer = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; };

  const startWait = useCallback(() => {
    clearTimer();
    setPhase("waiting");
    const delay = 1000 + rng() * 3000;
    timer.current = setTimeout(() => {
      readyAt.current = Date.now();
      setPhase("ready");
    }, delay);
  }, []);

  const handleTap = () => {
    if (phase === "waiting") {
      clearTimer();
      setPhase("too-early");
      setEarlyCount((c) => c + 1);
      timer.current = setTimeout(() => startWait(), 1000);
      return;
    }
    if (phase === "ready") {
      const rt = Date.now() - readyAt.current;
      setReactionTimes((t) => [...t, rt]);
      setShowTime(rt);
      setPhase("result-round");
      const nextRound = round + 1;
      timer.current = setTimeout(() => {
        if (nextRound >= TOTAL) {
          setPhase("done");
          const avg = [...reactionTimes, rt].reduce((a, b) => a + b, 0) / (reactionTimes.length + 1);
          const score = Math.max(0, Math.round((1000 - avg) / 1000 * 10000));
          saveResult({ gameId: "speed-tap", score, maxScore: 10000, accuracy: Math.round(Math.max(0, 1 - earlyCount / TOTAL) * 100), difficulty: "medium", duration: Math.round((Date.now() - startTime.current) / 1000) });
        } else {
          setRound(nextRound);
          startWait();
        }
      }, 1500);
      return;
    }
    if (phase === "start" || phase === "done") {
      setReactionTimes([]);
      setEarlyCount(0);
      setRound(0);
      startTime.current = Date.now();
      startWait();
    }
  };

  // Support Space bar on desktop
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Spacebar" || e.key === "Space") {
      e.preventDefault();
      handleTap();
    }
  };

  useEffect(() => () => clearTimer(), []);

  const circleColor = phase === "ready" ? "var(--accent-green)"
    : phase === "too-early" ? "var(--accent-rose)"
    : phase === "waiting" ? "var(--accent-amber)"
    : "var(--accent-blue)";

  const circleText = phase === "waiting" ? "Wait..."
    : phase === "ready" ? "TAP!"
    : phase === "too-early" ? "Too Early!"
    : phase === "result-round" ? `${showTime}ms`
    : phase === "done" ? "Done!"
    : "Tap to Start";

  return (
    <>
      <NavBar />
      <main className="relative z-10 min-h-dvh flex flex-col items-center justify-center px-4">
        <h1 className="text-3xl font-extrabold text-gradient-amber mb-1">Speed Tap</h1>
        <p className="text-text-secondary text-sm mb-8">Round {Math.min(round + 1, TOTAL)}/{TOTAL}</p>

        <button
          ref={btnRef}
          onClick={handleTap}
          onKeyDown={handleKeyDown}
          className="w-[min(80vw,320px)] h-[min(80vw,320px)] min-h-[40dvh] rounded-full flex items-center justify-center text-2xl font-bold transition-all duration-150 select-none touch-action-manipulation will-change-transform"
          style={{
            background: circleColor,
            color: phase === "waiting" ? "#0a0a1a" : "white",
            boxShadow: `0 0 60px ${circleColor}40`,
            animation: phase === "waiting" ? "pulse-glow 1.5s ease-in-out infinite" : "none",
          }}
          tabIndex={0}
        >
          {circleText}
        </button>

        {reactionTimes.length > 0 && phase !== "start" && (
          <div className="mt-6 glass-card-static p-4 w-full max-w-xs text-center">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Fastest: <span className="text-[var(--accent-green)] font-bold">{Math.min(...reactionTimes)}ms</span></p>
            <div className="h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
              <div className="h-full rounded-full bg-[var(--accent-amber)]" style={{ width: `${(round / TOTAL) * 100}%` }} />
            </div>
          </div>
        )}

        {phase === "done" && (
          <div className="mt-4 animate-scale-in glass-card-static p-4 w-full max-w-xs text-center">
            <p className="text-sm text-text-secondary">Avg: <span className="text-[var(--accent-blue)] font-bold">{Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)}ms</span></p>
            <p className="text-xs text-text-muted mt-1">{earlyCount} false {earlyCount === 1 ? "start" : "starts"}</p>
            {dailyMode && dailyGameIdx !== null && (
              <Link href={`/daily?game=${dailyGameIdx}&score=${Math.max(0, Math.round((1000 - reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length) / 1000 * 10000))}`}
                className="btn btn-md btn-ghost mt-3 block text-center text-xs">
                ← Back to Daily Challenge
              </Link>
            )}
          </div>
        )}
      </main>
    </>
  );
}

export default function SpeedReactionPage() {
  return (
    <Suspense fallback={
      <main className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <SpeedReactionContent />
    </Suspense>
  );
}
