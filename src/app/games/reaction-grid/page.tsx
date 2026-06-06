"use client";

import { Suspense } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useSeedParams } from "@/lib/useSeedParams";
import ReactionGridGame from "@/components/games/ReactionGrid";

function ReactionGridPageContent() {
  const { dailyMode, seed, dailyGame } = useSeedParams();
  return <ReactionGridGame seed={seed} dailyMode={dailyMode} dailyGameIdx={dailyGame} />;
}

export default function ReactionGridPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <main className="min-h-dvh flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
        </main>
      }>
        <ReactionGridPageContent />
      </Suspense>
    </ErrorBoundary>
  );
}
