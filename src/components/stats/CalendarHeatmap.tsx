"use client";

import { useState, useMemo } from "react";
import type { CalendarDay, CalendarMonth } from "@/lib/statsEngine";

interface Props {
  months: CalendarMonth[];
}

const INTENSITY_COLORS: Record<string, string> = {
  none: "#1a1a3e",
  played: "var(--accent-blue)",
  daily: "var(--accent-green)",
  high: "var(--accent-violet)",
};

const INTENSITY_OPACITY: Record<string, string> = {
  none: "0.4",
  played: "0.5",
  daily: "0.8",
  high: "1",
};

export default function CalendarHeatmap({ months }: Props) {
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  // Flatten to a lookup by date string for quick access
  const dayMap = useMemo(() => {
    const map = new Map<string, CalendarDay>();
    for (const m of months) {
      for (const d of m.days) {
        map.set(d.date, d);
      }
    }
    return map;
  }, [months]);

  const handleDayClick = (day: CalendarDay) => {
    if (day.intensity === "none") return;
    setSelectedDay(selectedDay?.date === day.date ? null : day);
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-6">
      {months.map((month) => {
        // Pad with empty cells for first day of week offset
        const firstDow = month.days[0]?.dayOfWeek ?? 0;

        return (
          <div key={`${month.year}-${month.month}`}>
            <p className="text-xs font-bold text-text-secondary mb-2">
              {month.monthName} {month.year}
            </p>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {weekDays.map((d) => (
                <p key={d} className="text-[8px] text-text-muted text-center uppercase tracking-wider">
                  {d[0]}
                </p>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Padding cells */}
              {Array.from({ length: firstDow }).map((_, i) => (
                <div key={`pad-${i}`} className="aspect-square" />
              ))}

              {/* Day cells */}
              {month.days.map((day) => {
                const isFuture = new Date(day.date + "T23:59:59Z").getTime() > Date.now();
                const isSelected = selectedDay?.date === day.date;
                const color = INTENSITY_COLORS[day.intensity];
                const opacity = INTENSITY_OPACITY[day.intensity];

                return (
                  <button
                    key={day.date}
                    onClick={() => handleDayClick(day)}
                    disabled={isFuture || day.intensity === "none"}
                    className={`aspect-square rounded-md text-[9px] font-bold flex items-center justify-center transition-all will-change-transform ${
                      isFuture ? "opacity-20 cursor-default" : day.intensity !== "none" ? "cursor-pointer hover:scale-110" : "cursor-default"
                    } ${isSelected ? "ring-2 ring-white" : ""}`}
                    style={{
                      backgroundColor: color,
                      opacity: isFuture ? 0.15 : opacity,
                    }}
                    aria-label={`${day.date}: ${day.sessions.length} games, ${day.totalScore} points`}
                    title={`${day.date}: ${day.sessions.length} games, ${day.totalScore} points`}
                  >
                    {day.dayOfMonth}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Selected day detail */}
      {selectedDay && selectedDay.sessions.length > 0 && (
        <div className="glass-card-static p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-text-primary">
              {new Date(selectedDay.date + "T12:00:00Z").toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </p>
            <span className="text-xs text-text-muted">
              {selectedDay.totalScore} pts
            </span>
          </div>
          {selectedDay.sessions.slice(0, 5).map((s, i) => (
            <div
              key={s.id}
              className="flex items-center justify-between py-1.5 border-t border-[var(--border-subtle)] first:border-t-0 text-xs"
            >
              <span className="capitalize text-text-secondary">
                {s.gameId.replace(/-/g, " ")}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-text-muted">{s.difficulty}</span>
                <span className="font-bold text-text-primary">{s.score}</span>
                <span className="text-text-muted">{s.accuracy}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 justify-center text-[10px] text-text-muted">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: INTENSITY_COLORS.none, opacity: INTENSITY_OPACITY.none }} />
          <span>None</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: INTENSITY_COLORS.played, opacity: INTENSITY_OPACITY.played }} />
          <span>Played</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: INTENSITY_COLORS.daily, opacity: INTENSITY_OPACITY.daily }} />
          <span>Daily</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: INTENSITY_COLORS.high, opacity: INTENSITY_OPACITY.high }} />
          <span>High Score</span>
        </div>
      </div>
    </div>
  );
}
