"use client";

import { Suspense } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useSeedParams } from "@/lib/useSeedParams";
import PatternMatrixGame from "@/components/games/PatternMatrix";

function PatternMatrixPageContent() {
  const { dailyMode, seed, dailyGame } = useSeedParams();
  return <PatternMatrixGame seed={seed} dailyMode={dailyMode} dailyGameIdx={dailyGame} />;
}

export default function PatternMatrixPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <main className="min-h-dvh flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
        </main>
      }>
        <PatternMatrixPageContent />
      </Suspense>
    </ErrorBoundary>
  );
}
