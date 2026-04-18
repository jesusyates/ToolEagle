import {
  buildClusterTopicsForCluster,
  buildClusterTopicsForClusterAsync,
  isValidSeoTitle,
  normalizeSeoTitle
} from "./cluster-topic-blueprint";
import { isPreValidatedTitle } from "./title-prevalidation";
import { expandSeoKeywords } from "./keyword-expansion";
import { inferSearchDemandIntent, passesSearchDemandPhrase } from "./search-data-engine/search-style-gate";
import {
  loadClusterPriorityState,
  orderBlueprintsByPriority,
  type ClusterPriorityMeta
} from "./cluster-priority";

export { inferClusterTopicKind, type ClusterTopicKind, buildClusterTopicsForCluster } from "./cluster-topic-blueprint";
export { loadClusterPriorityState, recordClusterRunOutcome } from "./cluster-priority";
export type { ClusterPriorityMeta } from "./cluster-priority";

const SEEDS = ["tiktok", "instagram", "youtube"];
/** Guide-oriented audiences (read naturally after “as …”). */
const GUIDE_AUDIENCES = ["beginners", "new creators", "small creators", "part-time creators"];

const CREATOR_TYPES = ["small business owners", "beauty creators", "fitness creators", "faceless creators"];

export type GeneratedTopic = {
  topic: string;
  keyword: string;
  angle: string;
  /** Present when topic is demand-led (search-data-engine). */
  intent?: string;
};

/** Pillar cluster: one theme + multiple distinct guide angles (not title tweaks). */
export type TopicCluster = {
  cluster: string;
  topics: string[];
  /** 1:1 with topics from search-data-engine (keyword + intent). */
  meta?: Array<{ keyword: string; intent: string }>;
};

type ClusterBlueprint = {
  cluster: string;
};

/** Prefer these spindles first so fresh angles surface before high-collision themes. */
const NEW_EN_SPINDLE_CLUSTERS = new Set([
  "Short-form editing workflow versioning and handoffs for solo creators",
  "Client acquisition content and social proof for service sellers",
  "Creator offers lead magnets and entry products on short video",
  "Repost and repurpose systems across formats without duplicate fatigue",
  "Comment to DM funnels and inbound qualification on short-form",
  "Short-form hooks for local businesses and neighborhood offers",
  "Content batching for appointment-based businesses between sessions",
  "Before and after proof content without client face reveal",
  "Educational carousel and list posts adapted into short video beats",
  "Retention scripting and repeat viewers without growth hacks framing"
]);

/** Temporarily deprioritize: heavy overlap with existing published/staged EN titles. */
/** Max rule-based expansions per base topic (after filters). */
const MAX_EXPANSION = 3;

const EN_DEMOTED_HIGH_COLLISION_CLUSTERS = new Set([
  "Stuck creators and growth plateaus on Instagram and TikTok",
  "No time no team low budget creator workflow on YouTube and TikTok",
  "Service business routines on Instagram and TikTok for consultants",
  "Scaling TikTok and Instagram with systems not hacks"
]);

