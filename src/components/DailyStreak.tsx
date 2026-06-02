"use client";

interface DailyStreakProps {
  /** ISO date strings of completed days */
  completedDates: string[];
  currentStreak: number;
  longestStreak: number;
}

/**
 * Calendar-style heatmap showing the last 30 days of daily challenge completions.
 * Each cell represents one day. Green = completed, Gray = missed, Today = highlighted.
 */
export default function DailyStreak({
  completedDates,
  currentStreak,
  longestStreak,
}: DailyStreakProps) {
  // Build the last 30 days as an array of { dateStr, isCompleted, isToday }
  const today = new Date();
  const todayStr = toLocalDateStr(today);

  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (29 - i)); // oldest first
    const dateStr = toLocalDateStr(d);
    return {
      dateStr,
      isToday: dateStr === todayStr,
      isCompleted: completedDates.includes(dateStr),
      dayOfWeek: d.getDay(), // 0=Sun
      dateNum: d.getDate(),
    };
  });

  // Group into weeks for a calendar grid
  // Start from Sunday of the first week
  const firstDay = days[0].dayOfWeek;
  const leadingBlanks = Array.from({ length: firstDay }, (_, i) => i);

  return (
    <div className="glass-card-static p-4 animate-fade-in">
      {/* Streak stats */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-2xl font-extrabold text-gradient-amber">
            🔥 {currentStreak}
          </span>
          <span className="text-sm text-text-muted ml-1">day streak</span>
        </div>
        <div className="text-right">
          <span className="text-xs text-text-muted">Best</span>
          <p className="text-sm font-bold text-text-secondary">{longestStreak} days</p>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="text-[9px] text-text-muted text-center font-medium">
            {d}
          </div>
        ))}

        {/* Leading blanks */}
        {leadingBlanks.map((i) => (
          <div key={`blank-${i}`} />
        ))}

        {/* Day cells */}
        {days.map((day) => (
          <div
            key={day.dateStr}
            className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-medium transition-colors ${
              day.isCompleted
                ? "bg-[var(--accent-green)] text-white"
                : "bg-[var(--bg-secondary)] text-text-muted"
            } ${day.isToday ? "ring-2 ring-[var(--accent-blue)] ring-offset-1 ring-offset-[var(--bg-card)]" : ""}`}
            title={`${day.dateStr}${day.isCompleted ? " ✓" : ""}`}
          >
            {day.dateNum}
          </div>
        ))}
      </div>
    </div>
  );
}

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
