/**
 * Category definitions shared across the app.
 */
import type { Category } from "@/lib/db";

export interface CategoryMeta {
  id: Category;
  label: string;
  icon: string;
  color: string;
  description: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: "numeracy", label: "Numeracy", icon: "∑", color: "#4a9eff", description: "Math & calculation skills" },
  { id: "memory", label: "Memory", icon: "◆", color: "#34d399", description: "Short-term & working memory" },
  { id: "focus", label: "Focus", icon: "◉", color: "#fb7185", description: "Attention & concentration" },
  { id: "reflexes", label: "Reflexes", icon: "⚡", color: "#fbbf24", description: "Reaction speed & coordination" },
  { id: "vocabulary", label: "Vocabulary", icon: "✦", color: "#a78bfa", description: "Language & word skills" },
  { id: "logic", label: "Logic", icon: "⊞", color: "#22d3ee", description: "Reasoning & problem-solving" },
];

export function getCategoryMeta(id: Category): CategoryMeta {
  return CATEGORIES.find((c) => c.id === id)!;
}
