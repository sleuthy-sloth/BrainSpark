"use client";

import { Suspense, useState, useCallback, useEffect, useRef } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import GameWrapper, { type GameConfig, type GameAPI } from "@/engine/GameWrapper";
import { saveResult } from "@/lib/db";
import { createRng } from "@/lib/dailyChallenge";
import { useSeedParams } from "@/lib/useSeedParams";

interface PatternCell {
  row: number;
  col: number;
}

function makeRandInt(dailyMode: boolean, seed: number) {
  const rng = dailyMode ? createRng(seed) : Math.random;
  return (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
}

function generatePattern(gridSize: number, count: number, randInt: (min: number, max: number) => number): PatternCell[] {
  const cells: PatternCell[] = [];
  const used = new Set<string>();
  while (cells.length < count) {
    const row = randInt(0, gridSize - 1);
    const col = randInt(0, gridSize - 1);
    const key = `${row}-${col}`;
    if (!used.has(key)) {
      used.add(key);
      cells.push({ row, col });
    }
  }
  return cells;
}

function MemoryMatrixContent() {
  const { dailyMode, seed } = useSeedParams();
  const randInt = makeRandInt(dailyMode, seed);
  const dailyGameIdx = useSeedParams().dailyGame;
  const [gridSize, setGridSize] = useState(3);
  const [pattern, setPattern] = useState<PatternCell[]>([]);
  const [patternCount, setPatternCount] = useState(2);
  const [showPattern, setShowPattern] = useState(true);
  const [tapped, setTapped] = useState<Set<string>>(new Set());
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [correctRounds, setCorrectRounds] = useState(0);
  const [phase, setPhase] = useState<"idle" | "memorize" | "recall" | "result" | "final">("idle");
  const [lastFeedback, setLastFeedback] = useState<boolean | null>(null);
  const startTime = useRef(Date.now());
  const totalRounds = 5;

  const config: GameConfig = {
    gameId: "memory-matrix",
    title: "Memory Matrix",
    duration: 0, // round-based, not timed
    instructions: `Watch the pattern.\nThen tap the same tiles.\nGrid grows as you improve!`,
    showCombo: false,
  };

  const startRound = useCallback((size: number, count: number) => {
    const p = generatePattern(size, count, randInt);
    setPattern(p);
    setShowPattern(true);
    setTapped(new Set());
    setLastFeedback(null);
    setPhase("memorize");
    // Show pattern for 1.5s + 0.2s per tile
    const duration = 1500 + count * 200;
    setTimeout(() => {
      setShowPattern(false);
      setPhase("recall");
    }, duration);
  }, [randInt]);

  const handleCellTap = (row: number, col: number) => {
    if (phase !== "recall") return;
    const key = `${row}-${col}`;
    if (tapped.has(key)) return;
    const newTapped = new Set(tapped);
    newTapped.add(key);
    setTapped(newTapped);

    // Check if all found
    if (newTapped.size >= pattern.length) {
      const allCorrect = pattern.every((c) => newTapped.has(`${c.row}-${c.col}`));
      const points = allCorrect ? 10 + patternCount * 5 : 0;
      setScore((s) => s + points);
      setLastFeedback(allCorrect);
      if (allCorrect) setCorrectRounds((c) => c + 1);

      // Check for extra tiles tapped
      const extraTiles = newTapped.size - pattern.length;
      const totalCorrect = allCorrect ? Math.max(0, patternCount - extraTiles) : 0;
      const pct = Math.round((totalCorrect / patternCount) * 100);

      setTimeout(() => {
        const nextRound = round + 1;
        if (nextRound >= totalRounds) {
          setPhase("final");
          const totalScore = score + points;
          saveResult({
            gameId: "memory-matrix",
            score: totalScore,
            maxScore: totalRounds * 30,
            accuracy: Math.round(correctRounds / totalRounds * 100),
            difficulty: `${gridSize}x${gridSize}`,
            duration: Math.round((Date.now() - startTime.current) / 1000),
          });
        } else {
          setRound(nextRound);
          // Scale up — increase grid or pattern count
          const newCount = patternCount + (correctRounds >= Math.floor(nextRound / 2) ? 1 : 0);
          const newSize = newCount > gridSize * gridSize - 2 ? Math.min(gridSize + 1, 5) : gridSize;
          setGridSize(newSize);
          setPatternCount(Math.min(newCount, newSize * newSize - 2));
          startRound(newSize, Math.min(newCount, newSize * newSize - 2));
        }
      }, 800);
    }
  };

  // Game lifecycle handlers
  const startGame = (api: GameAPI) => {
    setGridSize(3);
    setPatternCount(2);
    setRound(0);
    setScore(0);
    setCorrectRounds(0);
    startTime.current = Date.now();
    api.startGame();
    // Start first round after countdown
    setTimeout(() => startRound(3, 2), 3000);
  };

  const renderGame = (api: GameAPI) => {
    if (api.phase === "instructions") {
      return (
        <>
          <NavBar />
          <main className="flex-1 flex flex-col items-center justify-center px-4 animate-fade-in">
            <div className="text-5xl mb-4 opacity-60">◆</div>
            <h1 className="text-3xl font-extrabold text-gradient-green mb-1">{config.title}</h1>
            <p className="text-text-secondary text-sm mb-8 whitespace-pre-line text-center">
              {config.instructions}
            </p>
            <div className="glass-card-static p-4 w-full max-w-xs text-center mb-6">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Format</p>
              <p className="text-xl font-bold text-[var(--accent-green)]">{totalRounds} rounds</p>
            </div>
            <button onClick={() => startGame(api)} className="btn btn-lg btn-success animate-pulse-glow">
              Start Game
            </button>
          </main>
        </>
      );
    }

    if (api.phase === "playing") {
      const cellSize = gridSize <= 3 ? "20" : gridSize === 4 ? "16" : "14";

      return (
        <>
          <NavBar />
          <main className="flex-1 flex flex-col items-center justify-center px-4">
            {/* HUD */}
            <div className="flex items-center justify-between w-full max-w-sm mb-3 text-sm">
              <span className="text-text-muted">Round {round + 1}/{totalRounds}</span>
              <span className="text-lg font-bold text-gradient-green">{score}</span>
              <div className="text-right">
                <span className="text-text-muted text-xs">{gridSize}×{gridSize}</span>
              </div>
            </div>

            {/* Phase indicator */}
            <div className="mb-4 text-center">
              {phase === "memorize" ? (
                <span className="text-xs font-bold text-[var(--accent-blue)] animate-pulse">Memorize...</span>
              ) : phase === "recall" ? (
                <span className="text-xs font-bold text-[var(--accent-amber)]">Tap the tiles</span>
              ) : null}
            </div>

            {/* Grid */}
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${gridSize}, ${cellSize}vw)`,
                maxWidth: "320px",
              }}
            >
              {Array.from({ length: gridSize * gridSize }).map((_, idx) => {
                const row = Math.floor(idx / gridSize);
                const col = idx % gridSize;
                const key = `${row}-${col}`;
                const isPattern = showPattern && pattern.some((p) => p.row === row && p.col === col);
                const isTapped = tapped.has(key);
                const isCorrect = phase === "recall" && isTapped && pattern.some((p) => p.row === row && p.col === col);
                const isWrong = phase === "recall" && isTapped && !pattern.some((p) => p.row === row && p.col === col);

                return (
                  <button
                    key={idx}
                    onClick={() => handleCellTap(row, col)}
                    className={`aspect-square rounded-xl transition-all duration-200 ${
                      isPattern
                        ? "bg-[var(--accent-blue)] scale-105 shadow-lg shadow-[var(--accent-blue)]/30"
                        : isCorrect
                        ? "bg-[var(--accent-green)]"
                        : isWrong
                        ? "bg-[var(--accent-rose)] animate-shake"
                        : isTapped
                        ? "bg-[var(--accent-rose)]/50"
                        : "bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-accent)]"
                    }`}
                    disabled={phase !== "recall"}
                  />
                );
              })}
            </div>

            {/* Feedback */}
            {lastFeedback !== null && (
              <div className={`mt-4 text-sm font-bold animate-fade-in ${
                lastFeedback ? "text-[var(--accent-green)]" : "text-[var(--accent-rose)]"
              }`}>
                {lastFeedback ? `✓ +${10 + patternCount * 5}` : "✗ Wrong pattern"}
              </div>
            )}
          </main>
        </>
      );
    }

    // Time up / result from GameWrapper
    if (api.phase === "timeup") return null;

    if (api.phase === "result" || phase === "final") {
      const s = api.score;
      return (
        <>
          <NavBar />
          <main className="flex-1 flex flex-col items-center justify-center px-4 animate-scale-in">
            <div className="text-5xl mb-3">{Math.round(correctRounds / totalRounds * 100) >= 80 ? "🎉" : "👍"}</div>
            <h1 className="text-3xl font-extrabold text-gradient-green mb-6">{config.title}</h1>
            <div className="glass-card-static p-6 w-full max-w-xs space-y-3 text-center">
              <p className="text-4xl font-extrabold text-gradient-green">{score}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xl font-bold text-[var(--accent-green)]">{correctRounds}/{totalRounds}</p>
                  <p className="text-xs text-text-muted">Rounds</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-[var(--accent-amber)]">{Math.round(correctRounds / totalRounds * 100)}%</p>
                  <p className="text-xs text-text-muted">Accuracy</p>
                </div>
              </div>
              <div className="h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                <div className="h-full rounded-full bg-[var(--accent-green)] transition-all" style={{ width: `${Math.round(correctRounds / totalRounds * 100)}%` }} />
              </div>
            </div>
            <button onClick={() => {
              api.resetGame();
              setGridSize(3);
              setPatternCount(2);
              setRound(0);
              setScore(0);
              setCorrectRounds(0);
              setPhase("idle");
              setLastFeedback(null);
            }} className="btn btn-md btn-primary mt-6">Play Again</button>
            {dailyMode && dailyGameIdx !== null && (
              <Link href={`/daily?game=${dailyGameIdx}&score=${score}`}
                className="btn btn-md btn-ghost mt-3 block text-center">
                ← Back to Daily Challenge
              </Link>
            )}
          </main>
        </>
      );
    }

    return null;
  };

  const getResult = useCallback(() => ({
    score,
    maxScore: totalRounds * 30,
    accuracy: Math.round(correctRounds / totalRounds * 100),
    difficulty: `${gridSize}x${gridSize}`,
    duration: Math.round((Date.now() - startTime.current) / 1000),
  }), [score, correctRounds, gridSize]);

  return (
    <GameWrapper config={config} onGetResult={getResult}>
      {renderGame}
    </GameWrapper>
  );
}

export default function MemoryMatrixPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <main className="min-h-dvh flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
        </main>
      }>
        <MemoryMatrixContent />
      </Suspense>
    </ErrorBoundary>
  );
}
