"use client";

import Link from "next/link";
import type { GameMeta } from "@/store";
import { getCategoryMeta } from "@/lib/categories";

export default function GameCard({
  game,
  index,
  compact,
}: {
  game: GameMeta;
  index: number;
  compact?: boolean;
}) {
  const cat = getCategoryMeta(game.category);

  return (
    <Link
      href={game.href}
      className={`glass-card block transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
        compact ? "p-4" : "p-5"
      }`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ background: `${game.color}15`, color: game.color }}
        >
          {game.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`text-lg font-bold ${game.gradient}`}>{game.title}</h3>
            <span
              className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded"
              style={{
                background: `${cat.color}20`,
                color: cat.color,
              }}
            >
              {cat.label}
            </span>
          </div>
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
