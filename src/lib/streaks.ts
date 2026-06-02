/**
 * Streak tracking for NeuralPulse daily challenges.
 *
 * Guest users: localStorage
 * Signed-in users: Supabase profiles table
 */

import { supabase, getUser } from "./supabase";

const STORAGE_KEY = "neuralpulse_daily";

export interface DailyHistory {
  /** ISO date strings (YYYY-MM-DD) of completed daily challenges */
  dates: string[];
  /** Last streak check date (for recalculation) */
  lastCheck: string;
}

function getHistory(): DailyHistory {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { dates: [], lastCheck: "" };
}

function saveHistory(h: DailyHistory) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(h));
}

/**
 * Calculate current streak from an array of ISO date strings.
 * Streak = number of consecutive days ending with the most recent date,
 * where every day in between is present.
 */
export function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const sorted = [...dates].sort().reverse();
  const today = new Date();
  const todayStr = toDateStr(today);
  const yesterday = toDateStr(new Date(today.getTime() - 86400000));

  // The streak must end on today or yesterday (allow grace period)
  if (sorted[0] !== todayStr && sorted[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const curr = new Date(sorted[i] + "T00:00:00Z");
    const prev = new Date(sorted[i - 1] + "T00:00:00Z");
    const diffDays = (prev.getTime() - curr.getTime()) / 86400000;
    if (Math.round(diffDays) === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function toDateStr(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/**
 * Record a daily challenge completion. Updates streak, returns streak info.
 */
export async function recordDailyCompletion(
  dateStr: string,
  totalScore: number
): Promise<{ currentStreak: number; longestStreak: number; isFirstToday: boolean }> {
  const user = await getUser();

  if (user) {
    // Online path — save to Supabase profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_streak, longest_streak, last_played_date")
      .eq("id", user.id)
      .single();

    const yesterday = toDateStr(new Date(new Date(dateStr + "T00:00:00Z").getTime() - 86400000));
    let newStreak = 1;

    if (profile?.last_played_date === yesterday) {
      newStreak = (profile.current_streak || 0) + 1;
    } else if (profile?.last_played_date === dateStr) {
      // Already completed today — just return current
      return {
        currentStreak: profile.current_streak || 0,
        longestStreak: profile.longest_streak || 0,
        isFirstToday: false,
      };
    }

    const newLongest = Math.max(newStreak, profile?.longest_streak || 0);

    await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        current_streak: newStreak,
        longest_streak: newLongest,
        last_played_date: dateStr,
      });

    // Also save daily completion
    await supabase.from("daily_completions").upsert(
      {
        user_id: user.id,
        challenge_date: dateStr,
        total_score: totalScore,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id, challenge_date" }
    );

    return {
      currentStreak: newStreak,
      longestStreak: newLongest,
      isFirstToday: true,
    };
  }

  // Offline/guest path — localStorage
  const history = getHistory();
  const alreadyDone = history.dates.includes(dateStr);

  if (!alreadyDone) {
    history.dates.push(dateStr);
    history.lastCheck = dateStr;
    saveHistory(history);
  }

  const currentStreak = calculateStreak(history.dates);
  const allSorted = [...history.dates].sort();
  // Longest streak from history
  let longest = 0;
  let temp = 0;
  for (let i = 0; i < allSorted.length; i++) {
    if (i === 0) {
      temp = 1;
    } else {
      const prev = new Date(allSorted[i - 1] + "T00:00:00Z");
      const curr = new Date(allSorted[i] + "T00:00:00Z");
      if (Math.round((curr.getTime() - prev.getTime()) / 86400000) === 1) {
        temp++;
      } else {
        temp = 1;
      }
    }
    longest = Math.max(longest, temp);
  }

  return {
    currentStreak,
    longestStreak: longest,
    isFirstToday: !alreadyDone,
  };
}

/**
 * Get the current streak info for display.
 * Does NOT record a completion.
 */
export async function getStreakInfo(): Promise<{
  currentStreak: number;
  longestStreak: number;
  completedDates: string[];
}> {
  const user = await getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_streak, longest_streak")
      .eq("id", user.id)
      .single();

    const { data: completions } = await supabase
      .from("daily_completions")
      .select("challenge_date")
      .eq("user_id", user.id)
      .order("challenge_date", { ascending: false });

    return {
      currentStreak: profile?.current_streak || 0,
      longestStreak: profile?.longest_streak || 0,
      completedDates: (completions || []).map((c) => c.challenge_date),
    };
  }

  // Guest path
  const history = getHistory();
  return {
    currentStreak: calculateStreak(history.dates),
    longestStreak: history.dates.length > 0 ? calculateStreak(history.dates) : 0, // approximate
    completedDates: history.dates,
  };
}

/**
 * Check if the daily challenge for a given date has been completed.
 */
export async function isDailyDone(dateStr: string): Promise<boolean> {
  const user = await getUser();
  if (user) {
    const { data } = await supabase
      .from("daily_completions")
      .select("id")
      .eq("user_id", user.id)
      .eq("challenge_date", dateStr)
      .maybeSingle();
    return !!data;
  }
  const history = getHistory();
  return history.dates.includes(dateStr);
}
