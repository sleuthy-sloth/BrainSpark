"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import { saveResult } from "@/lib/storage";

type Phase = "idle" | "playing" | "feedback" | "game_over";

const ROUNDS = 10;

/* ─── Pattern Types ──────────────────────── */

type Pattern = {
  grid: (number | null)[]; // 9 cells, null = missing
  answer: number; // correct choice index (0-5)
  choices: number[]; // 6 options
};

/* ─── Generate a Raven-style pattern ─────── */

function generatePattern(rng: () => number): Pattern {
  // Pattern rules:
  // 1. Row-wise: each row follows a rule (e.g., increasing, rotation, XOR)
  // 2. Column-wise: each column follows a rule
  // 3. Both: element in 3rd row/col is derived from first two

  const rule = Math.floor(rng() * 4);
  const values = Array.from({ length: 9 }, () => Math.floor(rng() * 6));

  let grid: number[];

  switch (rule) {
    case 0: {
      // Row-wise increment: each row adds N
      const r0 = Math.floor(rng() * 4);
      const r1 = Math.floor(rng() * 4);
      const step = Math.floor(rng() * 2) + 1;
      grid = [
        r0, r0 + step, r0 + step * 2,
        r1, r1 + step, r1 + step * 2,
        0, 0, 0, // will be filled
      ];
      grid[6] = Math.floor(rng() * 4);
      grid[7] = grid[6] + step;
      grid[8] = -1; // missing
      break;
    }
    case 1: {
      // Column-wise: each column follows pattern A, A+B, A+2B
      const base = [Math.floor(rng() * 3), Math.floor(rng() * 3), Math.floor(rng() * 3)];
      grid = [
        base[0], base[1], base[2],
        base[0] + 2, base[1] + 2, base[2] + 2,
        base[0] + 4, base[1] + 4, -1,
      ];
      break;
    }
    case 2: {
      // Overlay: cell (i,j) = row_i + col_j combined
      const rows = [Math.floor(rng() * 3), Math.floor(rng() * 3)];
      const cols = [Math.floor(rng() * 3), Math.floor(rng() * 3), Math.floor(rng() * 3)];
      grid = [
        rows[0] + cols[0], rows[0] + cols[1], rows[0] + cols[2],
        rows[1] + cols[0], rows[1] + cols[1], rows[1] + cols[2],
        0, 0, -1,
      ];
      // Fill row 3 based on pattern
      const row3val = Math.floor(rng() * 3);
      grid[6] = row3val + cols[0];
      grid[7] = row3val + cols[1];
      break;
    }
    case 3: {
      // Diagonal symmetry
      const diag = [Math.floor(rng() * 5), Math.floor(rng() * 5), Math.floor(rng() * 5)];
      grid = [
        diag[0], diag[1], diag[2],
        diag[0], diag[1], diag[2],
        diag[0], diag[1], -1,
      ];
      break;
    }
    default:
      grid = Array.from({ length: 9 }, () => Math.floor(rng() * 5));
  }

  // Ensure values are 0-5
  grid = grid.map((v) => Math.max(0, Math.min(5, v)));

  const answer = grid[8];
  const correctIdx = Math.floor(rng() * 6);

  // Generate 6 choices
  const choices: number[] = [];
  const usedValues = new Set<number>();
  usedValues.add(answer);

  const correctPos = Math.floor(rng() * 6);
  for (let i = 0; i < 6; i++) {
    if (i === correctPos) {
      choices.push(answer);
    } else {
      let v: number;
      do {
        v = Math.floor(rng() * 6);
      } while (usedValues.has(v));
      usedValues.add(v);
      choices.push(v);
    }
  }

  return {
    grid: grid.map((v, i) => (i === 8 ? null : v)),
    answer: correctPos,
    choices,
  };
}

/* ─── Component ──────────────────────────── */

