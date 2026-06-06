"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import { saveResult } from "@/lib/storage";
import { createRng } from "@/lib/dailyChallenge";
import { useSeedParams } from "@/lib/useSeedParams";

type Difficulty = "easy" | "medium" | "hard";

interface Question {
  a: number; b: number; op: "+" | "-" | "×";
  choices: number[]; answer: number;
}

function makeRand(dailyMode: boolean, seed: number) {
  const rng = dailyMode ? createRng(seed) : Math.random;
  return (min: number, max: number) =>
    Math.floor(rng() * (max - min + 1)) + min;
}

function genQuestion(d: Difficulty, rand: (min: number, max: number) => number): Question {
  const max = d === "easy" ? 10 : d === "medium" ? 25 : 50;
  let a = rand(1, max); let b = rand(1, max);
  const op = ["+", "-", "×"][rand(0, 2)] as Question["op"];
  let answer = op === "+" ? a + b : op === "-" ? a - b : a * b;
  if (op === "-" && answer < 0) { [a, b] = [b, a]; answer = a - b; }
  const choices = [answer];
  while (choices.length < 4) {
    const n = answer + rand(-10, 10);
    if (!choices.includes(n) && n >= 0) choices.push(n);
  }
  return { a, b, op, choices: [...choices].sort(() => rand(0, 1) - 0.5), answer };
}

function MathQuizContent() {
  const router = useRouter();
  const { dailyMode, seed } = useSeedParams();
  const rand = makeRand(dailyMode, seed);
  const dailyGameIdx = useSeedParams().dailyGame;
  const [diff, setDiff] = useState<Difficulty>("easy");
  const [state, setState] = useState<"menu" | "playing" | "result">("menu");
  const [q, setQ] = useState<Question>(() => genQuestion("easy", rand));
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [round, setRound] = useState(0);
  const [fb, setFb] = useState<"correct" | "wrong" | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [startTime] = useState(Date.now());

  const TOTAL = 10;

  const next = useCallback((d: Difficulty) => {
    setQ(genQuestion(d, rand));
    setFb(null);
    setSelectedIdx(null);
    setRound((r) => r + 1);
  }, [rand]);

  const answer = (choice: number, idx: number) => {
    if (fb) return;
    setSelectedIdx(idx);
    if (choice === q.answer) {
      setFb("correct");
      setScore((s) => s + 10 + (diff === "hard" ? 10 : diff === "medium" ? 5 : 0));
      setCorrect((c) => c + 1);
    } else {
      setFb("wrong");
    }
    setTimeout(() => {
      if (round + 1 >= TOTAL) {
        const pct = Math.round((correct + (choice === q.answer ? 1 : 0)) / TOTAL * 100);
        saveResult({ gameId: "math-quiz", score, maxScore: TOTAL * 20, accuracy: pct, difficulty: diff, duration: Math.round((Date.now() - startTime) / 1000) });
        setState("result");
      } else {
        next(diff);
      }
    }, 800);
  };

  if (state === "menu") {
    return (
      <>
        <NavBar />
        <main className="relative z-10 min-h-dvh flex flex-col items-center justify-center px-4 animate-fade-in">
          <div className="text-5xl mb-4 opacity-60">∑</div>
          <h1 className="text-3xl font-extrabold text-gradient mb-1">Math Sprint</h1>
          <p className="text-text-secondary text-sm mb-8">Quick mental calculations</p>
          <div className="glass-card-static p-6 w-full max-w-xs space-y-3">
            <p className="text-xs text-text-muted text-center uppercase tracking-wider">Difficulty</p>
            {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
              <button key={d} onClick={() => { setDiff(d); setState("playing"); }}
                className="btn btn-md w-full btn-ghost capitalize">{d}</button>
            ))}
          </div>
        </main>
      </>
    );
  }

  if (state === "result") {
    return (
      <>
        <NavBar />
        <main className="relative z-10 min-h-dvh flex flex-col items-center justify-center px-4 animate-scale-in">
          <div className="text-5xl mb-3">{Math.round(correct / TOTAL * 100) >= 80 ? "🎉" : Math.round(correct / TOTAL * 100) >= 50 ? "👍" : "💪"}</div>
          <h1 className="text-3xl font-extrabold text-gradient mb-6">Complete!</h1>
          <div className="glass-card-static p-6 w-full max-w-xs space-y-3 text-center">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-2xl font-bold text-[var(--accent-blue)]">{correct}/{TOTAL}</p><p className="text-xs text-text-muted">Correct</p></div>
              <div><p className="text-2xl font-bold text-[var(--accent-amber)]">{score}</p><p className="text-xs text-text-muted">Score</p></div>
            </div>
            <div className="h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
              <div className="h-full rounded-full bg-[var(--accent-green)] transition-all" style={{ width: `${Math.round(correct / TOTAL * 100)}%` }} />
            </div>
            <p className="text-xs text-text-muted">{Math.round(correct / TOTAL * 100)}% accuracy</p>
          </div>
          <button onClick={() => { setScore(0); setCorrect(0); setRound(0); setState("menu"); setQ(genQuestion(diff, rand)); }}
            className="btn btn-md btn-primary mt-6">Play Again</button>
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

  return (
    <>
      <NavBar />
      <main className="relative z-10 min-h-dvh flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm animate-fade-in" key={round}>
          {/* Progress */}
          <div className="flex items-center justify-between mb-6 text-sm">
            <span className="text-text-secondary">Score: <span className="text-[var(--accent-blue)] font-bold">{score}</span></span>
            <span className="text-text-muted">Question {round + 1}/{TOTAL}</span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden mb-8">
            <div className="h-full rounded-full bg-[var(--accent-blue)] transition-all" style={{ width: `${(round / TOTAL) * 100}%` }} />
          </div>
          {/* Question */}
          <div className="text-center mb-8">
            <p className="text-5xl font-extrabold text-[var(--text-primary)] tracking-tight">
              {q.a} {q.op} {q.b}
            </p>
            <p className="text-text-muted text-sm mt-2">Select the answer</p>
          </div>
          {/* Choices */}
          <div className="grid grid-cols-2 gap-3">
            {q.choices.map((c, i) => {
              let cls = "btn btn-md glass-card-static w-full text-lg font-bold";
              if (fb && c === q.answer) cls += " bg-[var(--accent-green)] text-white border-[var(--accent-green)]";
              else if (fb && selectedIdx === i) cls += " animate-shake bg-[var(--accent-rose)] text-white";
              else cls += " btn-ghost";
              if (!fb && selectedIdx === i) cls += " border-[var(--accent-blue)]";
              return (
                <button key={i} onClick={() => answer(c, i)} disabled={!!fb}
                  className={cls}>{c}</button>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}

export default function MathQuizPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <main className="min-h-dvh flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
        </main>
      }>
        <MathQuizContent />
      </Suspense>
    </ErrorBoundary>
  );
}
