"use client";

import Link from "next/link";
import type { GameMeta } from "@/store";

export default function GameCard({ game, index }: { game: GameMeta; index: number }) {
  return (
    <Link
      href={game.href}
      className="glass-card p-5 block hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ background: `${game.color}15`, color: game.color }}
        >
          {game.icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className={`text-lg font-bold ${game.gradient}`}>{game.title}</h3>
          <p className="text-sm text-text-secondary mt-0.5">{game.subtitle}</p>
          <p className="text-xs text-text-muted mt-1.5 leading-relaxed line-clamp-2">
            {game.description}
          </p>
        </div>
        <svg
          className="w-5 h-5 text-text-muted shrink-0 mt-2"
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