export default function PatternMatrix({
  seed,
  dailyMode = false,
  dailyGameIdx = null,
}: {
  seed?: number;
  dailyMode?: boolean;
  dailyGameIdx?: number | null;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<"correct" | "wrong" | null>(null);
  const startTime = useRef(Date.now());

  const nextRound = useCallback(() => {
    const getRng = seed !== undefined ? mulberry32(seed + round) : Math.random;
    const p = generatePattern(getRng as () => number);
    setPattern(p);
    setSelected(null);
    setLastResult(null);
    setPhase("playing");
  }, [round, seed]);

  const startGame = () => {
    setRound(0);
    setCorrect(0);
    startTime.current = Date.now();
    nextRound();
  };

  const handleChoice = (idx: number) => {
    if (phase !== "playing" || !pattern) return;
    setSelected(idx);

    const isCorrect = idx === pattern.answer;
    if (isCorrect) setCorrect((c) => c + 1);
    setLastResult(isCorrect ? "correct" : "wrong");

    const newRound = round + 1;
    setRound(newRound);

    if (newRound >= ROUNDS) {
      setPhase("game_over");
      const elapsed = Math.round((Date.now() - startTime.current) / 1000);
      saveResult({
        gameId: "pattern-matrix",
        score: correct + (isCorrect ? 1 : 0),
        maxScore: ROUNDS,
        accuracy: Math.round(((correct + (isCorrect ? 1 : 0)) / (newRound)) * 100),
        difficulty: "medium",
        duration: elapsed,
      });
    } else {
      setPhase("feedback");
      setTimeout(() => {
        nextRound();
      }, 800);
    }
  };

  /* ─── Render ───────────────────────────── */

  return (
    <>
      <NavBar />
      <main className="relative z-10 min-h-dvh flex flex-col items-center justify-center px-4">
        {phase === "idle" && (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="text-5xl mb-4 opacity-60">⊞</div>
            <h1 className="text-3xl font-extrabold text-gradient-cyan mb-1">Pattern Matrix</h1>
            <p className="text-text-secondary text-sm mb-6 text-center max-w-xs">
              Identify the missing piece in the 3×3 pattern.
              Each row and column follows a logical rule.
            </p>
            <button onClick={startGame} className="btn btn-lg btn-success animate-pulse-glow">
              Start Game
            </button>
          </div>
        )}

        {(phase === "playing" || phase === "feedback") && pattern && (
          <div className="flex flex-col items-center w-full max-w-sm">
            {/* HUD */}
            <div className="w-full flex justify-between mb-3 text-sm">
              <span className="text-text-muted">{round + 1}/{ROUNDS}</span>
              <span className="font-bold text-[var(--accent-green)]">✓ {correct}</span>
            </div>

            {/* 3×3 Pattern Grid */}
            <div className="grid grid-cols-3 gap-1 mb-4 w-full max-w-[240px]">
              {pattern.grid.map((val, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-lg flex items-center justify-center text-2xl font-bold ${
                    val === null
                      ? "bg-[var(--bg-card)] border-2 border-dashed border-[var(--accent-cyan)]"
                      : "bg-[var(--bg-secondary)]"
                  }`}
                >
                  {val !== null ? SYMBOLS[val] : "?"}
                </div>
              ))}
            </div>

            <p className="text-xs text-text-muted mb-3">Choose the missing piece:</p>

            {lastResult === "correct" && (
              <p className="text-xs text-[var(--accent-green)] mb-2">✓ Correct!</p>
            )}
            {lastResult === "wrong" && (
              <p className="text-xs text-[var(--accent-rose)] mb-2">✗ Try the next one!</p>
            )}

            {/* Choices */}
            <div className="grid grid-cols-3 gap-2 w-full max-w-[240px]">
              {pattern.choices.map((val, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChoice(idx)}
                  disabled={phase === "feedback"}
                  className={`aspect-square rounded-xl text-2xl font-bold transition-all ${
                    phase === "playing"
                      ? "bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] hover:scale-105 cursor-pointer"
                      : "opacity-60"
                  } ${
                    selected === idx && lastResult === "wrong"
                      ? "ring-2 ring-[var(--accent-rose)]"
                      : ""
                  }`}
                >
                  {SYMBOLS[val]}
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === "game_over" && (
          <div className="flex flex-col items-center animate-scale-in">
            <div className="text-5xl mb-3">🧩</div>
            <h1 className="text-3xl font-extrabold text-gradient-cyan mb-1">Complete!</h1>
            <div className="glass-card-static p-6 w-full max-w-xs space-y-4 text-center mb-6">
              <div>
                <p className="text-4xl font-extrabold text-gradient">{correct}/{ROUNDS}</p>
                <p className="text-xs text-text-muted mt-1">Patterns Solved</p>
              </div>
              <p className="text-[10px] text-text-muted uppercase tracking-wider">
                {correct >= 8 ? "🧠 Genius!" : correct >= 5 ? "🔥 Good eye!" : "🌱 Keep practicing!"}
              </p>
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

const SYMBOLS = ["●", "■", "▲", "◆", "⬟", "★"];

function mulberry32(a: number): () => number {
  let s = a | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