const CLUSTER_BLUEPRINTS: ClusterBlueprint[] = [
  { cluster: "Short-form editing workflow versioning and handoffs for solo creators" },
  { cluster: "Client acquisition content and social proof for service sellers" },
  { cluster: "Creator offers lead magnets and entry products on short video" },
  { cluster: "Repost and repurpose systems across formats without duplicate fatigue" },
  { cluster: "Comment to DM funnels and inbound qualification on short-form" },
  { cluster: "Short-form hooks for local businesses and neighborhood offers" },
  { cluster: "Content batching for appointment-based businesses between sessions" },
  { cluster: "Before and after proof content without client face reveal" },
  { cluster: "Educational carousel and list posts adapted into short video beats" },
  { cluster: "Retention scripting and repeat viewers without growth hacks framing" },
  { cluster: "TikTok growth and discoverability" },
  { cluster: "Instagram consistency for busy creators" },
  { cluster: "YouTube Shorts and weekly growth for small channels" },
  { cluster: "Cross platform workflow and batching" },
  { cluster: "TikTok beginners and first posts" },
  { cluster: "TikTok low views and stalled reach" },
  { cluster: "YouTube creative blocks and no ideas" },
  { cluster: "Instagram posting habits and weekly content planning rhythm" },
  { cluster: "Faceless TikTok tips without showing your face" },
  { cluster: "Part time creators and weekend filming" },
  { cluster: "Small business creator growth content on Instagram" },
  { cluster: "YouTube creative routines and content planning before filming" },
  { cluster: "TikTok weekly planning and batch scripts" },
  { cluster: "Instagram burnout boundaries and rest days" },
  { cluster: "Coaches and freelancers booking calls via short-form video" },
  { cluster: "Instagram reels versus feed posts for coaches and consultants" },
  { cluster: "YouTube Shorts versus long form for solo creators without editors" },
  { cluster: "Evergreen versus trend-led TikTok content for small channels" },
  { cluster: "Voiceover and storytelling on TikTok without talking head setups" },
  { cluster: "Scaling TikTok and Instagram with systems not hacks" },
  { cluster: "Stuck creators and growth plateaus on Instagram and TikTok" },
  { cluster: "No time no team low budget creator workflow on YouTube and TikTok" },
  { cluster: "Service business routines on Instagram and TikTok for consultants" }
];

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function isAcceptableTopic(topic: string): boolean {
  const s = topic.replace(/\s+/g, " ").trim();
  if (/^(tiktok|instagram|youtube)\s+(tiktok|instagram|youtube)\b/i.test(s)) return false;
  if (!passesSearchDemandPhrase(s)) return false;
  const words = s.split(/\s+/).filter(Boolean);
  if (words.length >= 4 && s.length >= 28) return true;
  if (words.length >= 7 && s.length >= 42) return true;
  return false;
}

function tryAdd(
  seen: Set<string>,
  pool: GeneratedTopic[],
  topic: string,
  keyword: string,
  angle: string
): void {
  const normalized = normalizeSeoTitle(topic.replace(/\s+/g, " ").trim());
  if (!isValidSeoTitle(normalized)) return;
  const key = normalized.toLowerCase().replace(/\s+/g, " ").trim();
  if (seen.has(key)) return;
  if (!isAcceptableTopic(normalized)) return;
  seen.add(key);
  pool.push({ topic: normalized, keyword, angle });
}

/**
 * Guide-first: natural SEO-style lines (fewer platform+scene+role stacks).
 */
function fillGuidePool(seen: Set<string>, pool: GeneratedTopic[]): void {
  for (const platform of SEEDS) {
    for (const aud of GUIDE_AUDIENCES) {
      tryAdd(
        seen,
        pool,
        `how to run a posting system on ${platform} when ${aud} need clearer angles weekly`,
        `get more views ${platform}`,
        `guide:views-as-${aud.replace(/\s+/g, "-")}`
      );
    }

    tryAdd(
      seen,
      pool,
      `how to keep weekly posting routine on ${platform} without burnout as solo creator`,
      `stay consistent ${platform}`,
      "guide:consistent-no-burnout"
    );

    tryAdd(
      seen,
      pool,
      `how to plan ${platform} content when you have no ideas midweek`,
      `plan ${platform} content`,
      "guide:plan-no-ideas"
    );

    tryAdd(
      seen,
      pool,
      `how to stay motivated to post on ${platform} every week when metrics swing`,
      `post weekly ${platform}`,
      "guide:weekly-motivation"
    );

    for (const ct of CREATOR_TYPES) {
      tryAdd(
        seen,
        pool,
        `beginner guide to ${platform} content for ${ct}`,
        `beginner ${platform} content`,
        `guide:beginner-for-${ct.split(" ")[0]}`
      );
      tryAdd(
        seen,
        pool,
        `tips for ${ct} on ${platform} when low views persist and hooks feel recycled`,
        `${platform} tips low views`,
        "guide:tips-low-views"
      );
      tryAdd(
        seen,
        pool,
        `how to grow ${platform} in 2026 for ${ct} when growth feels uneven monthly`,
        `grow ${platform} 2026`,
        "guide:grow-2026"
      );
    }
  }

  /** Lighter vertical hooks (one modifier, not full scene × audience grids). */
  for (const platform of SEEDS) {
    for (const scene of ["short-form", "daily"]) {
      tryAdd(
        seen,
        pool,
        `how to batch ${scene} ${platform} videos without losing quality`,
        `batch ${platform} videos`,
        `guide:batch-${scene}`
      );
    }
  }
}

