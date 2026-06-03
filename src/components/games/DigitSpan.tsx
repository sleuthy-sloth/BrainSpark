"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import { saveResult } from "@/lib/storage";

type Phase = "idle" | "showing" | "input" | "feedback" | "game_over";

interface DigitSpanProps {
  seed?: number;
  dailyMode?: boolean;
  dailyGameIdx?: number | null;
}

function generateDigits(rng: () => number, len: number): number[] {
  const digits: number[] = [];
  for (let i = 0; i < len; i++) {
    digits.push(Math.floor(rng() * 10));
  }
  return digits;
}

export default function DigitSpan({
  seed,
  dailyMode = false,
  dailyGameIdx = null,
}: DigitSpanProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [digits, setDigits] = useState<number[]>([]);
  const [userInput, setUserInput] = useState("");
  const [currentLen, setCurrentLen] = useState(3);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [round, setRound] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [isReverse, setIsReverse] = useState(false);
  const startTime = useRef(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  const startGame = () => {
    setLives(3);
    setRound(0);
    setScore(0);
    setCurrentLen(3);
    setUserInput("");
    setIsReverse(false);
    startTime.current = Date.now();
    startRound(3);
  };

  const startRound = (len: number) => {
    setCurrentLen(len);
    setIsReverse(len > 6); // Reverse mode after 6 digits for variety
    const getRng = seed !== undefined ? mulberry32(seed + round) : Math.random;
    const seq = generateDigits(getRng as () => number, len);
    setDigits(seq);
    setUserInput("");
    setPhase("showing");

    // Show digits one at a time
    seq.forEach((d, i) => {
      setTimeout(() => {
        const el = document.getElementById("digit-display");
        if (el) {
          el.textContent = String(d);
          el.className = "text-5xl font-extrabold text-gradient scale-110";
          setTimeout(() => {
            if (el) {
              el.className = "text-5xl font-extrabold text-gradient opacity-0 scale-90";
            }
          }, 400);
        }
        if (i === seq.length - 1) {
          setTimeout(() => {
            setPhase("input");
            setTimeout(() => inputRef.current?.focus(), 100);
          }, 600);
        }
      }, i * 900);
    });
  };

  const handleSubmit = () => {
    const trimmed = userInput.trim();
    if (trimmed.length !== digits.length) return;

    const expected = isReverse ? [...digits].reverse().join("") : digits.join("");
    const correct = trimmed === expected;

    if (correct) {
      const newLen = currentLen + 1;
      setScore(currentLen);
      setRound((r) => r + 1);
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 1000);
      setPhase("feedback");
      setTimeout(() => startRound(newLen), 800);
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) {
        setPhase("game_over");
        const elapsed = Math.round((Date.now() - startTime.current) / 1000);
        saveResult({
          gameId: "digit-span",
          score: Math.max(score, currentLen),
          maxScore: Math.max(score, currentLen),
          accuracy: Math.round((score / (score + (3 - newLives))) * 100),
          difficulty: currentLen <= 4 ? "easy" : currentLen <= 6 ? "medium" : "hard",
          duration: elapsed,
        });
      } else {
        setPhase("feedback");
        setTimeout(() => startRound(currentLen), 1000);
      }
    }
    setUserInput("");
  };

  return (
    <>
      <NavBar />
      <main className="relative z-10 min-h-dvh flex flex-col items-center justify-center px-4">
        {phase === "idle" && (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="text-5xl mb-4 opacity-60">🔢</div>
            <h1 className="text-3xl font-extrabold text-gradient-green mb-1">Digit Span</h1>
            <p className="text-text-secondary text-sm mb-6 text-center max-w-xs">
              Remember and recall increasingly long sequences of digits.
              After level 6, you&apos;ll recall them in reverse!
            </p>
            <button onClick={startGame} className="btn btn-lg btn-success animate-pulse-glow">
              Start Game
            </button>
          </div>
        )}

        {phase === "showing" && (
          <div className="flex flex-col items-center">
            <p className="text-xs text-text-muted mb-6">Memorize this sequence...</p>
            <div
              id="digit-display"
              className="text-5xl font-extrabold text-gradient animate-scale-in h-16 flex items-center justify-center"
            >
              &nbsp;
            </div>
            <div className="mt-6 text-xs text-text-muted">
              Level {currentLen - 2}
              {isReverse && <span className="text-[var(--accent-amber)] ml-2">(Reverse!)</span>}
            </div>
          </div>
        )}

        {(phase === "input" || phase === "feedback") && (
          <div className="flex flex-col items-center w-full max-w-xs">
            <div className="flex items-center gap-1 mb-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className={`text-lg ${i < lives ? "opacity-100" : "opacity-20"}`}>❤️</span>
              ))}
            </div>
            {phase === "feedback" && (
              <p className="text-xs text-[var(--accent-rose)] mb-2">
                ✗ Try again!
              </p>
            )}
            {showLevelUp && (
              <p className="text-xs text-[var(--accent-green)] font-bold mb-2 animate-scale-in">
                ★ Correct! Level {currentLen + 1 - 2}
              </p>
            )}
            <div className="text-sm text-text-muted mb-3">
              {isReverse ? "Type the digits in reverse order" : `Type the ${digits.length} digits in order`}
            </div>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value.replace(/[^0-9]/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full glass-card-static p-4 text-center text-2xl font-mono font-bold outline-none"
              placeholder="•••"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              style={{ fontSize: "16px" }}
            />
            <button
              onClick={handleSubmit}
              disabled={userInput.length !== digits.length}
              className="btn btn-md btn-success mt-4"
            >
              Submit
            </button>
          </div>
        )}

        {phase === "game_over" && (
          <div className="flex flex-col items-center animate-scale-in">
            <div className="text-5xl mb-3">🎯</div>
            <h1 className="text-3xl font-extrabold text-gradient-green mb-1">Game Over</h1>
            <p className="text-text-secondary text-sm mb-6">Longest sequence: {score} digits</p>
            <div className="glass-card-static p-6 w-full max-w-xs text-center mb-6">
              <p className="text-4xl font-extrabold text-gradient-green">{score}</p>
              <p className="text-xs text-text-muted mt-1">Digit Span</p>
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

function mulberry32(a: number): () => number {
  let s = a | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
