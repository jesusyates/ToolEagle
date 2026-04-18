/**
 * Google autocomplete-style suggestions (unofficial suggestqueries endpoint).
 * Best-effort: network failures return [].
 */
export async function fetchGoogleSuggestQueries(
  query: string,
  options?: { hl?: string; gl?: string; signal?: AbortSignal }
): Promise<string[]> {
  const q = query.replace(/\s+/g, " ").trim();
  if (!q) return [];

  const hl = options?.hl ?? "en";
  const gl = options?.gl ?? "us";
  const url = new URL("https://suggestqueries.google.com/complete/search");
  url.searchParams.set("client", "firefox");
  url.searchParams.set("hl", hl);
  url.searchParams.set("gl", gl);
  url.searchParams.set("q", q);

  try {
    const res = await fetch(url.toString(), {
      signal: options?.signal,
      headers: {
        Accept: "application/json,*/*",
        "User-Agent":
          "Mozilla/5.0 (compatible; ToolEagleSearchData/1.0; +https://tooleagle.com) AppleWebKit/537.36"
      },
      redirect: "follow"
    });
    if (!res.ok) return [];
    const raw = (await res.json()) as unknown;
    if (!Array.isArray(raw) || raw.length < 2) return [];
    const second = raw[1];
    if (!Array.isArray(second)) return [];
    return second.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
  } catch {
    return [];
  }
}
