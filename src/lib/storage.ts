/**
 * Legacy storage adapter — delegates to IndexedDB (lib/db.ts)
 * Kept for backward compatibility with existing game files.
 */
export type { GameId, GameResult } from "@/lib/db";
export { saveResult, getResults, getProficiency } from "@/lib/db";
