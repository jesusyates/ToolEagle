/**
 * 中文指南相关推荐（字元重叠 + 平台字段）。
 */

import { getAllZhGuides, type ZhGuideRecord } from "@/lib/zh-guides-reader";

function cjkChars(s: string): Set<string> {
  const set = new Set<string>();
  for (const ch of s.replace(/[^\u4e00-\u9fff]/g, "")) {
    set.add(ch);
  }
  return set;
}

function overlapScore(a: ZhGuideRecord, b: ZhGuideRecord): number {
  const ca = cjkChars(`${a.title}${a.body.slice(0, 1200)}`);
  const cb = cjkChars(`${b.title}${b.body.slice(0, 1200)}`);
  let n = 0;
  for (const x of ca) {
    if (cb.has(x)) n++;
  }
  return n;
}

export async function getRelatedZhGuideLinks(
  currentSlug: string,
  minItems = 5
): Promise<{ slug: string; title: string }[]> {
  const all = await getAllZhGuides();
  const cur = all.find((p) => p.slug === currentSlug);
  if (!cur) return [];

  const others = all.filter((p) => p.slug !== currentSlug);
  const scored = others.map((p) => {
    let score = overlapScore(cur, p);
    if (cur.platform && p.platform && cur.platform === p.platform) score += 12;
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
  return out;
}
