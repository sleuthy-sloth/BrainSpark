"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import { saveResult } from "@/lib/db";

/* ─── Puzzle Generator ────────────────────── */

/**
 * Generate a valid Star Battle puzzle.
 * Strategy: place stars first (guaranteed valid), then grow regions around them.
 */
function generatePuzzle(size: number): {
  regions: number[][];
  solution: [number, number][];
} | null {
  const maxAttempts = 20;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Step 1: Place stars — one per row, one per column, no adjacency
    const stars: [number, number][] = [];
    const usedCols = new Set<number>();

    // Try placing stars row by row
    let success = true;
    for (let r = 0; r < size; r++) {
      // Find valid columns for this row
      const validCols: number[] = [];
      for (let c = 0; c < size; c++) {
        if (usedCols.has(c)) continue;
        // Check adjacency with already-placed stars
        const adjacent = stars.some(
          ([pr, pc]) => Math.abs(pr - r) <= 1 && Math.abs(pc - c) <= 1
        );
        if (!adjacent) validCols.push(c);
      }
      if (validCols.length === 0) {
        success = false;
        break;
      }
      // Pick a random valid column
      const col = validCols[Math.floor(Math.random() * validCols.length)];
      stars.push([r, col]);
      usedCols.add(col);
    }

    if (!success || stars.length !== size) continue;

    // Step 2: Grow regions from stars using nearest-star (Voronoi) partitioning
    const regions: number[][] = Array.from({ length: size }, () => Array(size).fill(-1));

    // BFS from all star positions simultaneously
    const queue: { r: number; c: number; regionId: number }[] = [];
    stars.forEach(([r, c], i) => {
      regions[r][c] = i;
      queue.push({ r, c, regionId: i });
    });

    // Shuffle directions for organic-looking regions
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];

    while (queue.length > 0) {
      // Pick random from queue for variety
      const qi = Math.floor(Math.random() * queue.length);
      const { r, c, regionId } = queue[qi];
      queue[qi] = queue[queue.length - 1];
      queue.pop();

      // Shuffle directions each time
      for (let d = dirs.length - 1; d > 0; d--) {
        const j = Math.floor(Math.random() * (d + 1));
        [dirs[d], dirs[j]] = [dirs[j], dirs[d]];
      }

      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && regions[nr][nc] === -1) {
          // Assign to this star's region
          regions[nr][nc] = regionId;
          queue.push({ r: nr, c: nc, regionId });
        }
      }
    }

    // Verify all cells are assigned
    const allAssigned = regions.every(row => row.every(cell => cell >= 0));
    if (!allAssigned) continue;

    // Step 3: Verify a star exists in each region
    const regionHasStar = new Array(size).fill(false);
    for (const [r, c] of stars) {
      regionHasStar[regions[r][c]] = true;
    }
    if (regionHasStar.every(Boolean)) {
      return { regions, solution: stars };
    }
  }

  return null;
}

/* ─── Colors ──────────────────────────────── */

const REGION_COLORS = [
  "#e63e6b40", "#4ade8040", "#fbbf2440", "#60a5fa40",
  "#a78bfa40", "#22d3ee40", "#fb923c40", "#f472b640",
  "#84cc1640", "#f43f5e40", "#14b8a640", "#3b82f640",
  "#8b5cf640", "#ec489940", "#06b6d440", "#eab30840",
];

const REGION_BORDERS = [
  "#e63e6b", "#4ade80", "#fbbf24", "#60a5fa",
  "#a78bfa", "#22d3ee", "#fb923c", "#f472b6",
  "#84cc16", "#f43f5e", "#14b8a6", "#3b82f6",
  "#8b5cf6", "#ec4899", "#06b6d4", "#eab308",
];

/* ─── Types ──────────────────────────────── */

type Phase = "idle" | "playing" | "checking" | "victory" | "game_over";

interface StarBattleProps {
  seed?: number;
  dailyMode?: boolean;
  dailyGameIdx?: number | null;
}

/* ─── Component ──────────────────────────── */

