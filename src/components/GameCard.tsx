"use client";

import Link from "next/link";
import type { GameMeta } from "@/store";

export default function GameCard({ game, index }: { game: GameMeta; index: number }) {
  return (
    <Link
      href={game.href}
      className="elevate-card elevate-card-accent block min-h-[72px]"
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      {/* Accent strip */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[16px]"
        style={{ backgroundColor: game.color }}
      />
      <div className="flex items-center gap-4 p-4 pl-5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0 font-mono-digits"
          style={{ backgroundColor: `${game.color}1a`, color: game.color }}
        >
          {game.icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold text-white">{game.title}</h3>
          <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">{game.description}</p>
        </div>
        <svg
          className="w-4 h-4 text-[var(--text-muted)] shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
