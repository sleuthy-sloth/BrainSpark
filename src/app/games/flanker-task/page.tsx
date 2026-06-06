"use client";

import { Suspense } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useSeedParams } from "@/lib/useSeedParams";
import FlankerTaskGame from "@/components/games/FlankerTask";

function FlankerTaskPageContent() {
  const { dailyMode, seed, dailyGame } = useSeedParams();
  return <FlankerTaskGame seed={seed} dailyMode={dailyMode} dailyGameIdx={dailyGame} />;
}

export default function FlankerTaskPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <main className="min-h-dvh flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
        </main>
      }>
        <FlankerTaskPageContent />
      </Suspense>
    </ErrorBoundary>
  );
}
