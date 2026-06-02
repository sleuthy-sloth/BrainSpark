import { useSearchParams } from "next/navigation";

/**
 * Hook that reads seed/daily URL params from the current page.
 * Games call this to determine if they're in daily challenge mode.
 *
 * Returns:
 *   dailyMode: true if ?daily=true is present
 *   seed: the numeric seed for PRNG (if daily mode)
 *   dailyGame: which game index in the sequence (0, 1, 2)
 */
export function useSeedParams(): {
  dailyMode: boolean;
  seed: number;
  dailyGame: number | null;
} {
  const searchParams = useSearchParams();
  const dailyMode = searchParams.get("daily") === "true";
  const seedStr = searchParams.get("seed");
  const gameStr = searchParams.get("dailyGame");

  return {
    dailyMode,
    seed: seedStr ? parseInt(seedStr) || 0 : 0,
    dailyGame: gameStr !== null ? parseInt(gameStr) || 0 : null,
  };
}
