// Recent search queries, persisted locally and capped by the "Search history
// limit" preference (wiki_history_limit). Shared by the home Search tab and the
// search-results page so history stays consistent across both surfaces.

const HISTORY_KEY = "wiki_search_history";

export function getSearchHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addSearchHistory(query: string): void {
  const q = query.trim();
  if (!q) return;
  const limit = Number(localStorage.getItem("wiki_history_limit") || "10") || 10;
  const next = [q, ...getSearchHistory().filter((item) => item.toLowerCase() !== q.toLowerCase())].slice(
    0,
    Math.max(1, limit)
  );
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

export function clearSearchHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}