/**
 * Single strategy: experience-recap guide topics only (no ideas-bank / listicle pool).
 */
export function generateTopics(options?: { count?: number }): GeneratedTopic[] {
  const want = Math.max(1, options?.count ?? 10);
  const seen = new Set<string>();
  const guidePool: GeneratedTopic[] = [];

  fillGuidePool(seen, guidePool);

  shuffleInPlace(guidePool);
  shuffleInPlace(guidePool);
  return guidePool.slice(0, Math.min(want, guidePool.length));
}

/** Debug: classify title prefix for SERP-style distribution logs. */
function getPrefixType(title: string): string {
  const t = title.toLowerCase();
  if (t.startsWith("best")) return "best";
  if (t.includes(" vs ")) return "vs";
  if (t.includes("example")) return "examples";
  if (t.startsWith("how to")) return "howto";
  return "other";
}

/**
 * Build 2+ theme clusters; each cluster has >=3 distinct guide topics on one spindle.
 * Order by {@link loadClusterPriorityState} (platform + kind rolling success, recent cluster totals, zero streaks).
 * Topics are demand-led first (search-data-engine), then legacy blueprint lines that pass the search-style gate.
 */
export async function generateTopicClusters(options?: {
  clusterCount?: number;
  topicsPerCluster?: number;
  priorityState?: ReturnType<typeof loadClusterPriorityState>;
  /** When false, templates only (no Google suggest). Default true. */
  fetchSearchSuggests?: boolean;
}): Promise<{ clusters: TopicCluster[]; priorityChoices: ClusterPriorityMeta[] }> {
  const wantClusters = Math.max(2, options?.clusterCount ?? 2);
  const wantPer = Math.max(3, options?.topicsPerCluster ?? 3);
  const state = options?.priorityState ?? loadClusterPriorityState();
  const blueprints = CLUSTER_BLUEPRINTS.map((b) => ({ ...b }));
  const ranked = orderBlueprintsByPriority(blueprints, state);
  const newFirst = ranked.filter((m) => NEW_EN_SPINDLE_CLUSTERS.has(m.cluster));
  const mid = ranked.filter(
    (m) => !NEW_EN_SPINDLE_CLUSTERS.has(m.cluster) && !EN_DEMOTED_HIGH_COLLISION_CLUSTERS.has(m.cluster)
  );
  const demotedLast = ranked.filter((m) => EN_DEMOTED_HIGH_COLLISION_CLUSTERS.has(m.cluster));
  const rankedOrdered = [...newFirst, ...mid, ...demotedLast];
  const out: TopicCluster[] = [];
  const priorityChoices: ClusterPriorityMeta[] = [];
  for (const m of rankedOrdered) {
    if (out.length >= wantClusters) break;
    const { topics: rawTopics, meta: rawMeta } = await buildClusterTopicsForClusterAsync(m.cluster, wantPer, {
      fetchSuggests: options?.fetchSearchSuggests !== false
    });
    const topics: string[] = [];
    const meta: NonNullable<TopicCluster["meta"]> = [];
    const seenTitles = new Set<string>();
    for (let i = 0; i < rawTopics.length; i++) {
      const t = normalizeSeoTitle(rawTopics[i]!.replace(/\s+/g, " ").trim());
      if (!isValidSeoTitle(t)) continue;
      const tk = t.toLowerCase();
      if (seenTitles.has(tk)) continue;
      if (!isAcceptableTopic(t)) continue;
      if (!isPreValidatedTitle(t)) continue;
      seenTitles.add(tk);
      topics.push(t);
      const row = rawMeta[i];
      meta.push(
        row ?? {
          keyword: t,
          intent: inferSearchDemandIntent(t)
        }
      );
      if (topics.length >= wantPer) break;
    }

    const expansionBaseCount = topics.length;
    const expandedQueue: string[] = [];
    for (const t0 of topics) {
      expandedQueue.push(...expandSeoKeywords(t0).slice(0, MAX_EXPANSION));
    }
    console.log("[SEO EXPANSION] base:", expansionBaseCount);
    console.log("[SEO EXPANSION] expanded:", expandedQueue.length);

    for (const raw of expandedQueue) {
      const t = normalizeSeoTitle(raw.replace(/\s+/g, " ").trim());
      if (!isValidSeoTitle(t)) continue;
      const tk = t.toLowerCase();
      if (seenTitles.has(tk)) continue;
      if (!isAcceptableTopic(t)) continue;
      if (!isPreValidatedTitle(t)) continue;
      seenTitles.add(tk);
      topics.push(t);
      meta.push({
        keyword: t,
        intent: inferSearchDemandIntent(t)
      });
    }

    const maxClusterTopics = wantPer * (1 + MAX_EXPANSION);
    if (topics.length >= 3) {
      out.push({
        cluster: m.cluster,
        topics: topics.slice(0, maxClusterTopics),
        meta: meta.slice(0, maxClusterTopics)
      });
      priorityChoices.push(m);
    }
  }

  const flatTitles = out.flatMap((c) => c.topics);
  const stats: Record<string, number> = {
    howto: 0,
    best: 0,
    vs: 0,
    examples: 0,
    other: 0
  };
  for (const title of flatTitles) {
    const key = getPrefixType(title);
    stats[key] = (stats[key] || 0) + 1;
  }
  console.log("[SEO TOPIC STATS]", stats);
  console.log("[SEO SAMPLE TITLES]", flatTitles.slice(0, 10));

  return { clusters: out, priorityChoices };
}

