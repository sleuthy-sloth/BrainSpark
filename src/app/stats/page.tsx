"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import NavBar from "@/components/NavBar";
import StatsOverview from "@/components/stats/StatsOverview";
import SkillRadar from "@/components/stats/SkillRadar";
import TrendSparkline from "@/components/stats/TrendSparkline";
import CalendarHeatmap from "@/components/stats/CalendarHeatmap";
import PersonalBests from "@/components/stats/PersonalBests";
import { getResults } from "@/lib/db";
import { getStreakInfo } from "@/lib/streaks";
import {
  aggregateByGame,
  calculateSkillScores,
  getStreakHistory,
  getTrendData,
  SKILL_DEFS,
} from "@/lib/statsEngine";
import type { GameResult, GameId } from "@/lib/db";

function StatsContent() {
  const [sessions, setSessions] = useState<GameResult[]>([]);
  const [dailyCompletionDates, setDailyCompletionDates] = useState<string[]>([]);
  const [dailyScores, setDailyScores] = useState<Record<string, number>>({});
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>("overview");

  useEffect(() => {
    async function load() {
      // Fetch all game sessions
      const allSessions = await getResults();
      setSessions(allSessions);

      // Fetch streak info
      const info = await getStreakInfo();
      setStreak(info.currentStreak);
      setDailyCompletionDates(info.completedDates);

      // Build daily scores from localStorage
      try {
        const raw = localStorage.getItem("np_daily_progress");
        if (raw) {
          const p = JSON.parse(raw);
          if (p.dateStr) setDailyScores((prev) => ({ ...prev, [p.dateStr]: p.totalScore || 0 }));
        }
      } catch {}

      setLoading(false);
    }
    load();
  }, []);

  const stats = useMemo(() => aggregateByGame(sessions), [sessions]);
  const totalGames = stats.reduce((s, p) => s + p.totalPlays, 0);
  const skillScores = useMemo(() => calculateSkillScores(sessions), [sessions]);

  // Games that have enough plays for trends
  const trendableGames = useMemo(() => {
    return stats
      .filter((s) => s.totalPlays >= 3)
      .map((s) => ({
        gameId: s.gameId,
        title: s.title,
        icon: s.icon,
        color: s.color,
        trend: getTrendData(sessions, s.gameId, 14),
      }));
  }, [sessions, stats]);

  const calendarMonths = useMemo(
    () => getStreakHistory(sessions, dailyCompletionDates),
    [sessions, dailyCompletionDates]
  );

  const sections = [
    { id: "overview", label: "Overview" },
    { id: "radar", label: "Profile" },
    { id: "trends", label: "Trends" },
    { id: "calendar", label: "Calendar" },
    { id: "bests", label: "Bests" },
  ];

  if (loading) {
    return (
      <>
        <NavBar />
        <main className="relative z-10 min-h-dvh flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
        </main>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <main className="relative z-10 px-4 pb-4 has-bottom-nav">
        {/* Header */}
        <header className="pt-4 pb-5 text-center">
          <h1 className="text-[22px] font-bold text-white">Statistics</h1>
          <p className="text-text-secondary text-sm mt-1">
            {totalGames > 0
              ? `${totalGames} game${totalGames !== 1 ? "s" : ""} across ${
                  stats.filter((s) => s.totalPlays > 0).length
                } activities`
              : "Start playing to see your stats"}
          </p>
        </header>

        {/* Section tabs */}
        <div className="max-w-lg mx-auto mb-6 overflow-x-auto">
          <div className="flex gap-1.5 pb-1">
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap min-h-[36px] ${
                  activeSection === sec.id
                    ? "bg-[var(--accent-blue)] text-white"
                    : "bg-[var(--bg-card)] text-text-muted border border-[var(--border-subtle)]"
                }`}
              >
                {sec.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content sections */}
        <div className="max-w-lg mx-auto space-y-6">
          {/* ─── OVERVIEW ─── */}
          {activeSection === "overview" && (
            <>
              {totalGames === 0 ? (
                <div className="glass-card-static p-8 text-center">
                  <p className="text-4xl mb-3">📊</p>
                  <h2 className="text-lg font-bold text-text-primary mb-1">No stats yet</h2>
                  <p className="text-sm text-text-muted">
                    Play your first game to unlock the dashboard.
                  </p>
                </div>
              ) : (
                <StatsOverview
                  stats={stats}
                  totalGames={totalGames}
                  streak={streak}
                  dailyCompletionDates={dailyCompletionDates}
                  dailyScores={dailyScores}
                />
              )}

              {/* Quick insights */}
              {totalGames > 0 && (
                <div className="glass-card-static p-4">
                  <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">
                    Quick Insights
                  </h3>
                  <div className="space-y-2 text-sm">
                    {(() => {
                      const mostPlayed = [...stats].sort((a, b) => b.totalPlays - a.totalPlays)[0];
                      const strongest = [...skillScores].sort((a, b) => b.score - a.score)[0];
                      const needsWork = [...skillScores].sort((a, b) => a.score - b.score)[0];
                      return (
                        <>
                          {mostPlayed && mostPlayed.totalPlays > 0 && (
                            <p className="text-text-secondary">
                              Most played:{" "}
                              <span className="font-bold text-text-primary">
                                {mostPlayed.icon} {mostPlayed.title}
                              </span>{" "}
                              ({mostPlayed.totalPlays} plays)
                            </p>
                          )}
                          {strongest && strongest.score > 0 && (
                            <p className="text-text-secondary">
                              Strongest skill:{" "}
                              <span className="font-bold" style={{ color: strongest.color }}>
                                {strongest.skill}
                              </span>{" "}
                              ({strongest.score}/100)
                            </p>
                          )}
                          {needsWork && needsWork.score > 0 && strongest && strongest.skill !== needsWork.skill && (
                            <p className="text-text-secondary">
                              Needs work:{" "}
                              <span className="font-bold" style={{ color: needsWork.color }}>
                                {needsWork.skill}
                              </span>{" "}
                              ({needsWork.score}/100)
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ─── SKILL RADAR ─── */}
          {activeSection === "radar" && (
            <>
              <SkillRadar skills={skillScores} />

              {/* Skill breakdown */}
              <div className="space-y-2">
                {SKILL_DEFS.map(({ skill, games, color }) => {
                  const score = skillScores.find((s) => s.skill === skill);
                  const relevant = stats.filter((s) => games.includes(s.gameId));
                  const total = relevant.reduce((sum, s) => sum + s.totalPlays, 0);
                  const hasData = total > 0;
                  return (
                    <div
                      key={skill}
                      className="glass-card-static p-3 flex items-center gap-3"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                        style={{ backgroundColor: `${color}20`, color }}
                      >
                        {hasData ? score?.score ?? 0 : "—"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-text-primary">{skill}</p>
                        <p className="text-[10px] text-text-muted">
                          {hasData
                            ? `${total} game${total !== 1 ? "s" : ""} • ${relevant.map((r) => r.title).join(", ")}`
                            : "Play games to build this skill"}
                        </p>
                      </div>
                      {hasData && (
                        <div
                          className="w-16 h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden shrink-0"
                        >
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${score?.score ?? 0}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ─── TRENDS ─── */}
          {activeSection === "trends" && (
            <>
              {trendableGames.length === 0 ? (
                <div className="glass-card-static p-8 text-center">
                  <p className="text-4xl mb-3">📈</p>
                  <h2 className="text-lg font-bold text-text-primary mb-1">Not enough data</h2>
                  <p className="text-sm text-text-muted">
                    Play at least 3 sessions of a game to see your trend lines.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {trendableGames.map((g) => (
                    <div key={g.gameId} className="glass-card-static p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{g.icon}</span>
                        <h3 className={`text-sm font-bold`} style={{ color: g.color }}>
                          {g.title}
                        </h3>
                      </div>
                      <TrendSparkline trend={g.trend} color={g.color} />
                      <p className="text-[10px] text-text-muted mt-1">
                        Last {g.trend.points.length} sessions
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ─── CALENDAR ─── */}
          {activeSection === "calendar" && (
            <>
              {dailyCompletionDates.length === 0 ? (
                <div className="glass-card-static p-8 text-center">
                  <p className="text-4xl mb-3">🗓️</p>
                  <h2 className="text-lg font-bold text-text-primary mb-1">No daily history</h2>
                  <p className="text-sm text-text-muted">
                    Complete your first Daily Challenge to see your streak calendar.
                  </p>
                </div>
              ) : null}
              <CalendarHeatmap months={calendarMonths} />
            </>
          )}

          {/* ─── PERSONAL BESTS ─── */}
          {activeSection === "bests" && (
            <PersonalBests stats={stats} />
          )}
        </div>
      </main>
    </>
  );
}

export default function StatsPage() {
  return (
    <Suspense fallback={
      <main className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <StatsContent />
    </Suspense>
  );
}
