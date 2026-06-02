"use client";

import { useEffect, useState } from "react";
import GameCard from "@/components/GameCard";
import NavBar from "@/components/NavBar";
import { GAMES } from "@/lib/games";
import { getTotalPlays } from "@/lib/storage";

export default function HomePage() {
  const [totalPlays, setTotalPlays] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTotalPlays(getTotalPlays());
  }, []);

  if (!mounted) {
    return (
      <main className="relative z-10 min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <>
      <NavBar />
      <main className="relative z-10 px-4 pb-8">
        {/* Header */}
        <header className="pt-16 pb-6 text-center">
          <h1 className="text-4xl font-extrabold text-gradient">BrainSpark</h1>
          <p className="text-text-secondary text-sm mt-2">
            Train your mind with daily brain games
          </p>
          {totalPlays > 0 && (
            <p className="text-xs text-text-muted mt-1">
              {totalPlays} {totalPlays === 1 ? "game" : "games"} played
            </p>
          )}
        </header>

        {/* Game Grid */}
        <div className="max-w-lg mx-auto stagger space-y-3">
          {GAMES.map((game, i) => (
            <GameCard key={game.id} game={game} index={i} />
          ))}
        </div>

        {/* Stats Link */}
        <div className="max-w-lg mx-auto mt-6 text-center">
          <a
            href="/stats"
            className="btn btn-md btn-ghost inline-flex"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            View Progress & Stats
          </a>
        </div>
      </main>
    </>
  );
}
