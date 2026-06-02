"use client";

import type { PerGameStats } from "@/lib/statsEngine";
import { calculateRank, getBestDailyScore } from "@/lib/statsEngine";

interface Props {
  stats: PerGameStats[];
  totalGames: number;
  streak: number;
  dailyCompletionDates: string[];
  dailyScores: Record<string, number>;
}

export default function StatsOverview({
  stats,
  totalGames,
  streak,
  dailyCompletionDates,
  dailyScores,
}: Props) {
  const rank = calculateRank(stats);
  const bestDaily = getBestDailyScore(dailyCompletionDates, dailyScores);

  const cards = [
    {
      label: "Games Played",
      value: totalGames,
      icon: "🎮",
      color: "var(--accent-blue)",
    },
    {
      label: "Day Streak",
      value: streak,
      icon: "🔥",
      color: "var(--accent-amber)",
      suffix: streak === 1 ? "day" : streak > 0 ? "days" : "",
    },
    {
      label: "Best Daily",
      value: bestDaily,
      icon: "🏅",
      color: "var(--accent-green)",
      suffix: bestDaily > 0 ? "pts" : "",
    },
    {
      label: "Skill Rank",
      value: rank.title,
      icon: rank.emoji,
      color: rank.color,
      suffix: "",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="glass-card-static p-4 text-center"
        >
          <p className="text-xl mb-1">{card.icon}</p>
          <p
            className="text-2xl font-extrabold"
            style={{ color: card.color }}
          >
            {typeof card.value === "number" ? card.value.toLocaleString() : card.value}
          </p>
          <p className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">
            {card.label}
          </p>
          {card.suffix && (
            <p className="text-[10px] text-text-muted">{card.suffix}</p>
          )}
        </div>
      ))}
    </div>
  );
}
