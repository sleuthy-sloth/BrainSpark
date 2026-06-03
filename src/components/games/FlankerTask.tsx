"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import { saveResult } from "@/lib/storage";

type Phase = "idle" | "playing" | "feedback" | "game_over";

interface FlankerTaskProps {
  seed?: number;
  dailyMode?: boolean;
  dailyGameIdx?: number | null;
}

const ARROWS = ["←", "→"] as const;
const FLANKER_TYPES = ["congruent", "incongruent"] as const;
const ROUNDS = 20;

/* ─── Component ──────────────────────────── */

export default function FlankerTask({
  seed,
  dailyMode = false,
  dailyGameIdx = null,
}: FlankerTaskProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [target, setTarget] = useState<"←" | "→">("←");
  const [flankerType, setFlankerType] = useState<"congruent" | "incongruent">("congruent");
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [lastResult, setLastResult] = useState<"correct" | "wrong" | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const roundStart = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameStart = useRef(Date.now());

  const generateTrial = useCallback(() => {
    const dir = Math.random() > 0.5 ? "→" : "←";
    const type = Math.random() > 0.5 ? "congruent" : "incongruent";
    setTarget(dir);
    setFlankerType(type);
    setLastResult(null);
    roundStart.current = Date.now();
  }, []);

  const startGame = () => {
    setRound(0);
    setCorrect(0);
    setTotalTime(0);
    setReactionTimes([]);
    setTimeLeft(30);
    setLastResult(null);
    gameStart.current = Date.now();
    generateTrial();
    setPhase("playing");

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const handleResponse = (dir: "←" | "→") => {
    if (phase !== "playing" || timeLeft <= 0) return;

    const rt = Date.now() - roundStart.current;
    const isCorrect = dir === target;

    if (isCorrect) {
      setCorrect((c) => c + 1);
      setReactionTimes((t) => [...t, rt]);
      setLastResult("correct");
    } else {
      setLastResult("wrong");
    }

    const newRound = round + 1;
    setRound(newRound);

    if (newRound >= ROUNDS || timeLeft <= 0) {
      setPhase("game_over");
      if (timerRef.current) clearInterval(timerRef.current);
      const elapsed = Math.round((Date.now() - gameStart.current) / 1000);
      saveResult({
        gameId: "flanker-task",
        score: correct + (isCorrect ? 1 : 0),
        maxScore: ROUNDS,
        accuracy: Math.round(((correct + (isCorrect ? 1 : 0)) / newRound) * 100),
        difficulty: "medium",
        duration: elapsed,
      });
    } else {
      setPhase("feedback");
      setTimeout(() => {
        generateTrial();
        setPhase("playing");
      }, 300);
    }
  };

  const avgRT = reactionTimes.length > 0
    ? Math.round(reactionTimes.reduce((s, t) => s + t, 0) / reactionTimes.length)
    : 0;

  /* ─── Render ───────────────────────────── */

  return (
    <>
      <NavBar />
      <main className="relative z-10 min-h-dvh flex flex-col items-center justify-center px-4">
        {phase === "idle" && (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="text-5xl mb-4 opacity-60">◉</div>
            <h1 className="text-3xl font-extrabold text-gradient-rose mb-1">Flanker Task</h1>
            <p className="text-text-secondary text-sm mb-6 text-center max-w-xs">
              Identify the direction of the center arrow.
              Ignore the flanking arrows — they may point the same or opposite way!
            </p>
            <button onClick={startGame} className="btn btn-lg btn-success animate-pulse-glow">
              Start Game
            </button>
          </div>
        )}

        {(phase === "playing" || phase === "feedback") && (
          <div className="flex flex-col items-center w-full max-w-sm">
            {/* HUD */}
            <div className="w-full flex justify-between mb-4 text-sm">
              <span className="text-text-muted">
                {round}/{ROUNDS}
              </span>
              <span className={`font-bold ${timeLeft <= 10 ? "text-[var(--accent-rose)] animate-pulse" : "text-text-muted"}`}>
                {timeLeft}s
              </span>
              <span className="text-text-muted">
                ✓ {correct}
              </span>
            </div>

            {/* Flanker Display */}
            <div className="glass-card-static p-8 w-full text-center mb-6 min-h-[120px] flex items-center justify-center">
              <div className="select-none">
                {/* Flanking arrows (top and bottom) */}
                <div className="text-3xl text-text-muted mb-2 tracking-[0.5em]" style={{ opacity: 0.5 }}>
                  {flankerType === "congruent" ? `${target}${target}${target}` : `${target === "←" ? "→" : "←"}${target === "←" ? "→" : "←"}${target === "←" ? "→" : "←"}`}
                </div>
                {/* Center target */}
                <div className="text-6xl font-bold text-white animate-scale-in" style={{ textShadow: "0 0 20px rgba(255,255,255,0.3)" }}>
                  {target}
                </div>
                {/* Flanking arrows (bottom) */}
                <div className="text-3xl text-text-muted mt-2 tracking-[0.5em]" style={{ opacity: 0.5 }}>
                  {flankerType === "congruent" ? `${target}${target}${target}` : `${target === "←" ? "→" : "←"}${target === "←" ? "→" : "←"}${target === "←" ? "→" : "←"}`}
                </div>
              </div>
            </div>

            {lastResult === "correct" && (
              <p className="text-xs text-[var(--accent-green)] mb-2">✓</p>
            )}
            {lastResult === "wrong" && (
              <p className="text-xs text-[var(--accent-rose)] mb-2">✗</p>
            )}

            {/* Response buttons */}
            <div className="flex gap-6">
              <button
                onClick={() => handleResponse("←")}
                disabled={phase === "feedback"}
                className="w-20 h-20 rounded-2xl text-3xl font-bold btn-ghost glass-card hover:scale-110 transition-all flex items-center justify-center"
              >
                ←
              </button>
              <button
                onClick={() => handleResponse("→")}
                disabled={phase === "feedback"}
                className="w-20 h-20 rounded-2xl text-3xl font-bold btn-ghost glass-card hover:scale-110 transition-all flex items-center justify-center"
              >
                →
              </button>
            </div>

            {/* Keyboard hint */}
            <p className="text-[10px] text-text-muted mt-3">
              Press ← or → arrow keys
            </p>
          </div>
        )}

        {phase === "game_over" && (
          <div className="flex flex-col items-center animate-scale-in">
            <div className="text-5xl mb-3">🎯</div>
            <h1 className="text-3xl font-extrabold text-gradient-rose mb-1">Time&apos;s Up!</h1>
            <div className="glass-card-static p-6 w-full max-w-xs space-y-4 text-center mb-6">
              <div>
                <p className="text-4xl font-extrabold text-gradient">{correct}/{round}</p>
                <p className="text-xs text-text-muted mt-1">Correct</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xl font-bold text-[var(--accent-amber)]">{avgRT}ms</p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Avg Reaction</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-[var(--accent-green)]">
                    {Math.round((correct / Math.max(round, 1)) * 100)}%
                  </p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Accuracy</p>
                </div>
              </div>
            </div>
            <button onClick={startGame} className="btn btn-md btn-primary">Play Again</button>
            {dailyMode && dailyGameIdx !== null && (
              <Link href={`/daily?game=${dailyGameIdx}&score=${correct}`} className="btn btn-md btn-ghost mt-3">
                ← Back to Daily Challenge
              </Link>
            )}
          </div>
        )}
      </main>
    </>
  );
}
