/**
 * V164–V165 — SEO retrieval flywheel ramp summary (pure logic + thresholds).
 */

import { getRetrievalDatasetReadyMin } from "@/lib/seo/retrieval-dataset-build";

export const ASSET_POOL_READY_THRESHOLD = 50;

export type SeoFlywheelRampJson = {
  updatedAt: string;
  current_high_quality_asset_count: number;
  current_retrieval_dataset_count: number;
  retrieval_share: number;
  ai_share: number;
  days_since_activation: number | null;
  retrieval_ready: boolean;
  retrieval_dataset_ready: boolean;
  retrieval_dataset_threshold: number;
  retrieval_dataset_last_built_at: string | null;
  /** V166 — from `seo-retrieval-events.jsonl` window (see seo-retrieval-utilization.json). */
  retrieval_hits_window: number;
  retrieval_fallbacks_window: number;
  fallback_top_reason: string | null;
  top_retrieval_topic_sample: string | null;
  asset_pool_ready: boolean;
  retrieval_ramping: boolean;
  flywheel_active: boolean;
  flywheel_state: "cold" | "warming" | "ramping" | "active";
  notes: string;
};

export type FlywheelUtilizationWindow = {
  retrieval_hits_window: number;
  retrieval_fallbacks_window: number;
  fallback_top_reason: string | null;
  top_retrieval_topic_sample: string | null;
};

export type FlywheelRampComputationInput = {
  hqAssetCount: number;
  retrievalDatasetCount: number;
  retrievalDatasetLastBuiltAt: string | null;
  retrievalDatasetThreshold: number;
  retrievalCount: number;
  aiGenerationCount: number;
  /** Previous `retrieval_share` from last `seo-flywheel-ramp.json` (0–1). */
  previousRetrievalShare: number | null;
  /** ISO date string when flywheel was first considered activated; null if not yet set. */
  activationIso: string | null;
  now: Date;
  /** V166 — optional slice from retrieval utilization summary. */
  utilizationWindow?: FlywheelUtilizationWindow | null;
};

function clamp01(n: number): number {
  if (Number.isNaN(n) || n < 0) return 0;
  if (n > 1) return 1;
  return Math.round(n * 1000) / 1000;
}

export function computeRetrievalAndAiShare(
  retrievalCount: number,
  aiGenerationCount: number
): { retrieval_share: number; ai_share: number } {
  const r = Math.max(0, Number(retrievalCount) || 0);
  const a = Math.max(0, Number(aiGenerationCount) || 0);
  const t = r + a;
  if (t === 0) return { retrieval_share: 0, ai_share: 0 };
  return {
    retrieval_share: clamp01(r / t),
    ai_share: clamp01(a / t)
  };
}

export function computeFlywheelFlags(input: {
  hqAssetCount: number;
  retrieval_share: number;
  retrievalCount: number;
  previousRetrievalShare: number | null;
  retrievalDatasetCount: number;
  retrievalDatasetThreshold: number;
}): {
  asset_pool_ready: boolean;
  retrieval_ramping: boolean;
  flywheel_active: boolean;
  retrieval_ready: boolean;
  retrieval_dataset_ready: boolean;
  flywheel_state: SeoFlywheelRampJson["flywheel_state"];
} {
  const hq = Math.max(0, input.hqAssetCount);
  const ds = Math.max(0, input.retrievalDatasetCount);
  const th = Math.max(1, input.retrievalDatasetThreshold);
  const asset_pool_ready = hq > ASSET_POOL_READY_THRESHOLD;
  const retrieval_dataset_ready = ds >= th;
  /** V165 — readiness for retrieval-first path follows persisted dataset size. */
  const retrieval_ready = retrieval_dataset_ready;
  const retrieval_ramping =
    input.retrieval_share > 0 &&
    input.previousRetrievalShare !== null &&
    input.retrieval_share > input.previousRetrievalShare;
  const retrieval_usage_visible = input.retrieval_share > 0 || input.retrievalCount > 0;
  const asset_accumulation_visible = hq >= 1;
  const flywheel_active = asset_accumulation_visible && retrieval_usage_visible;

  let flywheel_state: SeoFlywheelRampJson["flywheel_state"] = "cold";
  if (flywheel_active) flywheel_state = "active";
  else if (retrieval_ramping) flywheel_state = "ramping";
  else if (asset_accumulation_visible || retrieval_dataset_ready) flywheel_state = "warming";

  return {
    asset_pool_ready,
    retrieval_ramping,
    flywheel_active,
    retrieval_ready,
    retrieval_dataset_ready,
    flywheel_state
  };
}

