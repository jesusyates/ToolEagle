/**
 * V191 — Heuristic content analysis: types, hooks, CTA usage, style, topic consistency.
 * No LLM; rules + keyword signals only.
 */

import type { ContentMix, PastContentItem } from "@/lib/creator-analysis/types";
import { aggregateContentMix, inferDominantStyle } from "@/lib/creator-analysis/classify-content";
import { ctaCoverageAcrossItems, detectCtaHits } from "@/lib/creator-analysis/detect-cta";
import { blockForItem, scoreItemSignals } from "@/lib/creator-analysis/extract-patterns";
import { countWords, extractTopKeywords, nicheEntropyScore } from "@/lib/creator-analysis/niche-cluster";

export type HookTypeKey = "question" | "fear" | "curiosity" | "list" | "story" | "command" | "none";

export type EditorialStyleKey = "educational" | "emotional" | "aggressive" | "neutral";

export type CtaUsage = {
  posts_with_cta: number;
  posts_without_cta: number;
  /** 0–1 */
  coverage: number;
  dominant_cta_kind: "soft_engagement" | "link_or_shop" | "hard_sell" | "none" | "mixed";
};

export type AnalyzeCreatorContentResult = {
  content_mix: ContentMix;
  /** Opening-line / title hook mix (percentages, sum ~100) */
  hook_distribution: Record<HookTypeKey, number>;
  /** Dominant editorial tone across samples */
  dominant_editorial_style: EditorialStyleKey;
  dominant_style: string;
  cta_usage: CtaUsage;
  /** 0–100, higher = more consistent topical language */
  topic_consistency_score: number;
};

const SELL_HARD = ["buy now", "order", "checkout", "cart", "discount code", "sale ends"];
const LINK_SHOP = ["link in bio", "link below", "shop", "http", "www.", ".com", "grab yours"];

function hookLine(item: PastContentItem): string {
  const t = (item.title ?? "").trim();
  if (t.length >= 6) return t.slice(0, 140);
  const c = (item.caption ?? "").trim();
  const first = c.split(/\n/).find((x) => x.trim().length > 0) ?? "";
  return (first || c).slice(0, 140);
}

