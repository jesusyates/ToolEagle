import fs from "node:fs";
import path from "node:path";
import { inferClusterTopicKind, type ClusterTopicKind } from "./cluster-topic-blueprint";

const STATE_FILE = "generated/cluster-priority-state.json";

export type ClusterPriorityStateV1 = {
  version: 1;
  clusters: Record<
    string,
    {
      articlesPassedTotal: number;
      consecutiveZeroRuns: number;
    }
  >;
  platforms: Record<string, { passed: number; runs: number }>;
  kinds: Partial<Record<ClusterTopicKind, { passed: number; runs: number }>>;
};

export type ClusterPriorityMeta = {
  cluster: string;
  score: number;
  reason: string;
};

function defaultState(): ClusterPriorityStateV1 {
  return { version: 1, clusters: {}, platforms: {}, kinds: {} };
}

function statePath(): string {
  return path.join(process.cwd(), STATE_FILE);
}

export function loadClusterPriorityState(): ClusterPriorityStateV1 {
  try {
    const raw = fs.readFileSync(statePath(), "utf8");
    const j = JSON.parse(raw) as ClusterPriorityStateV1;
    if (j?.version !== 1 || typeof j.clusters !== "object") return defaultState();
    return {
      version: 1,
      clusters: j.clusters ?? {},
      platforms: j.platforms ?? {},
      kinds: j.kinds ?? {}
    };
  } catch {
    return defaultState();
  }
}

export function inferPlatformKey(cluster: string): string {
  const s = cluster.toLowerCase();
  if (/\bcross[- ]platform\b/i.test(s)) return "cross";
  if (/\btiktok\b/i.test(s)) return "tiktok";
  if (/\binstagram\b/i.test(s)) return "instagram";
  if (/\byoutube\b/i.test(s)) return "youtube";
  return "tiktok";
}

function platformSuccessBonus(platformKey: string, state: ClusterPriorityStateV1): { bonus: number; label: string } {
  const p = state.platforms[platformKey] ?? { passed: 0, runs: 0 };
  const rate = p.runs > 0 ? p.passed / p.runs : 0.5;
  return { bonus: Math.round(rate * 22), label: `${platformKey}_rate=${(rate * 100).toFixed(0)}%` };
}

function kindSuccessBonus(kind: ClusterTopicKind, state: ClusterPriorityStateV1): { bonus: number; label: string } {
  const k = state.kinds[kind] ?? { passed: 0, runs: 0 };
  const rate = k.runs > 0 ? k.passed / k.runs : 0.5;
  return { bonus: Math.round(rate * 16), label: `kind_${kind}_rate=${(rate * 100).toFixed(0)}%` };
}

/**
 * Higher score = pick earlier. Uses recent articles passed, consecutive zero runs, platform/kind rolling rates.
 */
export function scoreClusterForPriority(cluster: string, state: ClusterPriorityStateV1): ClusterPriorityMeta {
  const kind = inferClusterTopicKind(cluster);
  const row = state.clusters[cluster] ?? { articlesPassedTotal: 0, consecutiveZeroRuns: 0 };
  const pk = inferPlatformKey(cluster);
  const plat = platformSuccessBonus(pk, state);
  const kd = kindSuccessBonus(kind, state);

  let score = 100;
  const parts: string[] = ["base=100"];

  const totalBoost = row.articlesPassedTotal * 12;
  score += totalBoost;
  if (totalBoost) parts.push(`cluster_articles_total+${totalBoost}`);

  const zeroPenalty = row.consecutiveZeroRuns * 20;
  score -= zeroPenalty;
  if (zeroPenalty) parts.push(`consecutive_zero_runs-${zeroPenalty}`);

  score += plat.bonus;
  parts.push(plat.label);

  score += kd.bonus;
  parts.push(kd.label);

  score += Math.random() * 6;
  parts.push("jitter");

  return { cluster, score, reason: parts.join("; ") };
}

export type ClusterBlueprint = { cluster: string };

/**
 * Stable weighted order: sort by score descending, then take first N.
 */
export function orderBlueprintsByPriority(blueprints: ClusterBlueprint[], state: ClusterPriorityStateV1): ClusterPriorityMeta[] {
  const scored = blueprints.map((b) => scoreClusterForPriority(b.cluster, state));
  scored.sort((a, b) => b.score - a.score);
  return scored;
}

export type RunOutcomeRow = {
  cluster: string;
  articlesPassed: number;
};

/**
 * Persist rolling stats for next run (simple JSON, no DB).
 */
export function recordClusterRunOutcome(rows: RunOutcomeRow[]): void {
  const state = loadClusterPriorityState();
  for (const r of rows) {
    const prev = state.clusters[r.cluster] ?? { articlesPassedTotal: 0, consecutiveZeroRuns: 0 };
    state.clusters[r.cluster] = {
      articlesPassedTotal: prev.articlesPassedTotal + r.articlesPassed,
      consecutiveZeroRuns: r.articlesPassed === 0 ? prev.consecutiveZeroRuns + 1 : 0
    };
    const kind = inferClusterTopicKind(r.cluster);
    const pk = inferPlatformKey(r.cluster);
    const plat = state.platforms[pk] ?? { passed: 0, runs: 0 };
    state.platforms[pk] = {
      passed: plat.passed + r.articlesPassed,
      runs: plat.runs + 1
    };
    const kr = state.kinds[kind] ?? { passed: 0, runs: 0 };
    state.kinds[kind] = {
      passed: kr.passed + r.articlesPassed,
      runs: kr.runs + 1
    };
  }
  const dir = path.dirname(statePath());
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(statePath(), JSON.stringify(state, null, 2), "utf8");
}
