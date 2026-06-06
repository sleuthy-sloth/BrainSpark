"use client";

import { Suspense, useState, useCallback, useEffect, useRef } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import GameWrapper, { type GameConfig, type GameAPI } from "@/engine/GameWrapper";
import { createRng } from "@/lib/dailyChallenge";
import { useSeedParams } from "@/lib/useSeedParams";

type Op = "+" | "-" | "×" | "÷";

interface Equation {
  display: string;
  correct: boolean;
}

const DIFFICULTY_LABELS = ["Level 1", "Level 2", "Level 3", "Level 4", "Level 5"];

function makeRand(dailyMode: boolean, seed: number) {
  const rng = dailyMode ? createRng(seed) : Math.random;
  return (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
}

function genEquation(level: number, rand: (min: number, max: number) => number): Equation {
  const ops: Op[] = level <= 1 ? ["+", "-"] : level <= 3 ? ["+", "-", "×"] : ["+", "-", "×", "÷"];
  const op = ops[rand(0, ops.length - 1)];
  const maxNum = 5 + level * 5;

  let a: number, b: number, answer: number;
  switch (op) {
    case "+":
      a = rand(1, maxNum); b = rand(1, maxNum); answer = a + b; break;
    case "-":
      a = rand(1, maxNum); b = rand(1, a); answer = a - b; break;
    case "×":
      a = rand(1, Math.min(12, maxNum)); b = rand(1, Math.min(12, maxNum)); answer = a * b; break;
    case "÷":
      b = rand(1, Math.min(12, maxNum));
      answer = rand(1, Math.min(12, maxNum));
      a = b * answer;
      break;
  }

  // 40% chance to show wrong answer
  const showCorrect = rand(0, 1000) > 400;
  const displayed = showCorrect ? answer : answer + rand(-5, 5);

  return {
    display: `${a} ${op} ${b} = ${displayed}`,
    correct: showCorrect,
  };
}

function QuickEquationsContent() {
  const { dailyMode, seed } = useSeedParams();
  const rand = makeRand(dailyMode, seed);
  const dailyGameIdx = useSeedParams().dailyGame;
  const [level, setLevel] = useState(1);
  const [currentQ, setCurrentQ] = useState<Equation>(() => genEquation(1, rand));
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const startTime = useRef(Date.now());
  const reactionStart = useRef(Date.now());

  const config: GameConfig = {
    gameId: "quick-equations",
    title: "Quick Equations",
    duration: 45,
    instructions: "Is the equation correct?\nTap ✓ for True or ✗ for False.\nBe fast — speed bonus points!",
    showCombo: true,
  };

  const nextQuestion = useCallback((correct: boolean) => {
    setLastCorrect(correct);
    setTotalAnswered((t) => {
      const next = t + 1;
      // Advance difficulty every 10 correct answers
      const newLevel = 1 + Math.floor(next / 10);
      if (newLevel > level) setLevel(Math.min(newLevel, 5));
      return next;
    });
    setTimeout(() => {
      setCurrentQ(genEquation(level, rand));
      setLastCorrect(null);
      reactionStart.current = Date.now();
    }, 400);
  }, [level, rand]);

  const getResult = useCallback(() => {
    return {
      score: 0, // will be set by score.js via GameWrapper
      maxScore: 500,
      accuracy: 0,
      difficulty: DIFFICULTY_LABELS[Math.min(level - 1, 4)],
      duration: Math.round((Date.now() - startTime.current) / 1000),
    };
  }, [level]);

  // Map game API to our game
  const renderGame = (api: GameAPI) => {
    // When not playing yet, show instructions screen
    if (api.phase === "instructions") {
      return (
        <>
          <NavBar />
          <main className="flex-1 flex flex-col items-center justify-center px-4 animate-fade-in">
            <div className="text-5xl mb-4 opacity-60">∑</div>
            <h1 className="text-3xl font-extrabold text-gradient mb-1">{config.title}</h1>
            <p className="text-text-secondary text-sm mb-8 whitespace-pre-line text-center">
              {config.instructions}
            </p>
            <div className="glass-card-static p-4 w-full max-w-xs text-center mb-6">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Duration</p>
              <p className="text-xl font-bold text-[var(--accent-blue)]">{config.duration}s</p>
            </div>
            <button onClick={api.startGame} className="btn btn-lg btn-primary animate-pulse-glow">
              Start Game
            </button>
          </main>
        </>
      );
    }

    // Playing state
    if (api.phase === "playing") {
      return (
        <>
          <NavBar />
          <main className="flex-1 flex flex-col items-center justify-center px-4">
            {/* HUD */}
            <div className="w-full max-w-sm mb-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-text-muted">
                  Lvl {Math.min(level, 5)}
                </span>
                <span className="text-2xl font-bold text-gradient">{api.score.score}</span>
                <span className={`font-mono text-sm ${api.timer.seconds <= 10 ? "text-[var(--accent-rose)]" : "text-text-muted"}`}>
                  {api.timer.display}
                </span>
              </div>
              {/* Timer bar */}
              <div className="h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--accent-blue)] transition-all duration-200"
                  style={{ width: `${(api.timer.seconds / config.duration) * 100}%` }}
                />
              </div>
              {/* Combo */}
              {api.score.combo > 1 && (
                <div className="text-center mt-2 animate-scale-in">
                  <span className="text-xs font-bold text-[var(--accent-amber)]">
                    🔥 {api.score.combo}x combo!
                  </span>
                </div>
              )}
            </div>

            {/* Equation */}
            <div className="glass-card-static p-8 w-full max-w-sm text-center mb-6">
              <p className="text-3xl font-bold text-text-primary tracking-tight">
                {currentQ.display}
              </p>
            </div>

            {/* Feedback */}
            {lastCorrect !== null && (
              <div className={`text-lg font-bold mb-4 animate-fade-in ${
                lastCorrect ? "text-[var(--accent-green)]" : "text-[var(--accent-rose)]"
              }`}>
                {lastCorrect ? "✓ Correct!" : "✗ Wrong!"}
              </div>
            )}

            {/* True / False buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  const rt = Date.now() - reactionStart.current;
                  const isCorrect = currentQ.correct;
                  api.score.submit({ correct: isCorrect, reactionMs: rt, difficulty: level });
                  nextQuestion(isCorrect);
                }}
                disabled={lastCorrect !== null}
                className="btn btn-lg glass-card-static w-32 text-2xl hover:bg-[var(--accent-green)]/20 hover:border-[var(--accent-green)]"
              >
                ✓ <span className="text-sm font-normal ml-1">True</span>
              </button>
              <button
                onClick={() => {
                  const rt = Date.now() - reactionStart.current;
                  const isCorrect = !currentQ.correct;
                  api.score.submit({ correct: isCorrect, reactionMs: rt, difficulty: level });
                  nextQuestion(isCorrect);
                }}
                disabled={lastCorrect !== null}
                className="btn btn-lg glass-card-static w-32 text-2xl hover:bg-[var(--accent-rose)]/20 hover:border-[var(--accent-rose)]"
              >
                ✗ <span className="text-sm font-normal ml-1">False</span>
              </button>
            </div>
          </main>
        </>
      );
    }

    // Time up — GameWrapper handles this
    if (api.phase === "timeup") {
      return null;
    }

    // Result screen
    if (api.phase === "result") {
      const s = api.score;
      return (
        <>
          <NavBar />
          <main className="flex-1 flex flex-col items-center justify-center px-4 animate-scale-in">
            <div className="text-5xl mb-3">{s.accuracy >= 80 ? "🎉" : s.accuracy >= 50 ? "👍" : "💪"}</div>
            <h1 className="text-3xl font-extrabold text-gradient mb-6">{config.title}</h1>
            <div className="glass-card-static p-6 w-full max-w-xs space-y-4 text-center">
              <div>
                <p className="text-4xl font-extrabold text-gradient">{s.score}</p>
                <p className="text-xs text-text-muted">Score</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xl font-bold text-[var(--accent-green)]">{s.correct}</p>
                  <p className="text-xs text-text-muted">Correct</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-[var(--accent-rose)]">{s.wrong}</p>
                  <p className="text-xs text-text-muted">Wrong</p>
                </div>
              </div>
              <div>
                <p className="text-xl font-bold text-[var(--accent-amber)]">{s.accuracy}%</p>
                <p className="text-xs text-text-muted">Accuracy</p>
              </div>
              <div className="h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                <div className="h-full rounded-full bg-[var(--accent-green)] transition-all" style={{ width: `${s.accuracy}%` }} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => {
                setLevel(1);
                setTotalAnswered(0);
                setLastCorrect(null);
                api.resetGame();
              }} className="btn btn-md btn-primary">Play Again</button>
              {dailyMode && dailyGameIdx !== null && (
                <Link href={`/daily?game=${dailyGameIdx}&score=${api.score.score}`}
                  className="btn btn-md btn-ghost mt-3 block text-center">
                  ← Back to Daily Challenge
                </Link>
              )}
            </div>
          </main>
        </>
      );
    }

    return null;
  };

  const handleGetResult = useCallback(() => {
    // This is called from GameWrapper on timeup to save
    // The actual score is tracked in api.score
    return {
      score: 0, // placeholder
      maxScore: 500,
      accuracy: 0,
      difficulty: DIFFICULTY_LABELS[Math.min(level - 1, 4)],
      duration: Math.round((Date.now() - startTime.current) / 1000),
    };
  }, [level]);

  return (
    <GameWrapper config={config} onGetResult={handleGetResult}>
      {renderGame}
    </GameWrapper>
  );
}

export default function QuickEquationsPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <main className="min-h-dvh flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
        </main>
      }>
        <QuickEquationsContent />
      </Suspense>
    </ErrorBoundary>
  );
}
