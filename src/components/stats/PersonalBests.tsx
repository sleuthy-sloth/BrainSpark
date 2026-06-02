"use client";

import type { PerGameStats } from "@/lib/statsEngine";

interface Props {
  stats: PerGameStats[];
}

export default function PersonalBests({ stats }: Props) {
  const played = stats.filter((s) => s.totalPlays > 0);

  if (played.length === 0) {
    return (
      <div className="glass-card-static p-6 text-center">
        <p className="text-sm text-text-muted">
          Play some games to see your personal bests
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {played.map((s) => (
        <div
          key={s.gameId}
          className="glass-card-static p-4"
        >
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">{s.icon}</span>
            <h3 className={`text-sm font-bold ${s.gradient}`}>{s.title}</h3>
            <span className="ml-auto text-[10px] text-text-muted">
              {s.totalPlays} play{s.totalPlays !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2 text-center mb-3">
            <div>
              <p className="text-lg font-extrabold" style={{ color: s.color }}>
                {s.bestScore}
              </p>
              <p className="text-[9px] text-text-muted uppercase tracking-wider">Best</p>
            </div>
            <div>
              <p className="text-lg font-extrabold text-text-primary">
                {s.avgScore}
              </p>
              <p className="text-[9px] text-text-muted uppercase tracking-wider">Average</p>
            </div>
            <div>
              <p className="text-lg font-extrabold" style={{ color: "var(--accent-amber)" }}>
                {s.bestAccuracy}%
              </p>
              <p className="text-[9px] text-text-muted uppercase tracking-wider">Best Acc</p>
            </div>
          </div>

          {/* Difficulty breakdown */}
          {Object.keys(s.difficultyBests).length > 0 && (
            <div className="border-t border-[var(--border-subtle)] pt-2">
              <p className="text-[9px] text-text-muted uppercase tracking-wider mb-1.5">
                Personal Bests by Difficulty
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(s.difficultyBests)
                  .sort(([a], [b]) => {
                    const order = ["easy", "medium", "hard", "any"];
                    return order.indexOf(a) - order.indexOf(b);
                  })
                  .map(([diff, score]) => (
                    <span
                      key={diff}
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${s.color}15`,
                        color: s.color,
                        border: `1px solid ${s.color}30`,
                      }}
                    >
                      {diff}: {score}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