export function daysSinceActivation(activationIso: string | null, now: Date): number | null {
  if (!activationIso) return null;
  const t = new Date(activationIso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((now.getTime() - t) / 86400000));
}

/**
 * Prefer counts-derived share; if totals are zero but persisted share given, use persisted (telemetry rounding).
 */
export function computeSeoFlywheelRampArtifact(
  input: FlywheelRampComputationInput,
  persistedRetrievalShare?: number | null
): SeoFlywheelRampJson {
  const { retrieval_share: rs, ai_share: as } = computeRetrievalAndAiShare(
    input.retrievalCount,
    input.aiGenerationCount
  );
  const totalGen = input.retrievalCount + input.aiGenerationCount;
  const retrieval_share =
    totalGen === 0 && persistedRetrievalShare != null && persistedRetrievalShare > 0
      ? clamp01(persistedRetrievalShare)
      : rs;
  const ai_share =
    totalGen === 0 && persistedRetrievalShare != null && persistedRetrievalShare > 0
      ? clamp01(1 - persistedRetrievalShare)
      : as;

  const threshold =
    input.retrievalDatasetThreshold > 0 ? input.retrievalDatasetThreshold : getRetrievalDatasetReadyMin();

  const flags = computeFlywheelFlags({
    hqAssetCount: input.hqAssetCount,
    retrieval_share,
    retrievalCount: input.retrievalCount,
    previousRetrievalShare: input.previousRetrievalShare,
    retrievalDatasetCount: input.retrievalDatasetCount,
    retrievalDatasetThreshold: threshold
  });

  const days_since_activation = daysSinceActivation(input.activationIso, input.now);

  const uw = input.utilizationWindow;
  const hitsW = uw?.retrieval_hits_window ?? 0;
  const fbW = uw?.retrieval_fallbacks_window ?? 0;
  const topR = uw?.fallback_top_reason ?? null;
  const topTopic = uw?.top_retrieval_topic_sample ?? null;

  const notes = [
    `HQ assets: ${input.hqAssetCount}; retrieval dataset rows: ${input.retrievalDatasetCount} (threshold ${threshold}); gen R:${input.retrievalCount} AI:${input.aiGenerationCount}`,
    hitsW + fbW > 0
      ? `Utilization window: ${hitsW} retrieval hits, ${fbW} fallbacks; top fallback: ${topR ?? "n/a"}; sample topic: ${topTopic ?? "n/a"}.`
      : "Utilization window: no retrieval events logged yet (V166 jsonl).",
    flags.retrieval_dataset_ready
      ? "Retrieval dataset ready for retrieval-first gating."
      : `Retrieval dataset below ${threshold} rows — run build-retrieval-dataset / seo:status.`,
    flags.asset_pool_ready
      ? "Asset pool past readiness threshold."
      : `Asset pool below ${ASSET_POOL_READY_THRESHOLD} HQ entries.`,
    flags.retrieval_ramping ? "Retrieval share trending up vs last snapshot." : "Retrieval share not rising vs last snapshot (or zero)."
  ].join(" ");

  return {
    updatedAt: input.now.toISOString(),
    current_high_quality_asset_count: input.hqAssetCount,
    current_retrieval_dataset_count: input.retrievalDatasetCount,
    retrieval_share,
    ai_share,
    days_since_activation,
    retrieval_ready: flags.retrieval_ready,
    retrieval_dataset_ready: flags.retrieval_dataset_ready,
    retrieval_dataset_threshold: threshold,
    retrieval_dataset_last_built_at: input.retrievalDatasetLastBuiltAt,
    retrieval_hits_window: hitsW,
    retrieval_fallbacks_window: fbW,
    fallback_top_reason: topR,
    top_retrieval_topic_sample: topTopic,
    asset_pool_ready: flags.asset_pool_ready,
    retrieval_ramping: flags.retrieval_ramping,
    flywheel_active: flags.flywheel_active,
    flywheel_state: flags.flywheel_state,
    notes
  };
}
