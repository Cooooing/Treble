const storageKey = "treble.article-search-history";
const maxEntries = 10;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadSearchHistory(): string[] {
  if (!canUseStorage()) return [];
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === "string" && item.trim() !== "").slice(0, maxEntries);
  } catch {
    return [];
  }
}

export function saveSearchHistory(value: string): string[] {
  const query = value.trim();
  if (!query || !canUseStorage()) return loadSearchHistory();
  const next = [query, ...loadSearchHistory().filter((item) => item !== query)].slice(0, maxEntries);
  window.localStorage.setItem(storageKey, JSON.stringify(next));
  return next;
}

export function removeSearchHistory(value: string): string[] {
  const next = loadSearchHistory().filter((item) => item !== value);
  if (canUseStorage()) window.localStorage.setItem(storageKey, JSON.stringify(next));
  return next;
}

export function clearSearchHistory(): void {
  if (canUseStorage()) window.localStorage.removeItem(storageKey);
}
