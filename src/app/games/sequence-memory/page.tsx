"use client";

import { Suspense } from "react";
import { useSeedParams } from "@/lib/useSeedParams";
import SequenceMemoryGame from "@/components/games/SequenceMemory";

function SequenceMemoryPageContent() {
  const { dailyMode, seed, dailyGame } = useSeedParams();

  return (
    <SequenceMemoryGame
      seed={seed}
      dailyMode={dailyMode}
      dailyGameIdx={dailyGame}
    />
  );
}

export default function SequenceMemoryPage() {
  return (
    <Suspense fallback={
      <main className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <SequenceMemoryPageContent />
    </Suspense>
  );
}