/** Flatten clusters into {@link GeneratedTopic} rows for the existing publish pipeline. */
export function clustersToGeneratedTopics(clusters: TopicCluster[]): GeneratedTopic[] {
  const rows: GeneratedTopic[] = [];
  for (const c of clusters) {
    c.topics.forEach((topic, ti) => {
      const m = c.meta?.[ti];
      rows.push({
        topic,
        keyword: m?.keyword ?? c.cluster.slice(0, 80),
        intent: m?.intent ?? inferSearchDemandIntent(topic),
        angle: `cluster:${c.cluster}:slot${ti + 1}`
      });
    });
  }
  return rows;
}

/** Minimum staged files written per EN cluster-publish tick (yield floor). */
export const MIN_FILES_PER_RUN = 12;

const INTENT_HINT = /\b(how|ideas|tips|guide|captions|hooks?|ways|strategy)\b/i;

/** V1: workflow / guide / checklist / step-by-step (distinct from V2). */
const MAINLINE_TITLE_DEDUP_V1_SUFFIXES = [
  "— checklist for small creators (2026)",
  "— step by step for part-time creators",
  "— workflow template for solo creators",
  "— practical action plan you can reuse"
];

/** V2: mistakes / examples / beginners / small business (different phrasing than V1). */
const MAINLINE_TITLE_DEDUP_V2_SUFFIXES = [
  "— mistakes to avoid and what to do instead",
  "— examples and strategy for beginners",
  "— for small business and service sellers",
  "— common mistakes with fixes (short)"
];

function rewriteMainlineTopicTitleForDedupInner(
  topic: string,
  suffixes: readonly string[],
  hashSalt: number
): string | null {
  const t = topic.replace(/\s+/g, " ").trim();
  if (t.length < 24 || t.length > 80) return null;
  let h = hashSalt >>> 0;
  for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0;
  const suf = suffixes[h % suffixes.length];
  const maxTotal = 80;
  const maxBase = Math.max(18, maxTotal - suf.length - 1);
  const base = t.length > maxBase ? t.slice(0, maxBase).replace(/\s+\S*$/, "").trim() || t.slice(0, maxBase).trim() : t;
  const out = `${base} ${suf}`.replace(/\s+/g, " ").trim();
  if (out.length < 18 || out.length > 80) return null;
  if (!INTENT_HINT.test(out)) return null;
  const words = out.split(/\s+/).filter(Boolean);
  if (words.length > 16) return null;
  if (out === t) return null;
  return out;
}

/**
 * Mainline dedup rewrite variant 1 (workflow / guide style). Original → v1 → v2 order in pipeline.
 */
export function rewriteMainlineTopicTitleForDedupV1(topic: string): string | null {
  return rewriteMainlineTopicTitleForDedupInner(topic, MAINLINE_TITLE_DEDUP_V1_SUFFIXES, 0);
}

/**
 * Mainline dedup rewrite variant 2 (mistakes / examples / beginners / small business).
 */
export function rewriteMainlineTopicTitleForDedupV2(topic: string): string | null {
  return rewriteMainlineTopicTitleForDedupInner(topic, MAINLINE_TITLE_DEDUP_V2_SUFFIXES, 7919);
}
