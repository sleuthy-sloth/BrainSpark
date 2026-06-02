"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import { saveResult } from "@/lib/storage";
import { createRng } from "@/lib/dailyChallenge";

/* ─── Tile Colors ─────────────────────────── */

const TILE_COLORS = [
  "#e63e6b", // rose
  "#4ade80", // green
  "#fbbf24", // amber
  "#60a5fa", // blue
  "#fb923c", // orange
  "#a78bfa", // violet
  "#22d3ee", // cyan
  "#f472b6", // pink
  "#84cc16", // lime
];

/* ─── Types ──────────────────────────────── */

type Phase = "idle" | "showing" | "waiting" | "feedback" | "game_over";

interface SequenceMemoryProps {
  seed?: number;
  dailyMode?: boolean;
  dailyGameIdx?: number | null;
}

/* ─── Seeded Sequence Generator ──────────── */

function generateSequence(rng: () => number, length: number): number[] {
  const seq: number[] = [];
  for (let i = 0; i < length; i++) {
    seq.push(Math.floor(rng() * 9));
  }
  return seq;
}

/* ─── Component ──────────────────────────── */

export default function SequenceMemory({
  seed,
  dailyMode = false,
  dailyGameIdx = null,
}: SequenceMemoryProps) {
  const rng = dailyMode && seed !== undefined ? createRng(seed) : null;
  const [phase, setPhase] = useState<Phase>("idle");
  const [sequence, setSequence] = useState<number[]>([]);
  const [seqLen, setSeqLen] = useState(3);
  const [lives, setLives] = useState(3);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [activeTile, setActiveTile] = useState<number | null>(null);
  const [wrongTile, setWrongTile] = useState<number | null>(null);
  const [waitingFor, setWaitingFor] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const wrongTapsRef = useRef(0);
  const startTime = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /* ─── Show Sequence Animation ──────────── */

  const showSequence = useCallback((seq: number[]) => {
    setPhase("showing");
    setActiveTile(null);
    setWrongTile(null);

    const interval = 600; // ms per flash
    seq.forEach((tileIdx, i) => {
      setTimeout(() => {
        setActiveTile(tileIdx);
        setTimeout(() => setActiveTile(null), 200);
        if (i === seq.length - 1) {
          // After last flash finishes, switch to waiting
          setTimeout(() => {
            setPhase("waiting");
            setWaitingFor(0);
          }, 300);
        }
      }, interval * i);
    });
  }, []);

  /* ─── Start / Next Round ───────────────── */

  const startRound = useCallback((len: number) => {
    const getRng = rng || Math.random;
    const seq = generateSequence(getRng, len);
    setSequence(seq);
    setWaitingFor(0);
    // Small delay before showing
    setTimeout(() => showSequence(seq), 400);
  }, [rng, showSequence]);

  const startGame = () => {
    setLives(3);
    setRound(0);
    setScore(0);
    setSeqLen(3);
    setTotalCorrect(0);
    wrongTapsRef.current = 0;
    startTime.current = Date.now();
    startRound(3);
  };

  /* ─── Tile Tap ─────────────────────────── */

  const handleTap = (tileIdx: number) => {
    if (phase !== "waiting") return;

    const expected = sequence[waitingFor];

    if (tileIdx === expected) {
      // Correct tap
      const newWaitingFor = waitingFor + 1;
      setWaitingFor(newWaitingFor);

      // Brief green glow on correct tile
      setActiveTile(tileIdx);
      setTimeout(() => setActiveTile(null), 150);

      if (newWaitingFor >= sequence.length) {
        // Sequence completed!
        const newRound = round + 1;
        const newScore = Math.max(score, seqLen);
        const newSeqLen = seqLen + 1;

        setRound(newRound);
        setScore(newScore);
        setTotalCorrect((c) => c + seqLen);

        // Level up animation
        setShowLevelUp(true);
        setTimeout(() => setShowLevelUp(false), 1200);

        // Brief feedback, then next round
        setPhase("feedback");
        setTimeout(() => {
          setSeqLen(newSeqLen);
          startRound(newSeqLen);
        }, 800);
      }
    } else {
      // Wrong tap — lose a life
      wrongTapsRef.current += 1;
      const wrongTotal = wrongTapsRef.current;
      const newLives = lives - 1;
      setLives(newLives);
      setWrongTile(tileIdx);
      setPhase("feedback");

      // Shake animation via the class
      setTimeout(() => setWrongTile(null), 500);

      if (newLives <= 0) {
        // Game over
        setTimeout(() => {
          setPhase("game_over");
          const totalWrong = wrongTapsRef.current || 1;
          saveResult({
            gameId: "sequence-memory",
            score: Math.max(score, seqLen),
            maxScore: Math.max(score, seqLen),
            accuracy: Math.round(
              (totalCorrect > 0)
                ? (totalCorrect / (totalCorrect + totalWrong)) * 100
                : 0
            ),
            difficulty:
              seqLen <= 4 ? "easy" : seqLen <= 6 ? "medium" : "hard",
            duration: Math.round((Date.now() - startTime.current) / 1000),
          });
        }, 600);
      } else {
        // Retry same sequence
        setTimeout(() => {
          setWaitingFor(0);
          showSequence(sequence);
        }, 800);
      }
    }
  };

  useEffect(() => () => clearTimer(), [clearTimer]);

  /* ─── Render ───────────────────────────── */

  return (
    <>
      <NavBar />
      <main className="relative z-10 min-h-dvh flex flex-col items-center justify-center px-4">

        {/* ── IDLE ── */}
        {phase === "idle" && (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="text-5xl mb-4 opacity-60">◈</div>
            <h1 className="text-3xl font-extrabold text-gradient-green mb-1">
              Sequence Memory
            </h1>
            <p className="text-text-secondary text-sm mb-6 text-center">
              Watch the tiles light up,<br />then tap them in the same order.
            </p>
            <div className="glass-card-static p-6 w-full max-w-xs space-y-3 text-center mb-6">
              <div className="grid grid-cols-3 gap-2 text-xs text-text-muted">
                <div>
                  <p className="text-lg font-bold text-[var(--accent-amber)]">3</p>
                  <p className="text-[10px] uppercase tracking-wider">Lives</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[var(--accent-green)]">3→</p>
                  <p className="text-[10px] uppercase tracking-wider">Min Seq</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[var(--accent-rose)]">∞</p>
                  <p className="text-[10px] uppercase tracking-wider">Max Seq</p>
                </div>
              </div>
            </div>
            <button
              onClick={startGame}
              className="btn btn-lg btn-success animate-pulse-glow"
            >
              Start Game
            </button>
          </div>
        )}

        {/* ── SHOWING / WAITING / FEEDBACK / GAME_OVER ── */}
        {(phase === "showing" || phase === "waiting" || phase === "feedback") && (
          <div className="flex flex-col items-center w-full max-w-xs">
            {/* HUD */}
            <div className="w-full flex items-center justify-between mb-4 text-sm">
              <div className="flex items-center gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <span
                    key={i}
                    className={`text-lg transition-opacity ${
                      i < lives ? "opacity-100" : "opacity-20"
                    }`}
                  >
                    ❤️
                  </span>
                ))}
              </div>
              <span className="text-text-secondary">
                Level <span className="font-bold text-[var(--accent-green)]">{seqLen - 2}</span>
              </span>
              <span className="text-text-secondary">
                Best: <span className="font-bold text-[var(--accent-amber)]">{score}</span>
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden mb-5">
              <div
                className="h-full rounded-full bg-[var(--accent-green)] transition-all duration-300"
                style={{ width: `${sequence.length > 0 ? (waitingFor / sequence.length) * 100 : 0}%` }}
              />
            </div>

            {/* Status text */}
            {phase === "showing" && (
              <p className="text-xs text-text-muted mb-3 animate-pulse">
                Watch the sequence...
              </p>
            )}
            {phase === "waiting" && (
              <p className="text-xs text-text-muted mb-3">
                Tap tile {waitingFor + 1} of {sequence.length}
              </p>
            )}

            {/* Level up banner */}
            {showLevelUp && (
              <div className="mb-3 animate-scale-in">
                <span className="text-sm font-extrabold text-gradient-green">
                  ★ Level {seqLen - 2} ★
                </span>
              </div>
            )}

            {/* 3×3 Grid */}
            <div
              className={`grid grid-cols-3 gap-2 w-full max-w-[280px] transition-transform duration-[400ms] ${
                wrongTile !== null ? "animate-shake" : ""
              }`}
            >
              {TILE_COLORS.map((color, idx) => {
                const isActive = activeTile === idx && wrongTile === null;
                const isWrong = wrongTile === idx;

                return (
                  <button
                    key={idx}
                    onClick={() => handleTap(idx)}
                    disabled={phase !== "waiting"}
                    className={`aspect-square rounded-xl transition-all duration-200 will-change-transform min-h-[60px] min-w-[60px] ${
                      isWrong
                        ? "scale-95 brightness-50"
                        : phase === "waiting"
                        ? "hover:scale-[1.03] cursor-pointer"
                        : ""
                    }`}
                    style={{
                      background: color,
                      opacity: isWrong ? 0.4 : isActive ? 1 : 0.65,
                      boxShadow: isActive
                        ? `0 0 20px ${color}80`
                        : isWrong
                        ? "0 0 20px rgba(251, 113, 133, 0.6)"
                        : "none",
                      transform: isActive ? "scale(1.1)" : isWrong ? "scale(0.92)" : "scale(1)",
                      filter: isActive ? "brightness(1.3)" : "none",
                    }}
                    tabIndex={phase === "waiting" ? 0 : -1}
                    aria-label={`Tile ${idx + 1}`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* ── GAME OVER ── */}
        {phase === "game_over" && (
          <div className="flex flex-col items-center animate-scale-in">
            <div className="text-5xl mb-3">🎯</div>
            <h1 className="text-3xl font-extrabold text-gradient-green mb-1">
              Game Over
            </h1>
            <p className="text-text-secondary text-sm mb-6">
              Longest sequence: {score}
            </p>
            <div className="glass-card-static p-6 w-full max-w-xs space-y-4 text-center mb-6">
              <div>
                <p className="text-4xl font-extrabold text-gradient-green">
                  {score}
                </p>
                <p className="text-xs text-text-muted">Longest Sequence</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xl font-bold text-[var(--accent-amber)]">
                    Level {Math.max(0, score - 2)}
                  </p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Reached</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-[var(--accent-rose)]">
                    {3 - lives} ❌
                  </p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Mistakes</p>
                </div>
              </div>
            </div>
            <button
              onClick={startGame}
              className="btn btn-md btn-primary"
            >
              Play Again
            </button>
            {dailyMode && dailyGameIdx !== null && (
              <Link
                href={`/daily?game=${dailyGameIdx}&score=${score}`}
                className="btn btn-md btn-ghost mt-3 block text-center"
              >
                ← Back to Daily Challenge
              </Link>
            )}
          </div>
        )}
      </main>
    </>
  );
}
