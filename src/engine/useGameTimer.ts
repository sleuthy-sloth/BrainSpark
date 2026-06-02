"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type TimerMode = "countdown" | "countup";
export type TimerState = "idle" | "running" | "paused" | "done";

export interface UseGameTimerOptions {
  /** Total seconds for countdown mode (ignored in countup) */
  totalSeconds?: number;
  /** Timer direction */
  mode?: TimerMode;
  /** Callback when timer reaches 0 (countdown) or is stopped */
  onTimeUp?: () => void;
  /** Callback every tick with remaining/elapsed seconds */
  onTick?: (seconds: number) => void;
}

export interface UseGameTimerReturn {
  /** Current seconds remaining (countdown) or elapsed (countup) */
  seconds: number;
  /** Formatted MM:SS string */
  display: string;
  /** Current state */
  state: TimerState;
  /** Start the timer */
  start: () => void;
  /** Pause the timer */
  pause: () => void;
  /** Resume from paused */
  resume: () => void;
  /** Reset to initial state */
  reset: () => void;
  /** Add bonus seconds (for countdown mode) */
  addTime: (seconds: number) => void;
}

export function useGameTimer(options: UseGameTimerOptions = {}): UseGameTimerReturn {
  const {
    totalSeconds = 30,
    mode = "countdown",
    onTimeUp,
    onTick,
  } = options;

  const [seconds, setSeconds] = useState(totalSeconds);
  const [state, setState] = useState<TimerState>("idle");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimeUpRef = useRef(onTimeUp);
  const onTickRef = useRef(onTick);
  onTimeUpRef.current = onTimeUp;
  onTickRef.current = onTick;

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clear();
    setState("running");

    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        const next = mode === "countdown" ? prev - 0.1 : prev + 0.1;
        if (mode === "countdown" && next <= 0) {
          clear();
          setState("done");
          onTimeUpRef.current?.();
          return 0;
        }
        const rounded = Math.round(next * 10) / 10;
        onTickRef.current?.(rounded);
        return rounded;
      });
    }, 100);
  }, [clear, mode]);

  const pause = useCallback(() => {
    clear();
    setState("paused");
  }, [clear]);

  const resume = useCallback(() => {
    setState("running");
    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        const next = mode === "countdown" ? prev - 0.1 : prev + 0.1;
        if (mode === "countdown" && next <= 0) {
          clear();
          setState("done");
          onTimeUpRef.current?.();
          return 0;
        }
        const rounded = Math.round(next * 10) / 10;
        onTickRef.current?.(rounded);
        return rounded;
      });
    }, 100);
  }, [clear, mode]);

  const reset = useCallback(() => {
    clear();
    setSeconds(totalSeconds);
    setState("idle");
  }, [clear, totalSeconds]);

  const addTime = useCallback((s: number) => {
    setSeconds((prev) => prev + s);
  }, []);

  useEffect(() => () => clear(), [clear]);

  // Format MM:SS with one decimal
  const totalSec = Math.max(0, Math.ceil(seconds * 10) / 10);
  const mins = Math.floor(totalSec / 60);
  const secs = (totalSec % 60).toFixed(1);
  const display = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(4, "0")}`;

  return { seconds, display, state, start, pause, resume, reset, addTime };
}
