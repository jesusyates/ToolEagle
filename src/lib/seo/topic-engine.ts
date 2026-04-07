import { buildClusterTopicsForCluster } from "./cluster-topic-blueprint";
import {
  loadClusterPriorityState,
  orderBlueprintsByPriority,
  type ClusterPriorityMeta
} from "./cluster-priority";

export { inferClusterTopicKind, type ClusterTopicKind, buildClusterTopicsForCluster } from "./cluster-topic-blueprint";
export { loadClusterPriorityState, recordClusterRunOutcome } from "./cluster-priority";
export type { ClusterPriorityMeta } from "./cluster-priority";

const SEEDS = ["tiktok", "instagram", "youtube"];
const SCENES = ["morning routine", "gym", "coffee", "skincare", "outfit"];
const AUDIENCE = ["beginners", "girls", "creators", "small business"];
const FORMAT = ["ideas", "tips", "captions", "hooks"];

/** Guide-oriented audiences (read naturally after “as …”). */
const GUIDE_AUDIENCES = ["beginners", "new creators", "small creators", "part-time creators"];

const CREATOR_TYPES = ["small business owners", "beauty creators", "fitness creators", "faceless creators"];
const SEASONS = ["in spring", "in summer", "for 2026", "this month"];
const OUTPUT_TYPES = ["content ideas", "caption ideas", "hook ideas", "post ideas"];

const GUIDE_MIN_SHARE = 0.6;

export type GeneratedTopic = {
  topic: string;
  keyword: string;
  angle: string;
};

/** Pillar cluster: one theme + multiple distinct guide angles (not title tweaks). */
export type TopicCluster = {
  cluster: string;
  topics: string[];
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
  if (s.length < 42) return false;
  const words = s.split(" ").filter(Boolean);
  if (words.length < 7) return false;
  if (/^(tiktok|instagram|youtube)\s+(tiktok|instagram|youtube)\b/i.test(s)) return false;
  return true;
}

function tryAdd(
  seen: Set<string>,
  pool: GeneratedTopic[],
  topic: string,
  keyword: string,
  angle: string
): void {
  const key = topic.toLowerCase().replace(/\s+/g, " ").trim();
  if (seen.has(key)) return;
  if (!isAcceptableTopic(topic)) return;
  seen.add(key);
  pool.push({ topic, keyword, angle });
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

function fillIdeasPool(seen: Set<string>, pool: GeneratedTopic[]): void {
  for (const platform of SEEDS) {
    for (const scene of SCENES) {
      for (const audience of AUDIENCE) {
        for (const format of FORMAT) {
          if (format === "tips") continue;
          const topic = `${platform} ${scene} ${format} for ${audience}`;
          tryAdd(seen, pool, topic, `${platform} ${scene} ${format}`, `ideas:format:${format}`);
        }
      }
    }
  }

  for (const platform of SEEDS) {
    for (const scene of SCENES) {
      for (const outputType of OUTPUT_TYPES) {
        for (const audience of AUDIENCE) {
          tryAdd(
            seen,
            pool,
            `${platform} ${scene} ${outputType} for ${audience}`,
            `${platform} ${scene} ${outputType}`,
            "ideas:template-a"
          );
        }
        for (const creatorType of CREATOR_TYPES) {
          tryAdd(
            seen,
            pool,
            `${platform} ${scene} ${outputType} for ${creatorType}`,
            `${platform} ${scene} ${outputType}`,
            "ideas:template-b"
          );
        }
      }
    }
  }

  for (const season of SEASONS) {
    for (const platform of SEEDS) {
      for (const scene of SCENES) {
        for (const outputType of OUTPUT_TYPES) {
          tryAdd(
            seen,
            pool,
            `${season} ${platform} ${scene} ${outputType}`,
            `${platform} ${scene} ${outputType}`,
            "ideas:seasonal"
          );
        }
      }
    }
  }
}

/**
 * Guide-priority mix (~60%+ guide templates), then ideas lists.
 */
export function generateTopics(options?: { count?: number }): GeneratedTopic[] {
  const want = Math.max(1, options?.count ?? 10);
  const seen = new Set<string>();
  const guidePool: GeneratedTopic[] = [];
  const ideasPool: GeneratedTopic[] = [];

  fillGuidePool(seen, guidePool);
  fillIdeasPool(seen, ideasPool);

  shuffleInPlace(guidePool);
  shuffleInPlace(ideasPool);

  const targetGuide = Math.ceil(want * GUIDE_MIN_SHARE);
  const tg = Math.min(targetGuide, guidePool.length);
  const out: GeneratedTopic[] = [];
  out.push(...guidePool.slice(0, tg));

  let need = want - out.length;
  const ti = Math.min(need, ideasPool.length);
  out.push(...ideasPool.slice(0, ti));

  need = want - out.length;
  out.push(...guidePool.slice(tg, tg + need));

  need = want - out.length;
  out.push(...ideasPool.slice(ti, ti + need));

  shuffleInPlace(out);
  return out.slice(0, Math.min(want, out.length));
}

/**
 * Build 2+ theme clusters; each cluster has >=3 distinct guide topics on one spindle.
 * Order by {@link loadClusterPriorityState} (platform + kind rolling success, recent cluster totals, zero streaks).
 */
export function generateTopicClusters(options?: {
  clusterCount?: number;
  topicsPerCluster?: number;
  priorityState?: ReturnType<typeof loadClusterPriorityState>;
}): { clusters: TopicCluster[]; priorityChoices: ClusterPriorityMeta[] } {
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
    const raw = buildClusterTopicsForCluster(m.cluster, wantPer);
    const topics = raw.map((t) => t.replace(/\s+/g, " ").trim()).filter((t) => isAcceptableTopic(t));
    if (topics.length >= 3) {
      out.push({ cluster: m.cluster, topics: topics.slice(0, wantPer) });
      priorityChoices.push(m);
    }
  }
  return { clusters: out, priorityChoices };
}

/** Flatten clusters into {@link GeneratedTopic} rows for the existing publish pipeline. */
export function clustersToGeneratedTopics(clusters: TopicCluster[]): GeneratedTopic[] {
  const rows: GeneratedTopic[] = [];
  for (const c of clusters) {
    c.topics.forEach((topic, ti) => {
      rows.push({
        topic,
        keyword: c.cluster.slice(0, 80),
        angle: `cluster:${c.cluster}:slot${ti + 1}`
      });
    });
  }
  return rows;
}

/** Minimum staged files written per EN cluster-publish tick (yield floor; pipeline may add fallbacks). */
export const MIN_FILES_PER_RUN = 12;

export function computeMinYieldFallbackNeed(stagedFilesWrittenThisRun: number): number {
  const filesWritten = stagedFilesWrittenThisRun || 0;
  return Math.max(0, MIN_FILES_PER_RUN - filesWritten);
}

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