export default function StarBattle({
  seed,
  dailyMode = false,
  dailyGameIdx = null,
}: StarBattleProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [size, setSize] = useState(7);
  const [regions, setRegions] = useState<number[][] | null>(null);
  const [stars, setStars] = useState<Set<string>>(new Set());
  const [conflicts, setConflicts] = useState<Set<string>>(new Set());
  const [solution, setSolution] = useState<[number, number][]>([]);
  const [showHint, setShowHint] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const startTime = useRef(Date.now());
  const puzzleRef = useRef<any>(null);

  /* ─── Start Game ──────────────────────── */

  const startGame = useCallback((boardSize: number) => {
    setSize(boardSize);
    setStars(new Set());
    setConflicts(new Set());
    setShowHint(false);
    setMistakes(0);
    setHintsUsed(0);
    startTime.current = Date.now();

    const puzzle = generatePuzzle(boardSize);
    if (!puzzle) {
      // Fallback: try again with smaller size
      const fallback = generatePuzzle(Math.max(5, boardSize - 1));
      if (fallback) {
        puzzleRef.current = fallback;
        setSize(Math.max(5, boardSize - 1));
        setRegions(fallback.regions);
        setSolution(fallback.solution);
        setPhase("playing");
      }
      return;
    }
    puzzleRef.current = puzzle;
    setRegions(puzzle.regions);
    setSolution(puzzle.solution);
    setPhase("playing");
  }, []);

  /* ─── Tap to place/remove star ────────── */

  const handleTap = (r: number, c: number) => {
    if (phase !== "playing") return;

    const key = `${r},${c}`;
    setStars((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
    setConflicts(new Set());
  };

  /* ─── Check Solution ──────────────────── */

  const checkSolution = () => {
    if (!regions || solution.length === 0) return;

    const starArr = Array.from(stars).map((k) => {
      const [r, c] = k.split(",").map(Number);
      return [r, c] as [number, number];
    });

    const newConflicts = new Set<string>();
    let correctCount = 0;
    let wrongCount = 0;

    // Check each placed star
    for (const [r, c] of starArr) {
      const isCorrect = solution.some(([sr, sc]) => sr === r && sc === c);
      if (isCorrect) {
        correctCount++;
      } else {
        wrongCount++;
        newConflicts.add(`${r},${c}`);
      }
    }

    // Check if all solution stars are placed
    const allFound = solution.every(([sr, sc]) =>
      starArr.some(([r, c]) => r === sr && c === sc)
    );

    if (allFound && starArr.length === size && newConflicts.size === 0) {
      // Victory!
      setPhase("victory");
      const elapsed = Math.round((Date.now() - startTime.current) / 1000);
      saveResult({
        gameId: "star-battle",
        score: Math.max(100 - mistakes * 10 - hintsUsed * 15 + size * 10, 10),
        maxScore: 100 + size * 10,
        accuracy: Math.round((correctCount / (correctCount + wrongCount)) * 100),
        difficulty: size <= 5 ? "easy" : size <= 7 ? "medium" : "hard",
        duration: elapsed,
      });
    } else if (wrongCount > 0) {
      setMistakes((m) => m + wrongCount);
      setConflicts(newConflicts);
      setPhase("checking");
      setTimeout(() => {
        setConflicts(new Set());
        setPhase("playing");
      }, 1500);
    } else if (starArr.length < size) {
      // More stars needed
      setPhase("checking");
      setTimeout(() => setPhase("playing"), 500);
    }
  };

  /* ─── Hint ────────────────────────────── */

  const giveHint = () => {
    if (hintsUsed >= 3 || phase !== "playing") return;
    setHintsUsed((h) => h + 1);

    // Reveal one star that the player hasn't placed
    const unplaced = solution.filter(
      ([r, c]) => !stars.has(`${r},${c}`)
    );
    if (unplaced.length > 0) {
      const [hr, hc] = unplaced[Math.floor(Math.random() * unplaced.length)];
      setStars((prev) => {
        const next = new Set(prev);
        next.add(`${hr},${hc}`);
        return next;
      });
    }
  };

  /* ─── Helpers ──────────────────────────── */

  function countStarsInRow(row: number): number {
    return Array.from(stars).filter((k) => k.startsWith(`${row},`)).length;
  }

  function countStarsInCol(col: number): number {
    return Array.from(stars).filter((k) => k.endsWith(`,${col}`)).length;
  }

  function getRegion(row: number, col: number): number {
    return regions?.[row]?.[col] ?? -1;
  }

  function countStarsInRegion(regionId: number): number {
    if (!regions) return 0;
    let count = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (regions[r][c] === regionId && stars.has(`${r},${c}`)) {
          count++;
        }
      }
    }
    return count;
  }

  /* ─── Render ───────────────────────────── */

  return (
    <>
      <NavBar />
      <main className="relative z-10 min-h-dvh flex flex-col items-center px-4 pb-8">

        {/* ── IDLE ── */}
        {phase === "idle" && (
          <div className="flex flex-col items-center animate-fade-in pt-16">
            <div className="text-5xl mb-4 opacity-60">⊞</div>
            <h1 className="text-3xl font-extrabold text-gradient-cyan mb-1">
              Star Battle
            </h1>
            <p className="text-text-secondary text-sm mb-6 text-center max-w-xs">
              Place one star in each row, column, and colored region.
              Stars cannot touch — not even diagonally.
            </p>
            <div className="glass-card-static p-6 w-full max-w-xs space-y-3 mb-6">
              <h3 className="text-sm font-semibold text-text-secondary text-center">Rules</h3>
              <ul className="text-xs text-text-muted space-y-1.5 list-disc pl-4">
                <li>★ One star per <strong>row</strong></li>
                <li>★ One star per <strong>column</strong></li>
                <li>★ One star per <strong>colored region</strong></li>
                <li>★ Stars cannot be <strong>adjacent</strong> (including diagonally)</li>
              </ul>
              <div className="text-center text-[10px] text-text-muted mt-2">
                The number shows how many stars are in that row/column
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => startGame(5)} className="btn btn-md btn-success">
                5×5 Easy
              </button>
              <button onClick={() => startGame(7)} className="btn btn-md btn-primary">
                7×7 Medium
              </button>
              <button onClick={() => startGame(9)} className="btn btn-md btn-ghost">
                9×9 Hard
              </button>
            </div>
          </div>
        )}

        {/* ── PLAYING ── */}
        {(phase === "playing" || phase === "checking") && regions && (
          <div className="flex flex-col items-center w-full pt-4">

            {/* HUD */}
            <div className="w-full max-w-sm flex items-center justify-between mb-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">Mistakes:</span>
                <span className="font-bold text-[var(--accent-rose)]">{mistakes}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">Hints:</span>
                <span className="font-bold text-[var(--accent-amber)]">{hintsUsed}/3</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">Stars:</span>
                <span className="font-bold text-[var(--accent-cyan)]">{stars.size}/{size}</span>
              </div>
            </div>

            {/* Row/Col indicators */}
            {phase === "checking" && (
              <p className="text-xs text-[var(--accent-rose)] mb-2 animate-pulse">
                ✗ Wrong placement! Check highlighted cells...
              </p>
            )}

            {/* Grid */}
            <div className="inline-flex flex-col" style={{ maxWidth: "90vw" }}>
              {/* Column headers (star counts) */}
              <div className="flex">
                <div className="w-6 h-6" /> {/* corner */}
                {Array.from({ length: size }).map((_, c) => (
                  <div
                    key={c}
                    className="w-9 h-6 flex items-center justify-center text-[10px] font-bold"
                    style={{
                      color: countStarsInCol(c) > 1 ? "var(--accent-rose)" :
                             countStarsInCol(c) === 1 ? "var(--accent-green)" :
                             "var(--text-muted)"
                    }}
                  >
                    {countStarsInCol(c) > 0 ? countStarsInCol(c) : ""}
                  </div>
                ))}
              </div>

              {/* Grid rows */}
              {Array.from({ length: size }).map((_, r) => (
                <div key={r} className="flex items-center">
                  {/* Row header */}
                  <div
                    className="w-6 h-9 flex items-center justify-center text-[10px] font-bold"
                    style={{
                      color: countStarsInRow(r) > 1 ? "var(--accent-rose)" :
                             countStarsInRow(r) === 1 ? "var(--accent-green)" :
                             "var(--text-muted)"
                    }}
                  >
                    {countStarsInRow(r) > 0 ? countStarsInRow(r) : ""}
                  </div>
                  {/* Cells */}
                  {Array.from({ length: size }).map((_, c) => {
                    const regionId = getRegion(r, c);
                    const isStar = stars.has(`${r},${c}`);
                    const isConflict = conflicts.has(`${r},${c}`);
                    const rowCount = countStarsInRow(r);
                    const colCount = countStarsInCol(c);
                    const regionCount = regionId >= 0 ? countStarsInRegion(regionId) : 0;
                    const hasOverCount = rowCount > 1 || colCount > 1 || regionCount > 1;

                    return (
                      <button
                        key={c}
                        onClick={() => handleTap(r, c)}
                        className={`w-9 h-9 flex items-center justify-center text-sm transition-all duration-150 relative ${
                          phase === "playing" ? "cursor-pointer hover:scale-105" : ""
                        }`}
                        style={{
                          background: regionId >= 0 ? REGION_COLORS[regionId % REGION_COLORS.length] : "transparent",
                          borderRight: "1px solid rgba(255,255,255,0.08)",
                          borderBottom: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 0,
                        }}
                        tabIndex={phase === "playing" ? 0 : -1}
                        aria-label={`Row ${r + 1}, Column ${c + 1}`}
                      >
                        {isStar && (
                          <span
                            className={`text-lg ${
                              isConflict ? "animate-shake" : "animate-scale-in"
                            }`}
                          >
                            ⭐
                          </span>
                        )}
                        {isConflict && (
                          <span className="absolute inset-0 rounded-full bg-[var(--accent-rose)] opacity-30 animate-pulse" />
                        )}
                        {hasOverCount && (
                          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[var(--accent-rose)]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Controls */}
            <div className="flex gap-3 mt-5">
              <button
                onClick={checkSolution}
                disabled={stars.size === 0 || phase === "checking"}
                className="btn btn-md btn-primary"
              >
                Check Solution
              </button>
              <button
                onClick={giveHint}
                disabled={hintsUsed >= 3 || phase === "checking"}
                className="btn btn-md btn-ghost"
              >
                💡 Hint ({3 - hintsUsed})
              </button>
            </div>
          </div>
        )}

        {/* ── VICTORY ── */}
        {phase === "victory" && (
          <div className="flex flex-col items-center animate-scale-in pt-16">
            <div className="text-5xl mb-3">🎉</div>
            <h1 className="text-3xl font-extrabold text-gradient-cyan mb-1">
              Puzzle Solved!
            </h1>
            <div className="glass-card-static p-6 w-full max-w-xs space-y-4 text-center mb-6">
              <div>
                <p className="text-4xl font-extrabold text-gradient">{100 + size * 10 - mistakes * 10 - hintsUsed * 15}</p>
                <p className="text-xs text-text-muted">Score</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xl font-bold text-[var(--accent-amber)]">{size}×{size}</p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Board</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-[var(--accent-rose)]">{mistakes}</p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Mistakes</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-[var(--accent-green)]">{hintsUsed}</p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Hints</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-[var(--accent-violet)]">{size} ★</p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Stars</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => startGame(size)} className="btn btn-md btn-primary">
                Play Again ({size}×{size})
              </button>
              <button onClick={() => setPhase("idle")} className="btn btn-md btn-ghost">
                New Board Size
              </button>
            </div>
            {dailyMode && dailyGameIdx !== null && (
              <Link
                href={`/daily?game=${dailyGameIdx}&score=${100 + size * 10}`}
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
