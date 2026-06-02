"use client";

import { useState, useCallback, useRef } from "react";

export interface UseBrainScoreOptions {
  /** Points for a correct answer at base difficulty */
  basePoints?: number;
  /** Whether to enable speed multiplier (faster = more points) */
  speedMultiplier?: boolean;
  /** Maximum time window for speed bonus in ms */
  speedWindow?: number;
}

export interface ScoreEvent {
  correct: boolean;
  /** Time taken to answer in ms (for speed bonus) */
  reactionMs?: number;
  /** Current difficulty tier for base scoring */
  difficulty?: number;
}

export interface UseBrainScoreReturn {
  /** Current score */
  score: number;
  /** Current combo streak */
  combo: number;
  /** Longest combo this session */
  bestCombo: number;
  /** Total correct answers */
  correct: number;
  /** Total wrong answers */
  wrong: number;
  /** Total questions answered */
  total: number;
  /** Accuracy percentage */
  accuracy: number;
  /** Process an answer event */
  submit: (event: ScoreEvent) => number;
  /** Reset all tracking */
  reset: () => void;
  /** Get current score breakdown */
  getBreakdown: () => {
    base: number;
    combo: number;
    speed: number;
    total: number;
  };
}

export function useBrainScore(options: UseBrainScoreOptions = {}): UseBrainScoreReturn {
  const {
    basePoints = 10,
    speedMultiplier = true,
    speedWindow = 3000,
  } = options;

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [total, setTotal] = useState(0);
  const lastBreakdown = useRef({ base: 0, combo: 0, speed: 0, total: 0 });

  const submit = useCallback((event: ScoreEvent): number => {
    const { correct: isCorrect, reactionMs, difficulty = 1 } = event;

    setTotal((t) => t + 1);

    if (!isCorrect) {
      setCombo(0);
      setWrong((w) => w + 1);
      lastBreakdown.current = { base: 0, combo: 0, speed: 0, total: 0 };
      return 0;
    }

    setCorrect((c) => c + 1);
    setCombo((c) => {
      const newCombo = c + 1;
      setBestCombo((b) => Math.max(b, newCombo));
      return newCombo;
    });

    // Base points — scale with difficulty
    const base = Math.round(basePoints * difficulty);

    // Combo multiplier — grows from 1x to 3x
    const comboMultiplier = 1 + Math.min((combo + 1) * 0.15, 2);

    // Speed bonus — faster = more points
    let speed = 0;
    if (speedMultiplier && reactionMs !== undefined) {
      const ratio = Math.max(0, 1 - reactionMs / speedWindow);
      speed = Math.round(base * ratio * 0.5);
    }

    const totalEarned = Math.round((base + speed) * comboMultiplier);
    const added = Math.max(1, totalEarned);

    setScore((s) => s + added);
    lastBreakdown.current = { base, combo: Math.round(base * (comboMultiplier - 1)), speed, total: added };

    return added;
  }, [basePoints, speedMultiplier, speedWindow, combo]);

  const reset = useCallback(() => {
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setCorrect(0);
    setWrong(0);
    setTotal(0);
    lastBreakdown.current = { base: 0, combo: 0, speed: 0, total: 0 };
  }, []);

  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  return {
    score,
    combo,
    bestCombo,
    correct,
    wrong,
    total,
    accuracy,
    submit,
    reset,
    getBreakdown: () => lastBreakdown.current,
  };
}
