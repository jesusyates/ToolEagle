/**
 * Lightweight localStorage utilities for history, favorites, and tool usage.
 * Client-side only.
 */

const HISTORY_KEY = "tooleagle_history";
const FAVORITES_KEY = "tooleagle_favorites";
const USAGE_KEY = "tooleagle_tool_usage";
const MAX_HISTORY = 20;
const MAX_FAVORITES = 100;

export type HistoryEntry = {
  id: string;
  toolSlug: string;
  toolName: string;
  input: string;
  items: string[];
  timestamp: number;
};

export type FavoriteEntry = {
  id: string;
  toolSlug: string;
  toolName: string;
  text: string;
  savedAt: number;
};

export type ToolUsageCounts = Record<string, number>;

function safeParse<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded or disabled
  }
}

export function getHistory(): HistoryEntry[] {
  return safeParse<HistoryEntry[]>(HISTORY_KEY, []);
}

export function addToHistory(entry: Omit<HistoryEntry, "id" | "timestamp">) {
  const list = getHistory();
  const newEntry: HistoryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: Date.now()
  };
  const updated = [newEntry, ...list.filter((h) => h.toolSlug !== entry.toolSlug || h.input !== entry.input)].slice(
    0,
    MAX_HISTORY
  );
  safeSet(HISTORY_KEY, updated);
  return newEntry;
}

export function removeFromHistory(id: string) {
  const list = getHistory().filter((h) => h.id !== id);
  safeSet(HISTORY_KEY, list);
}

export function getFavorites(): FavoriteEntry[] {
  return safeParse<FavoriteEntry[]>(FAVORITES_KEY, []);
}

export function addFavorite(entry: Omit<FavoriteEntry, "id" | "savedAt">) {
  const list = getFavorites();
  const newEntry: FavoriteEntry = {
    ...entry,
    id: crypto.randomUUID(),
    savedAt: Date.now()
  };
  const updated = [newEntry, ...list].slice(0, MAX_FAVORITES);
  safeSet(FAVORITES_KEY, updated);
  return newEntry;
}

export function removeFavorite(id: string) {
  const list = getFavorites().filter((f) => f.id !== id);
  safeSet(FAVORITES_KEY, list);
}

export function isFavorite(text: string): boolean {
  return getFavorites().some((f) => f.text === text);
}

export function getToolUsageCounts(): ToolUsageCounts {
  return safeParse<ToolUsageCounts>(USAGE_KEY, {});
}

export function incrementToolUsage(toolSlug: string) {
  const counts = getToolUsageCounts();
  counts[toolSlug] = (counts[toolSlug] ?? 0) + 1;
  safeSet(USAGE_KEY, counts);
}
