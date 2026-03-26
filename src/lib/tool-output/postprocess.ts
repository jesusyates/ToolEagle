export type Market = "cn" | "global";

function uniqPreserve<T>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of items) {
    const key = typeof it === "string" ? it.toLowerCase() : JSON.stringify(it);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

export function normalizeTitleCandidates(raw: string[]): string[] {
  const lines = raw
    .flatMap((x) => String(x || "").split("\n"))
    .map((s) => s.replace(/^[•\-\d.]+\s+/, "").trim())
    .filter(Boolean)
    .map((s) => s.replace(/^"(.+)"$/, "$1").trim());

  const cleaned = lines
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.length >= 6 && s.length <= 90);

  return uniqPreserve(cleaned).slice(0, 20);
}

export function extractHashtags(text: string): string[] {
  const matches = String(text || "").match(/#[\p{L}\p{N}_]+/gu) ?? [];
  const cleaned = matches
    .map((t) => t.replace(/#+/g, "#").trim())
    .filter((t) => t.length >= 2 && t.length <= 40);
  return uniqPreserve(cleaned);
}

export function normalizeHashtagSets(raw: string[]): string[] {
  const all = raw.flatMap((x) => extractHashtags(String(x || "")));
  if (all.length === 0) {
    const cleaned = raw.map((x) => String(x || "").trim()).filter(Boolean);
    return uniqPreserve(cleaned).slice(0, 6);
  }

  // Produce 3 sets (when possible): broad / niche / mixed rotation.
  const tags = uniqPreserve(all);
  const slice = (start: number, n: number) =>
    tags.slice(start, start + n).filter(Boolean);

  const set1 = slice(0, 14);
  const set2 = slice(6, 14);
  const set3 = slice(3, 14);

  const out = uniqPreserve([set1, set2, set3].map((s) => s.join(" ")).filter(Boolean));
  return out.slice(0, 6);
}

