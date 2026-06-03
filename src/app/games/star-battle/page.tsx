"use client";

import { Suspense } from "react";
import { useSeedParams } from "@/lib/useSeedParams";
import StarBattleGame from "@/components/games/StarBattle";

function StarBattlePageContent() {
  const { dailyMode, seed, dailyGame } = useSeedParams();

  return (
    <StarBattleGame
      seed={seed}
      dailyMode={dailyMode}
      dailyGameIdx={dailyGame}
    />
  );
}

export default function StarBattlePage() {
  return (
    <Suspense fallback={
      <main className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <StarBattlePageContent />
    </Suspense>
  );
}
