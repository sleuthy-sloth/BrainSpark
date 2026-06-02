"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import { GAMES_META } from "@/store";
import { getAllProficiency, getDailyHistory, calculateStreak, calculateBrainQuotient } from "@/lib/db";
import type { Proficiency, DailyEntry } from "@/lib/db";

function StatCard({ gameId, prof }: { gameId: string; prof: Proficiency }) {
  const meta = GAMES_META.find((g) => g.id === gameId);
  if (!meta) return null;

  return (
    <div className="glass-card-static p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ background: `${meta.color}15`, color: meta.color }}>
          {meta.icon}
        </div>
        <div>
          <h3 className={`font-bold text-sm ${meta.gradient}`}>{meta.title}</h3>
          <p className="text-xs text-text-muted">{prof.totalPlays} {prof.totalPlays === 1 ? "play" : "plays"}</p>
        </div>
      </div>
      {prof.totalPlays > 0 ? (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-bold text-[var(--accent-blue)]">{prof.bestScore}</p>
            <p className="text-[10px] text-text-muted">Best</p>
          </div>
          <div>
            <p className="text-lg font-bold text-[var(--accent-amber)]">{prof.totalPlays > 0 ? Math.round(prof.cumulativeScore / prof.totalPlays) : 0}</p>
            <p className="text-[10px] text-text-muted">Avg</p>
          </div>
          <div>
            <p className="text-lg font-bold text-[var(--accent-green)]">{prof.bestAccuracy}%</p>
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
  const [prof, setProf] = useState<Proficiency[]>([]);
  const [streak, setStreak] = useState(0);
  const [bq, setBq] = useState(0);
  const [history, setHistory] = useState<DailyEntry[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    Promise.all([
      getAllProficiency(),
      calculateStreak(),
      calculateBrainQuotient(),
      getDailyHistory(30),
    ]).then(([p, s, b, h]) => {
      setProf(p);
      setStreak(s);
      setBq(b);
      setHistory(h);
    });
  }, []);

  if (!mounted) {
    return (
      <main className="relative z-10 min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  const totalPlays = prof.reduce((s, p) => s + p.totalPlays, 0);

  return (
    <>
      <NavBar />
      <main className="relative z-10 px-4 pt-20 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-extrabold text-gradient">Progress</h1>
            <p className="text-text-secondary text-sm mt-1">
              {totalPlays} {totalPlays === 1 ? "game" : "games"} played
            </p>
          </div>

          {/* Overview */}
          {totalPlays > 0 && (
            <div className="glass-card-static p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-3xl font-extrabold text-gradient">{bq}</p>
                  <p className="text-xs text-text-muted">Brain Quotient</p>
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-gradient-amber">
                    {streak}<span className="text-sm">🔥</span>
                  </p>
                  <p className="text-xs text-text-muted">Day Streak</p>
                </div>
              </div>
            </div>
          )}

          {totalPlays === 0 ? (
            <div className="glass-card-static p-8 text-center">
              <div className="text-4xl mb-3">📊</div>
              <h2 className="text-lg font-bold text-text-primary mb-1">No data yet</h2>
              <p className="text-sm text-text-muted mb-4">Play some games to see your progress here.</p>
              <Link href="/" className="btn btn-md btn-primary">Back to Games</Link>
            </div>
          ) : (
            <div className="space-y-3 stagger">
              {GAMES_META.map((game) => {
                const p = prof.find((p) => p.gameId === game.id) || {
                  gameId: game.id,
                  category: game.category,
                  totalPlays: 0,
                  bestScore: 0,
                  bestAccuracy: 0,
                  cumulativeScore: 0,
                  lastPlayed: 0,
                };
                return <StatCard key={game.id} gameId={game.id} prof={p} />;
              })}
            </div>
          )}

          {/* Recent Activity */}
          {history.length > 0 && (
            <div className="mt-6 glass-card-static p-4">
              <h2 className="text-sm font-bold text-text-primary mb-3">Recent Activity</h2>
              <div className="space-y-1.5">
                {history.slice(0, 7).map((day) => (
                  <div key={day.date} className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">
                      {new Date(day.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                    <span className={day.completed ? "text-[var(--accent-green)]" : "text-text-muted"}>
                      {day.completed ? `✓ ${day.gamesPlayed.length} games` : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
