"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import { getAllGamesStats, getTotalPlays } from "@/lib/storage";
import type { GameStats, GameId } from "@/lib/storage";
import { GAMES } from "@/lib/games";

function StatCard({ game, stats }: { game: typeof GAMES[0]; stats: GameStats }) {
  return (
    <div className="glass-card-static p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ background: `${game.color}15`, color: game.color }}>
          {game.icon}
        </div>
        <div>
          <h3 className={`font-bold text-sm ${game.gradient}`}>{game.title}</h3>
          <p className="text-xs text-text-muted">{stats.totalPlays} {stats.totalPlays === 1 ? "play" : "plays"}</p>
        </div>
      </div>
      {stats.totalPlays > 0 ? (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-bold text-[var(--accent-blue)]">{stats.bestScore}</p>
            <p className="text-[10px] text-text-muted">Best</p>
          </div>
          <div>
            <p className="text-lg font-bold text-[var(--accent-amber)]">{stats.averageScore}</p>
            <p className="text-[10px] text-text-muted">Avg</p>
          </div>
          <div>
            <p className="text-lg font-bold text-[var(--accent-green)]">{stats.bestAccuracy}%</p>
            <p className="text-[10px] text-text-muted">Best</p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-text-muted text-center py-2">No games played yet</p>
      )}
    </div>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState<Record<string, GameStats>>({});
  const [totalPlays, setTotalPlays] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setStats(getAllGamesStats());
    setTotalPlays(getTotalPlays());
  }, []);

  if (!mounted) {
    return (
      <main className="relative z-10 min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <>
      <NavBar />
      <main className="relative z-10 px-4 pt-20 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-extrabold text-gradient">Progress</h1>
            <p className="text-text-secondary text-sm mt-1">
              {totalPlays} {totalPlays === 1 ? "game" : "games"} played total
            </p>
          </div>

          {totalPlays === 0 ? (
            <div className="glass-card-static p-8 text-center">
              <div className="text-4xl mb-3">📊</div>
              <h2 className="text-lg font-bold text-text-primary mb-1">No data yet</h2>
              <p className="text-sm text-text-muted mb-4">Play some games to see your progress here.</p>
              <Link href="/" className="btn btn-md btn-primary">Back to Games</Link>
            </div>
          ) : (
            <div className="space-y-3 stagger">
              {GAMES.map((game) => (
                <StatCard key={game.id} game={game} stats={stats[game.id] || {
                  totalPlays: 0, bestScore: 0, bestAccuracy: 0, averageScore: 0, averageAccuracy: 0, recentResults: [], streak: 0, lastPlayedDate: "",
                }} />
              ))}
            </div>
          )}

          {totalPlays > 0 && (
            <div className="mt-6 glass-card-static p-4 text-center">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Overall Best Score</p>
              <p className="text-3xl font-extrabold text-gradient">
                {Math.max(...Object.values(stats).map((s) => s.bestScore))}
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
