"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import NavBar from "@/components/NavBar";
import GameWrapper, { type GameConfig, type GameAPI } from "@/engine/GameWrapper";
import { saveResult } from "@/lib/db";

const COLORS = ["RED", "BLUE", "GREEN", "YELLOW", "PURPLE"] as const;
const COLOR_VALUES: Record<string, string> = {
  RED: "#fb7185",
  BLUE: "#4a9eff",
  GREEN: "#34d399",
  YELLOW: "#fbbf24",
  PURPLE: "#a78bfa",
};

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function genStroop(level: number) {
  const word = pick(COLORS);
  const availableInks = COLORS.filter((c) => c !== word || level <= 2);
  const ink = level <= 2 ? pick(COLORS) : pick(availableInks);
  const correct = ink === word;

  // Options — the correct answer and 2-3 distractors
  const options = [COLOR_VALUES[ink]];
  const distractorPool = COLORS.filter((c) => COLOR_VALUES[c] !== COLOR_VALUES[ink]);
  while (options.length < 4) {
    const d = COLOR_VALUES[pick(distractorPool)];
    if (!options.includes(d)) options.push(d);
  }
  // Shuffle
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return { word, ink, correct, options };
}

type StroopRound = ReturnType<typeof genStroop>;

export default function StroopMatchPage() {
  const [level, setLevel] = useState(1);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [sRound, setSRound] = useState<StroopRound>(() => genStroop(1));
  const [lastFeedback, setLastFeedback] = useState<boolean | null>(null);
  const [mode, setMode] = useState<"ink" | "word">("ink");
  const startTime = useRef(Date.now());
  const reactionStart = useRef(Date.now());
  const totalRounds = 15;

  const config: GameConfig = {
    gameId: "stroop-match",
    title: "Stroop Match",
    duration: 0, // round-based
    instructions: "Tap the COLOR of the text, not the word itself.\n\nExample:\n\"RED\" in blue ink → tap blue\n\nMode switches between ink & word!",
    showCombo: false,
  };

  // Alternate between ink mode and word mode every 5 rounds
  useEffect(() => {
    setMode(Math.floor(round / 5) % 2 === 0 ? "ink" : "word");
  }, [round]);

  const nextRound = useCallback(() => {
    const newLevel = 1 + Math.floor(round / 5);
    setLevel(Math.min(newLevel, 5));
    setSRound(genStroop(Math.min(newLevel, 5)));
    setLastFeedback(null);
    reactionStart.current = Date.now();
  }, [round]);

  const handleChoice = (colorValue: string) => {
    if (lastFeedback !== null) return;
    const rt = Date.now() - reactionStart.current;

    let isCorrect: boolean;
    if (mode === "ink") {
      isCorrect = colorValue === COLOR_VALUES[sRound.ink];
    } else {
      isCorrect = colorValue === COLOR_VALUES[sRound.word];
    }

    if (isCorrect) {
      const pts = 10 + Math.max(0, 5 - Math.floor(rt / 1000)) + level;
      setScore((s) => s + pts);
      setCorrect((c) => c + 1);
    }
    setLastFeedback(isCorrect);

    setTimeout(() => {
      const next = round + 1;
      if (next >= totalRounds) {
        // Game over — save result
        const totalScore = score + (isCorrect ? 10 : 0);
        saveResult({
          gameId: "stroop-match",
          score: totalScore,
          maxScore: totalRounds * 20,
          accuracy: Math.round((correct + (isCorrect ? 1 : 0)) / totalRounds * 100),
          difficulty: `Level ${Math.min(level, 5)}`,
          duration: Math.round((Date.now() - startTime.current) / 1000),
        });
      } else {
        setRound(next);
        nextRound();
      }
    }, 600);
  };

  const startGame = (api: GameAPI) => {
    setLevel(1);
    setRound(0);
    setScore(0);
    setCorrect(0);
    setMode("ink");
    startTime.current = Date.now();
    api.startGame();
    setTimeout(() => {
      setSRound(genStroop(1));
      reactionStart.current = Date.now();
    }, 3000);
  };

  const renderGame = (api: GameAPI) => {
    if (api.phase === "instructions") {
      return (
        <>
          <NavBar />
          <main className="flex-1 flex flex-col items-center justify-center px-4 animate-fade-in">
            <div className="text-5xl mb-4 opacity-60">◉</div>
            <h1 className="text-3xl font-extrabold text-gradient-rose mb-1">{config.title}</h1>
            <p className="text-text-secondary text-sm mb-8 whitespace-pre-line text-center">
              {config.instructions}
            </p>
            <div className="glass-card-static p-4 w-full max-w-xs text-center mb-6">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Format</p>
              <p className="text-xl font-bold text-[var(--accent-rose)]">{totalRounds} rounds</p>
            </div>
            <button onClick={() => startGame(api)} className="btn btn-lg btn-primary animate-pulse-glow">
              Start Game
            </button>
          </main>
        </>
      );
    }

    if (api.phase === "playing") {
      return (
        <>
          <NavBar />
          <main className="flex-1 flex flex-col items-center justify-center px-4">
            {/* HUD */}
            <div className="w-full max-w-sm mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">{round + 1}/{totalRounds}</span>
                <span className="text-lg font-bold text-gradient-rose">{score}</span>
                <span className="text-xs text-text-muted bg-[var(--bg-card)] px-2 py-1 rounded-lg border border-[var(--border-subtle)]">
                  {mode === "ink" ? "Ink mode" : "Word mode"}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden mt-2">
                <div className="h-full rounded-full bg-[var(--accent-rose)] transition-all" style={{ width: `${(round / totalRounds) * 100}%` }} />
              </div>
            </div>

            {/* Stroop word */}
            <div className="text-center mb-6">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-4">
                Tap the {mode === "ink" ? "INK color" : "WORD meaning"}
              </p>
              <div
                className="text-5xl font-extrabold tracking-tight"
                style={{ color: COLOR_VALUES[sRound.ink] }}
              >
                {sRound.word}
              </div>
            </div>

            {/* Feedback */}
            {lastFeedback !== null && (
              <div className={`text-sm font-bold mb-4 animate-fade-in ${
                lastFeedback ? "text-[var(--accent-green)]" : "text-[var(--accent-rose)]"
              }`}>
                {lastFeedback ? "✓ Correct!" : "✗ Wrong!"}
              </div>
            )}

            {/* Color choices */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
              {sRound.options.map((color, i) => (
                <button
                  key={i}
                  onClick={() => handleChoice(color)}
                  disabled={lastFeedback !== null}
                  className="btn btn-md glass-card-static w-full text-sm font-bold"
                  style={{
                    borderLeft: `4px solid ${color}`,
                    color: color,
                  }}
                >
                  {Object.entries(COLOR_VALUES).find(([, v]) => v === color)?.[0]}
                </button>
              ))}
            </div>
          </main>
        </>
      );
    }

    if (api.phase === "timeup") return null;

    if (api.phase === "result" || round >= totalRounds) {
      const accuracy = Math.round(correct / totalRounds * 100);
      return (
        <>
          <NavBar />
          <main className="flex-1 flex flex-col items-center justify-center px-4 animate-scale-in">
            <div className="text-5xl mb-3">{accuracy >= 80 ? "🎉" : accuracy >= 50 ? "👍" : "💪"}</div>
            <h1 className="text-3xl font-extrabold text-gradient-rose mb-6">{config.title}</h1>
            <div className="glass-card-static p-6 w-full max-w-xs space-y-3 text-center">
              <p className="text-4xl font-extrabold text-gradient-rose">{score}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xl font-bold text-[var(--accent-green)]">{correct}/{totalRounds}</p>
                  <p className="text-xs text-text-muted">Correct</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-[var(--accent-amber)]">{accuracy}%</p>
                  <p className="text-xs text-text-muted">Accuracy</p>
                </div>
              </div>
              <div className="h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                <div className="h-full rounded-full bg-[var(--accent-green)] transition-all" style={{ width: `${accuracy}%` }} />
              </div>
            </div>
            <button onClick={() => {
              api.resetGame();
              setRound(0);
              setScore(0);
              setCorrect(0);
              setLastFeedback(null);
            }} className="btn btn-md btn-primary mt-6">Play Again</button>
          </main>
        </>
      );
    }

    return null;
  };

  const getResult = useCallback(() => ({
    score,
    maxScore: totalRounds * 20,
    accuracy: Math.round(correct / totalRounds * 100),
    difficulty: `Level ${Math.min(level, 5)}`,
    duration: Math.round((Date.now() - startTime.current) / 1000),
  }), [score, correct, level]);

  return (
    <GameWrapper config={config} onGetResult={getResult}>
      {renderGame}
    </GameWrapper>
  );
}
