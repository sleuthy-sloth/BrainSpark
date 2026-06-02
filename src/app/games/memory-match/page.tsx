"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import { saveResult } from "@/lib/storage";
import { createRng } from "@/lib/dailyChallenge";
import { useSeedParams } from "@/lib/useSeedParams";

const EMOJIS = ["🚀", "🌟", "💎", "🔥", "❤️", "🦋", "🌺", "🎯"];

interface Card { id: number; emoji: string; flipped: boolean; matched: boolean; }

function shuffle(arr: Card[], rng?: () => number): Card[] {
  const a = [...arr];
  const rand = rng || Math.random;
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function initCards(rng?: () => number): Card[] {
  const cards: Card[] = [];
  EMOJIS.forEach((emoji, i) => {
    cards.push({ id: i * 2, emoji, flipped: false, matched: false });
    cards.push({ id: i * 2 + 1, emoji, flipped: false, matched: false });
  });
  return shuffle(cards, rng);
}

function MemoryMatchContent() {
  const router = useRouter();
  const { dailyMode, seed } = useSeedParams();
  const rng = dailyMode ? createRng(seed) : undefined;
  const dailyGameIdx = useSeedParams().dailyGame;
  const [cards, setCards] = useState<Card[]>(() => initCards(rng));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matched, setMatched] = useState(0);
  const [state, setState] = useState<"playing" | "result">("playing");
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const lock = useRef(false);

  useEffect(() => {
    if (state !== "playing") return;
    const t = setInterval(() => setElapsed(Math.round((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(t);
  }, [state, startTime]);

  const handleFlip = (idx: number) => {
    if (lock.current || cards[idx].flipped || cards[idx].matched) return;
    if (flipped.length >= 2) return;

    const ncards = cards.map((c, i) => i === idx ? { ...c, flipped: true } : c);
    setCards(ncards);
    const nflipped = [...flipped, idx];
    setFlipped(nflipped);

    if (nflipped.length === 2) {
      lock.current = true;
      setMoves((m) => m + 1);
      const [a, b] = nflipped;
      if (cards[a].emoji === cards[b].emoji) {
        setTimeout(() => {
          setCards((cards) => cards.map((c) => c.id === cards[a].id || c.id === cards[b].id ? { ...c, matched: true } : c));
          setFlipped([]);
          setMatched((m) => {
            const nm = m + 1;
            if (nm === 8) {
              const pct = 100;
              const s = Math.max(0, 800 - moves * 10);
              saveResult({ gameId: "memory-match", score: s, maxScore: 800, accuracy: pct, difficulty: "medium", duration: Math.round((Date.now() - startTime) / 1000) });
              setState("result");
            }
            return nm;
          });
          lock.current = false;
        }, 500);
      } else {
        setTimeout(() => {
          setCards((cards) => cards.map((c, i) => i === a || i === b ? { ...c, flipped: false } : c));
          setFlipped([]);
          lock.current = false;
        }, 900);
      }
    }
  };

  return (
    <>
      <NavBar />
      <main className="relative z-10 min-h-dvh flex flex-col items-center px-4 pt-20 pb-8">
        {state === "result" ? (
          <div className="flex flex-col items-center justify-center flex-1 animate-scale-in">
            <div className="text-5xl mb-3">🎉</div>
            <h1 className="text-3xl font-extrabold text-gradient-green mb-6">All Matched!</h1>
            <div className="glass-card-static p-6 w-full max-w-xs space-y-3 text-center">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-2xl font-bold text-[var(--accent-green)]">{moves}</p><p className="text-xs text-text-muted">Moves</p></div>
                <div><p className="text-2xl font-bold text-[var(--accent-amber)]">{elapsed}s</p><p className="text-xs text-text-muted">Time</p></div>
              </div>
              <div><p className="text-2xl font-bold text-[var(--accent-blue)]">{Math.max(0, 800 - moves * 10)}</p><p className="text-xs text-text-muted">Score</p></div>
            </div>
            <button onClick={() => {
              setCards(initCards(rng)); setFlipped([]); setMoves(0); setMatched(0); setState("playing");
            }} className="btn btn-md btn-primary mt-6">Play Again</button>
            {dailyMode && dailyGameIdx !== null && (
              <Link href={`/daily?game=${dailyGameIdx}&score=${Math.max(0, 800 - moves * 10)}`}
                className="btn btn-md btn-ghost mt-3 block text-center">
                ← Back to Daily Challenge
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="w-full max-w-sm flex items-center justify-between mb-4 text-sm">
              <span className="text-text-secondary">Moves: <span className="font-bold text-[var(--accent-amber)]">{moves}</span></span>
              <span className="text-text-muted">{elapsed}s</span>
              <span className="text-text-secondary">Matched: <span className="font-bold text-[var(--accent-green)]">{matched}/8</span></span>
            </div>
            <div className="grid grid-cols-4 gap-2.5 w-full max-w-sm">
              {cards.map((card, i) => (
                <button key={card.id} onClick={() => handleFlip(i)}
                  className={`aspect-square rounded-xl text-2xl flex items-center justify-center transition-all duration-300 ${
                    card.flipped || card.matched
                      ? "bg-[var(--bg-card)] border border-[var(--border-subtle)]"
                      : "bg-gradient-to-br from-[var(--accent-blue)]/30 to-[var(--accent-violet)]/30 border border-[var(--border-accent)] hover:brightness-110"
                  } ${card.matched ? "opacity-60" : ""}`}
                  style={{ transform: card.flipped || card.matched ? "rotateY(0deg)" : "rotateY(180deg)" }}>
                  {(card.flipped || card.matched) ? card.emoji : ""}
                </button>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}

export default function MemoryMatchPage() {
  return (
    <Suspense fallback={
      <main className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <MemoryMatchContent />
    </Suspense>
  );
}
