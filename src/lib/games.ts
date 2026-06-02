import type { GameId } from "@/lib/storage";

export interface GameMeta {
  id: GameId;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  accent: "blue" | "green" | "amber" | "violet" | "rose" | "cyan";
  gradient: string;
  color: string;
  icon: string;
}

export const GAMES: GameMeta[] = [
  {
    id: "math-quiz",
    title: "Math Sprint",
    subtitle: "Quick calculations",
    description: "Solve arithmetic problems against the clock. Build speed and accuracy with numbers.",
    href: "/games/math-quiz",
    accent: "blue",
    gradient: "text-gradient",
    color: "#4a9eff",
    icon: "∑",
  },
  {
    id: "memory-match",
    title: "Memory Match",
    subtitle: "Find the pairs",
    description: "Flip cards and remember their positions. Train your visual short-term memory.",
    href: "/games/memory-match",
    accent: "green",
    gradient: "text-gradient-green",
    color: "#34d399",
    icon: "◆",
  },
  {
    id: "speed-reaction",
    title: "Speed Tap",
    subtitle: "Reflex challenge",
    description: "React as fast as you can when the signal changes. Measure your response time.",
    href: "/games/speed-reaction",
    accent: "amber",
    gradient: "text-gradient-amber",
    color: "#fbbf24",
    icon: "⚡",
  },
  {
    id: "word-scramble",
    title: "Word Twist",
    subtitle: "Unscramble words",
    description: "Rearrange letters to form words. Expand your vocabulary and mental agility.",
    href: "/games/word-scramble",
    accent: "violet",
    gradient: "text-gradient-violet",
    color: "#a78bfa",
    icon: "✦",
  },
];
