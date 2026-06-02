"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative z-10 min-h-dvh flex flex-col items-center justify-center px-4 animate-fade-in">
      <div className="text-6xl mb-4 opacity-50">✦</div>
      <h1 className="text-4xl font-extrabold text-gradient mb-2">404</h1>
      <p className="text-text-secondary text-sm mb-8">This page doesn&apos;t exist.</p>
      <Link href="/" className="btn btn-md btn-primary">
        Back to Games
      </Link>
    </main>
  );
}
