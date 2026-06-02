"use client";

import { useEffect } from "react";
import { useStore } from "@/store";

export default function RootClient({ children }: { children: React.ReactNode }) {
  const loadProgress = useStore((s) => s.loadProgress);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  return (
    <>
      <div className="bg-gradient-canvas" />
      <div className="relative z-10 min-h-dvh">{children}</div>
    </>
  );
}
