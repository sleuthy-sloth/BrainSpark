"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { GameId } from "@/lib/db";
import { saveResult } from "@/lib/db";
import { useStore } from "@/store";
import { useGameTimer } from "./useGameTimer";
import { useBrainScore } from "./useBrainScore";

export type GamePhase =
  | "idle"
  | "instructions"
  | "countdown"
  | "playing"
  | "paused"
  | "timeup"
  | "result";

export interface GameConfig {
  gameId: GameId;
  title: string;
  /** Duration in seconds (0 = unlimited) */
  duration: number;
  instructions: string;
  /** Label for the primary action button */
  actionLabel?: string;
  /** Whether to show the combo meter during gameplay */
  showCombo?: boolean;
}

export interface GameResult {
  score: number;
  maxScore: number;
  accuracy: number;
  difficulty: string;
  duration: number;
}

interface GameWrapperProps {
  config: GameConfig;
  /** Render the gameplay UI */
  children: (api: GameAPI) => React.ReactNode;
  /** Called when the game should generate a result */
  onGetResult?: () => GameResult;
}

export interface GameAPI {
  phase: GamePhase;
  timer: ReturnType<typeof useGameTimer>;
  score: ReturnType<typeof useBrainScore>;
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => void;
  submitScore: (result: GameResult) => void;
  resetGame: () => void;
}

const COUNTDOWN_SECONDS = 3;

export default function GameWrapper({ config, children, onGetResult }: GameWrapperProps) {
  const [phase, setPhase] = useState<GamePhase>("instructions");
  const [countdownValue, setCountdownValue] = useState(COUNTDOWN_SECONDS);
  const [showPause, setShowPause] = useState(false);
  const [finalResult, setFinalResult] = useState<GameResult | null>(null);
  const completeGame = useStore((s) => s.completeGame);
  const startTimeRef = useRef(Date.now());

  const timer = useGameTimer({
    totalSeconds: config.duration || 999,
    mode: config.duration > 0 ? "countdown" : "countup",
    onTimeUp: () => {
      setPhase("timeup");
      // Auto-save on time up
      if (onGetResult) {
        const r = onGetResult();
        setFinalResult(r);
        saveResult({ ...r, gameId: config.gameId });
        completeGame({ ...r, gameId: config.gameId } as any);
      }
    },
  });

  const score = useBrainScore({
    basePoints: 10,
    speedMultiplier: true,
    speedWindow: 3000,
  });

  // Countdown 3-2-1 animation
  const startCountdown = useCallback(() => {
    setPhase("countdown");
    setCountdownValue(COUNTDOWN_SECONDS);
    const interval = setInterval(() => {
      setCountdownValue((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setPhase("playing");
          timer.start();
          startTimeRef.current = Date.now();
          return 0;
        }
        return prev - 1;
      });
    }, 800);
  }, [timer]);

  const startGame = useCallback(() => {
    score.reset();
    setFinalResult(null);
    startCountdown();
  }, [score, startCountdown]);

  const pauseGame = useCallback(() => {
    timer.pause();
    setShowPause(true);
    setPhase("paused");
  }, [timer]);

  const resumeGame = useCallback(() => {
    timer.resume();
    setShowPause(false);
    setPhase("playing");
  }, [timer]);

  const endGame = useCallback(() => {
    timer.pause();
    setPhase("timeup");
    if (onGetResult) {
      const r = onGetResult();
      setFinalResult(r);
    }
  }, [timer, onGetResult]);

  const submitScore = useCallback((result: GameResult) => {
    setFinalResult(result);
    setPhase("result");
    // Fire-and-forget save
    saveResult({ ...result, gameId: config.gameId });
    completeGame({ ...result, gameId: config.gameId } as any);
  }, [config.gameId, completeGame]);

  const resetGame = useCallback(() => {
    timer.reset();
    score.reset();
    setFinalResult(null);
    setPhase("instructions");
    setShowPause(false);
  }, [timer, score]);

  const api: GameAPI = {
    phase,
    timer,
    score,
    startGame,
    pauseGame,
    resumeGame,
    endGame,
    submitScore,
    resetGame,
  };

  return (
    <div className="relative min-h-dvh flex flex-col">
      {/* Game content */}
      {children(api)}

      {/* Countdown overlay */}
      {phase === "countdown" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-primary)]/80 backdrop-blur-sm">
          <div className="text-8xl font-extrabold text-gradient animate-scale-in">
            {countdownValue > 0 ? countdownValue : "Go!"}
          </div>
        </div>
      )}

      {/* Pause overlay */}
      {phase === "paused" && showPause && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--bg-primary)]/80 backdrop-blur-sm gap-4">
          <div className="text-6xl mb-2">⏸</div>
          <h2 className="text-2xl font-bold text-text-primary">Paused</h2>
          <div className="flex gap-3 mt-4">
            <button onClick={resumeGame} className="btn btn-md btn-primary">
              Resume
            </button>
            <button onClick={resetGame} className="btn btn-md btn-ghost">
              Quit
            </button>
          </div>
        </div>
      )}

      {/* Time up overlay */}
      {phase === "timeup" && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--bg-primary)]/80 backdrop-blur-sm gap-4 animate-scale-in">
          <div className="text-6xl mb-2">⏰</div>
          <h2 className="text-2xl font-bold text-text-primary">Time&apos;s Up!</h2>
          {finalResult && (
            <div className="glass-card-static p-4 text-center mt-2">
              <p className="text-3xl font-extrabold text-gradient">{finalResult.score}</p>
              <p className="text-xs text-text-muted mt-1">
                {finalResult.accuracy}% accuracy
              </p>
            </div>
          )}
          <button
            onClick={() => submitScore(finalResult || { score: 0, maxScore: 0, accuracy: 0, difficulty: "medium", duration: 0 })}
            className="btn btn-md btn-primary mt-2"
          >
            See Results
          </button>
        </div>
      )}
    </div>
  );
}
