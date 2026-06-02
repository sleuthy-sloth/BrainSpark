"use client";

import { useState, useEffect, useRef } from 'react';

type Difficulty = 'easy' | 'medium' | 'hard';
type GameState = 'menu' | 'playing' | 'result';

interface Question {
  display: string;
  answer: number;
  choices: number[];
}

function generateQuestion(difficulty: Difficulty): Question {
  let a: number, b: number, op: string, answer: number;

  switch (difficulty) {
    case 'easy': {
      a = Math.floor(Math.random() * 10) + 1;
      b = Math.floor(Math.random() * 10) + 1;
      op = Math.random() > 0.5 ? '+' : '-';
      answer = op === '+' ? a + b : a - b;
      break;
    }
    case 'medium': {
      a = Math.floor(Math.random() * 25) + 5;
      b = Math.floor(Math.random() * 15) + 2;
      op = ['+', '-', '×'][Math.floor(Math.random() * 3)];
      answer = op === '+' ? a + b : op === '-' ? a - b : a * b;
      break;
    }
    case 'hard': {
      a = Math.floor(Math.random() * 50) + 10;
      b = Math.floor(Math.random() * 10) + 2;
      op = ['+', '-', '×', '÷'][Math.floor(Math.random() * 4)];
      answer = op === '÷' ? a : op === '+' ? a + b : op === '-' ? a - b : a * b;
      if (op === '÷') {
        answer = Math.floor(a / b);
        a = answer * b;
      }
      break;
    }
  }

  const display = `${a} ${op} ${b}`;
  const choices = [answer];
  while (choices.length < 4) {
    const offset = Math.floor(Math.random() * 9) - 4;
    const fake = answer + offset + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3);
    if (!choices.includes(fake) && fake !== answer) {
      choices.push(fake);
    }
  }

  // Shuffle
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }

  return { display, answer, choices };
}

export default function MathQuiz() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [question, setQuestion] = useState<Question>(() => generateQuestion('easy'));
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [total, setTotal] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong' | null; index?: number }>({ type: null });
  const [questionNumber, setQuestionNumber] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [timedMode, setTimedMode] = useState(false);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startGame = () => {
    const q = generateQuestion(difficulty);
    setQuestion(q);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setTotal(0);
    setCorrect(0);
    setQuestionNumber(0);
    setFeedback({ type: null });
    setGameState('playing');
    startTimer();
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(15);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          // Time's up — treat as wrong
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const handleTimeout = () => {
    setTotal((t) => t + 1);
    setStreak(0);
    setFeedback({ type: 'wrong' });
    setTimeout(() => nextQuestion(), 600);
  };

  const nextQuestion = () => {
    const q = generateQuestion(difficulty);
    setQuestion(q);
    setQuestionNumber((n) => n + 1);
    setFeedback({ type: null });
    if (timedMode) startTimer();
  };

  const handleAnswer = (choice: number, index: number) => {
    if (feedback.type) return;
    if (timedMode && timerRef.current) clearInterval(timerRef.current);

    const isCorrect = choice === question.answer;
    setFeedback({ type: isCorrect ? 'correct' : 'wrong', index });
    setTotal((t) => t + 1);

    if (isCorrect) {
      setScore((s) => s + (timedMode ? Math.max(10, timeLeft * 2) : 10));
      setStreak((s) => s + 1);
      setCorrect((c) => c + 1);
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      if (total >= 9) {
        setGameState('result');
        if (streak > bestStreak) setBestStreak(streak);
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        nextQuestion();
      }
    }, 600);
  };

  if (gameState === 'menu') {
    return (
      <div className="game-container">
        <h1>BrainSpark</h1>
        <div className="card">
          <p style={{ textAlign: 'center', color: '#94a3b8', lineHeight: 1.6 }}>
            Test your mental math skills.<br />
            10 questions per round.
          </p>
          <div className="mode-select">
            <button
              className={`mode-btn ${!timedMode ? 'active' : ''}`}
              onClick={() => setTimedMode(false)}
            >
              Practice
            </button>
            <button
              className={`mode-btn ${timedMode ? 'active' : ''}`}
              onClick={() => setTimedMode(true)}
            >
              Timed
            </button>
          </div>
          <div className="mode-select">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                className={`mode-btn ${difficulty === d ? 'active' : ''}`}
                onClick={() => setDifficulty(d)}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
          <button className="start-btn" onClick={startGame}>
            Start Game
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'result') {
    const pct = Math.round((correct / total) * 100);
    const grade = pct >= 90 ? 'S' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : 'D';

    return (
      <div className="game-container">
        <h1>BrainSpark</h1>
        <div className="card">
          <div className="result-text">{grade}</div>
          <div className="result-sub">{correct}/{total} correct ({pct}%)</div>
          <div className="result-sub">Score: {score}</div>
          <div className="result-sub">Best streak: {bestStreak}</div>
          <button className="start-btn" onClick={startGame}>
            Play Again
          </button>
          <button
            className="start-btn"
            style={{ background: '#334155', marginTop: '-0.5rem' }}
            onClick={() => setGameState('menu')}
          >
            Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <h1>BrainSpark</h1>
      <div className="card">
        <div className="score-row">
          <span>Score</span>
          <span>{score}</span>
        </div>

        {timedMode && (
          <div className="timer-bar">
            <div className="timer-fill" style={{ width: `${(timeLeft / 15) * 100}%` }} />
          </div>
        )}

        <div className="question">{question.display}</div>

        <div className="answer-grid">
          {question.choices.map((choice, i) => (
            <button
              key={i}
              className={`answer-btn ${
                feedback.type && i === feedback.index
                  ? feedback.type
                  : feedback.type && i === question.choices.indexOf(question.answer)
                  ? 'correct'
                  : ''
              }`}
              onClick={() => handleAnswer(choice, i)}
              disabled={!!feedback.type}
            >
              {choice}
            </button>
          ))}
        </div>

        <div className={`feedback ${feedback.type || ''}`}>
          {feedback.type === 'correct' && '✓ Correct!'}
          {feedback.type === 'wrong' && `✗ ${question.answer}`}
          {!feedback.type && '- -'}
        </div>

        <div className="score-row" style={{ fontSize: '0.875rem' }}>
          <span>Question</span>
          <span>{questionNumber + 1} / 10</span>
        </div>

        {streak >= 2 && (
          <div className="streak">
            <span className="streak-fire">🔥</span> {streak}x streak!
          </div>
        )}
      </div>
    </div>
  );
}
