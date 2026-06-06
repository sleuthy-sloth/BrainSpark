"use client";

import { Suspense, useState, useCallback, useRef } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import { saveResult } from "@/lib/storage";
import { createRng } from "@/lib/dailyChallenge";
import { useSeedParams } from "@/lib/useSeedParams";

const WORDS: Record<string, string[]> = {
  easy: ["EACH","MAKE","FILE","CODE","NOTE","PLAY","READ","SEND","TALK","WALK","WORK","GAME","TYPE","ZONE","MIND","TASK","BACK","CALL","DARK","FAST","GOLD","HIGH","IDEA","JUMP","KEEP","LAND","MOON","NAME","OPEN","PASS"],
  medium: ["BRAIN","TRAIN","SCORE","QUICK","FOCUS","SPEED","SMASH","POWER","BRIGHT","DREAM","FLAME","GRACE","HEART","JOKER","KNACK","LIGHT","MAGIC","NIGHT","OCEAN","PEACE","QUEEN","RIVER","SHARP","TIGER","UNITY","VOICE","WHEEL","YOUTH","ZEBRA"],
  hard: ["SPARKLE","GOLDEN","BRIDGE","CANDLE","DANGER","EAGLE","FABRIC","GARDEN","HAMMER","ISLAND","JUNGLE","KITTEN","LEMONS","MARKET","NARROW","ORANGE","PIRATE","QUARTZ","RABBIT","SILVER","THUNDER"],
};

function shuffle(s: string, rng?: () => number): string {
  const a = s.split("");
  const rand = rng || Math.random;
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.join("");
}

function WordScrambleContent() {
  const router = useRouter();
  const { dailyMode, seed } = useSeedParams();
  const rng = dailyMode ? createRng(seed) : undefined;
  const dailyGameIdx = useSeedParams().dailyGame;
  const [diff, setDiff] = useState<"easy" | "medium" | "hard">("easy");
  const [state, setState] = useState<"menu" | "playing" | "result">("menu");
  const [word, setWord] = useState("");
  const [scrambled, setScrambled] = useState("");
  const [input, setInput] = useState("");
  const [fb, setFb] = useState<"correct" | "wrong" | null>(null);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [round, setRound] = useState(0);
  const [used, setUsed] = useState<Set<string>>(new Set());
  const startTime = useRef(Date.now());
  const TOTAL = 10;

  const pickWord = useCallback((d: string) => {
    const pool = WORDS[d].filter((w) => !used.has(w));
    if (pool.length === 0) return;
    const rand = rng || Math.random;
    const w = pool[Math.floor(rand() * pool.length)];
    setWord(w);
    setScrambled(shuffle(w, rng));
    setUsed((u) => new Set(u).add(w));
  }, [used, rng]);

  const startGame = (d: "easy" | "medium" | "hard") => {
    setDiff(d);
    setScore(0);
    setCorrect(0);
    setRound(0);
    setUsed(new Set());
    setState("playing");
    startTime.current = Date.now();
    setTimeout(() => pickWord(d), 0);
  };

  const handleSubmit = () => {
    if (fb || !input.trim()) return;
    if (input.trim().toUpperCase() === word) {
      setFb("correct");
      const pts = word.length <= 4 ? 10 : word.length <= 5 ? 15 : 20;
      setScore((s) => s + pts);
      setCorrect((c) => c + 1);
    } else {
      setFb("wrong");
    }
    setTimeout(() => {
      const nextRound = round + 1;
      if (nextRound >= TOTAL) {
        const pct = Math.round((correct + (input.trim().toUpperCase() === word ? 1 : 0)) / TOTAL * 100);
        saveResult({ gameId: "word-scramble", score: score + (input.trim().toUpperCase() === word ? (word.length <= 4 ? 10 : word.length <= 5 ? 15 : 20) : 0), maxScore: TOTAL * 20, accuracy: pct, difficulty: diff, duration: Math.round((Date.now() - startTime.current) / 1000) });
        setState("result");
      } else {
        setRound(nextRound);
        setFb(null);
        setInput("");
        pickWord(diff);
      }
    }, 1200);
  };

  if (state === "menu") {
    return (
      <>
        <NavBar />
        <main className="relative z-10 min-h-dvh flex flex-col items-center justify-center px-4 animate-fade-in">
          <div className="text-5xl mb-4 opacity-60">✦</div>
          <h1 className="text-3xl font-extrabold text-gradient-violet mb-1">Word Twist</h1>
          <p className="text-text-secondary text-sm mb-8">Unscramble the letters</p>
          <div className="glass-card-static p-6 w-full max-w-xs space-y-3">
            <p className="text-xs text-text-muted text-center uppercase tracking-wider">Difficulty</p>
            {(["easy","medium","hard"] as const).map((d) => (
              <button key={d} onClick={() => startGame(d)}
                className="btn btn-md w-full btn-ghost capitalize">{d} — {d === "easy" ? "4 letters" : d === "medium" ? "5 letters" : "6+ letters"}</button>
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
          <h1 className="text-3xl font-extrabold text-gradient-violet mb-6">Finished!</h1>
          <div className="glass-card-static p-6 w-full max-w-xs space-y-3 text-center">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-2xl font-bold text-[var(--accent-violet)]">{correct}/{TOTAL}</p><p className="text-xs text-text-muted">Correct</p></div>
              <div><p className="text-2xl font-bold text-[var(--accent-amber)]">{score}</p><p className="text-xs text-text-muted">Score</p></div>
            </div>
            <div className="h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
              <div className="h-full rounded-full bg-[var(--accent-green)] transition-all" style={{ width: `${Math.round(correct / TOTAL * 100)}%` }} />
            </div>
          </div>
          <button onClick={() => setState("menu")} className="btn btn-md btn-primary mt-6">Play Again</button>
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
            <span className="text-text-secondary">Score: <span className="text-[var(--accent-violet)] font-bold">{score}</span></span>
            <span className="text-text-muted">Word {round + 1}/{TOTAL}</span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden mb-8">
            <div className="h-full rounded-full bg-[var(--accent-violet)] transition-all" style={{ width: `${(round / TOTAL) * 100}%` }} />
          </div>
          {/* Scrambled word */}
          <div className="flex justify-center gap-2 mb-8 flex-wrap">
            {scrambled.split("").map((c, i) => (
              <span key={i} className="w-10 h-12 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-center text-xl font-bold text-[var(--accent-violet)]">
                {c}
              </span>
            ))}
          </div>
          {/* Input */}
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Type the word..."
              disabled={!!fb}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck="false"
              className="flex-1 px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-text-primary placeholder:text-text-muted outline-none focus:border-[var(--accent-violet)] transition-colors uppercase tracking-wider text-base"
              autoFocus
            />
            <button onClick={handleSubmit} disabled={!!fb || !input.trim()}
              className="btn btn-md btn-primary">Go</button>
          </div>
          {/* Feedback */}
          {fb && (
            <div className={`mt-4 text-center text-sm font-bold animate-fade-in ${fb === "correct" ? "text-[var(--accent-green)]" : "text-[var(--accent-rose)]"}`}>
              {fb === "correct" ? "✓ Correct!" : `✗ ${word}`}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default function WordScramblePage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <main className="min-h-dvh flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
        </main>
      }>
        <WordScrambleContent />
      </Suspense>
    </ErrorBoundary>
  );
}