export function detectHookType(line: string): HookTypeKey {
  const t = line.toLowerCase().trim();
  if (t.length < 4) return "none";
  if (/\?\s*$|\?\s+[a-z]/.test(t) || /^(what|why|how|who|when|where|which|can you|have you|did you|is it)\b/i.test(t)) {
    return "question";
  }
  if (/\b(fear|afraid|worst|mistake|stop|risk|lose|failing|don't let|never do)\b/.test(t)) return "fear";
  if (/\b(secret|truth|nobody tells|won't believe|this is why|you need to see|i didn't know)\b/.test(t)) return "curiosity";
  if (/^\d+[\).\s]|\b(three|five|seven|10|ten)\s+(ways|things|reasons|mistakes|signs|steps)\b/i.test(t) || /\b(top \d|#\d)\b/i.test(t)) {
    return "list";
  }
  if (/\b(i |i'm|i was|my |last week|when i|story time)\b/.test(t)) return "story";
  if (/^(stop|don't|do this|you must|watch this)\b/i.test(t)) return "command";
  return "none";
}

function editorialStyleForBlock(block: string): EditorialStyleKey {
  const s = scoreItemSignals(block);
  const t = block.toLowerCase();
  const aggressive =
    s.opinion > 0 ||
    /\b(stop doing|you're wrong|worst|trash|unpopular|hot take)\b/.test(t) ||
    /!{2,}/.test(block);
  if (aggressive) return "aggressive";
  if (s.story > 0 || /\b(i feel|heart|proud|cry|grateful)\b/.test(t)) return "emotional";
  if (s.tutorial + s.listicle > 0 || /\b(how to|tips|steps|guide)\b/.test(t)) return "educational";
  return "neutral";
}

function pctDistribution(counts: Record<HookTypeKey, number>, n: number): Record<HookTypeKey, number> {
  const keys: HookTypeKey[] = ["question", "fear", "curiosity", "list", "story", "command", "none"];
  if (n <= 0) return Object.fromEntries(keys.map((k) => [k, 0])) as Record<HookTypeKey, number>;
  const out = {} as Record<HookTypeKey, number>;
  for (const k of keys) {
    out[k] = Math.round((counts[k] / n) * 1000) / 10;
  }
  return out;
}

function dominantEditorialFromItems(items: PastContentItem[]): EditorialStyleKey {
  const acc: Record<EditorialStyleKey, number> = {
    educational: 0,
    emotional: 0,
    aggressive: 0,
    neutral: 0
  };
  for (const it of items) {
    const k = editorialStyleForBlock(blockForItem(it));
    acc[k] += 1;
  }
  let best: EditorialStyleKey = "neutral";
  let v = -1;
  (Object.keys(acc) as EditorialStyleKey[]).forEach((k) => {
    if (acc[k] > v) {
      v = acc[k];
      best = k;
    }
  });
  return best;
}

function dominantCtaKind(texts: string[]): CtaUsage["dominant_cta_kind"] {
  let soft = 0;
  let link = 0;
  let hard = 0;
  for (const text of texts) {
    const low = text.toLowerCase();
    if (SELL_HARD.some((p) => low.includes(p))) hard += 1;
    else if (LINK_SHOP.some((p) => low.includes(p))) link += 1;
    else if (detectCtaHits(text) > 0) soft += 1;
  }
  const n = texts.length || 1;
  if (hard / n > 0.35) return "hard_sell";
  if (link / n > 0.35) return "link_or_shop";
  if (soft / n > 0.35) return "soft_engagement";
  if (detectCtaHits(texts.join("\n")) === 0) return "none";
  return "mixed";
}

function editorialLabel(k: EditorialStyleKey): string {
  switch (k) {
    case "educational":
      return "Educational / explanatory";
    case "emotional":
      return "Emotional / personal";
    case "aggressive":
      return "Bold / contrarian";
    default:
      return "Neutral / mixed";
  }
}

/**
 * Full pass: content mix, hook distribution, styles, CTA object, topic consistency.
 */
export function analyzeCreatorContent(
  items: PastContentItem[],
  nicheBlob: string
): AnalyzeCreatorContentResult {
  const { mix } = aggregateContentMix(items);
  const textsPerItem = items.map((it) => {
    const b = blockForItem(it);
    return b + "\n" + (it.cta ?? "");
  });
  const coverage = ctaCoverageAcrossItems(textsPerItem);
  const withCta = textsPerItem.filter((x) => detectCtaHits(x) > 0).length;
  const without = items.length - withCta;

  const counts: Record<HookTypeKey, number> = {
    question: 0,
    fear: 0,
    curiosity: 0,
    list: 0,
    story: 0,
    command: 0,
    none: 0
  };
  for (const it of items) {
    const hk = detectHookType(hookLine(it));
    counts[hk] += 1;
  }
  const hook_distribution = pctDistribution(counts, items.length);

  const blob = [nicheBlob, ...items.map(blockForItem)].join("\n");
  const topKw = extractTopKeywords(blob, 14);
  const wc = countWords(blob);
  const ent = nicheEntropyScore(topKw, wc);
  const topic_consistency_score = Math.round(Math.max(0, Math.min(100, 100 * (1 - ent))));

  const ed = dominantEditorialFromItems(items);
  const dominant_editorial_style = ed;
  const cta_usage: CtaUsage = {
    posts_with_cta: withCta,
    posts_without_cta: without,
    coverage,
    dominant_cta_kind: dominantCtaKind(textsPerItem)
  };

  const dominant_style = `${inferDominantStyle(mix, coverage)} · ${editorialLabel(ed)}`;

  return {
    content_mix: mix,
    hook_distribution,
    dominant_editorial_style,
    dominant_style,
    cta_usage,
    topic_consistency_score
  };
}
