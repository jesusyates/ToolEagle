import { getAllAutoPosts, type AutoPostRecord } from "@/lib/auto-posts-reader";

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);
}

function detectPlatform(text: string): string | null {
  const t = text.toLowerCase();
  if (/\btiktok\b/.test(t)) return "tiktok";
  if (/\binstagram\b/.test(t)) return "instagram";
  if (/\byoutube\b/.test(t)) return "youtube";
  return null;
}

function overlapScore(a: AutoPostRecord, b: AutoPostRecord): number {
  const wa = new Set(tokenize(`${a.title} ${a.body.slice(0, 1500)}`));
  const wb = new Set(tokenize(`${b.title} ${b.body.slice(0, 1500)}`));
  let n = 0;
  for (const w of wa) {
    if (wb.has(w)) n++;
  }
  return n;
}

function clusterThemeScore(a: string | undefined, b: string | undefined): number {
  if (!a?.trim() || !b?.trim()) return 0;
  const ca = a.toLowerCase().trim();
  const cb = b.toLowerCase().trim();
  if (ca === cb) return 30;
  if (ca.includes(cb) || cb.includes(ca)) return 22;
  let n = 0;
  const sa = new Set(tokenize(ca));
  for (const w of tokenize(cb)) {
    if (sa.has(w)) n++;
  }
  return n * 4;
}

/**
 * Related guides — cluster + platform + keyword overlap; 5–8 items.
 */
export async function getRelatedGuideLinks(
  currentSlug: string,
  minItems = 5
): Promise<{ slug: string; title: string }[]> {
  const all = await getAllAutoPosts();
  const cur = all.find((p) => p.slug === currentSlug);
  if (!cur) return [];

  const curPlatform = detectPlatform(`${cur.title} ${cur.body.slice(0, 2000)}`);
  const others = all.filter((p) => p.slug !== currentSlug);

  const scored = others.map((p) => {
    let score = overlapScore(cur, p);
    const pb = detectPlatform(`${p.title} ${p.body.slice(0, 2000)}`);
    if (curPlatform && pb && curPlatform === pb) score += 18;
    score += clusterThemeScore(cur.clusterTheme, p.clusterTheme);
    return { p, score };
  });
  scored.sort((a, b) => b.score - a.score);

  const out: { slug: string; title: string }[] = [];
  const seen = new Set<string>();

  for (const { p } of scored) {
    if (out.length >= 8) break;
    if (!seen.has(p.slug)) {
      out.push({ slug: p.slug, title: p.title || p.slug });
      seen.add(p.slug);
    }
  }

  for (const p of others) {
    if (out.length >= minItems) break;
    if (seen.has(p.slug)) continue;
    out.push({ slug: p.slug, title: p.title || p.slug });
    seen.add(p.slug);
  }

  return out.slice(0, Math.max(minItems, Math.min(8, out.length)));
}
