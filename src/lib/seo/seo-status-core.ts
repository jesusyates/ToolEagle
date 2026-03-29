/**
 * V164–V165 — Shared SEO status + flywheel ramp writer (Node fs; used by `scripts/seo-status.ts` and tests).
 */

import fs from "fs";
import path from "path";
import {
  computeSeoFlywheelRampArtifact,
  type SeoFlywheelRampJson
} from "@/lib/seo/flywheel-ramp";
import { buildAndWriteRetrievalDataset, getRetrievalDatasetReadyMin } from "@/lib/seo/retrieval-dataset-build";
import {
  type SeoRetrievalUtilizationJson,
  utilizationSliceFromPayload,
  writeSeoRetrievalUtilizationSummary
} from "@/lib/seo/retrieval-utilization-summary";
import {
  type SeoRetrievalActivationJson,
  writeRetrievalActivationArtifact
} from "@/lib/seo/retrieval-activation-artifact";

function readJson<T>(p: string, fb: T): T {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as T;
  } catch {
    return fb;
  }
}

function normalizeHqList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && Array.isArray((raw as { items?: unknown[] }).items)) {
    return (raw as { items: unknown[] }).items;
  }
  if (raw && typeof raw === "object" && Array.isArray((raw as { assets?: unknown[] }).assets)) {
    return (raw as { assets: unknown[] }).assets;
  }
  return [];
}

function countHqAssets(cwd: string): number {
  const p = path.join(cwd, "generated", "agent_high_quality_assets.json");
  return normalizeHqList(readJson<unknown>(p, [])).length;
}

function writeJson(p: string, data: unknown) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
}

export type SeoStatusResult = {
  lines: string[];
  exitCode: number;
  flywheel: SeoFlywheelRampJson;
  retrievalUtilization: SeoRetrievalUtilizationJson;
  retrievalActivation: SeoRetrievalActivationJson;
};

export function buildFlywheelRampForWorkspace(cwd: string, now: Date): {
  flywheel: SeoFlywheelRampJson;
  retrievalUtilization: SeoRetrievalUtilizationJson;
  retrievalActivation: SeoRetrievalActivationJson;
} {
  const gen = path.join(cwd, "generated");
  const hqCount = countHqAssets(cwd);
  const ds = buildAndWriteRetrievalDataset(cwd, now);
  const retrievalDatasetCount = ds.itemCount;
  const retrievalDatasetLastBuiltAt = ds.builtAt;
  const retrievalDatasetThreshold = getRetrievalDatasetReadyMin();
  const utilizationPayload = writeSeoRetrievalUtilizationSummary(cwd, now);
  const utilizationWindow = utilizationSliceFromPayload(utilizationPayload);
  const retrievalStats = readJson<{
    retrieval_count?: number;
    ai_generation_count?: number;
    retrieval_share?: number;
  }>(path.join(gen, "seo-retrieval-stats.json"), {
    retrieval_count: 0,
    ai_generation_count: 0,
    retrieval_share: 0
  });
  const prevRamp = readJson<Partial<SeoFlywheelRampJson> | null>(
    path.join(gen, "seo-flywheel-ramp.json"),
    null
  );
  const activationPath = path.join(gen, "seo-flywheel-activation.json");
  let activation = readJson<{ activated_at?: string } | null>(activationPath, null);
  const rCount = Number(retrievalStats.retrieval_count) || 0;
  const aCount = Number(retrievalStats.ai_generation_count) || 0;
  const shouldActivate = hqCount > 0 || rCount > 0;
  if (shouldActivate && (!activation || !activation.activated_at)) {
    activation = { activated_at: now.toISOString() };
    writeJson(activationPath, activation);
  }
  const activationIso = activation?.activated_at ?? null;

  const artifact = computeSeoFlywheelRampArtifact(
    {
      hqAssetCount: hqCount,
      retrievalDatasetCount,
      retrievalDatasetLastBuiltAt,
      retrievalDatasetThreshold,
      retrievalCount: rCount,
      aiGenerationCount: aCount,
      previousRetrievalShare:
        prevRamp && typeof prevRamp.retrieval_share === "number" ? prevRamp.retrieval_share : null,
      activationIso,
      now,
      utilizationWindow
    },
    retrievalStats.retrieval_share
  );

  writeJson(path.join(gen, "seo-flywheel-ramp.json"), artifact);
  const retrievalActivation = writeRetrievalActivationArtifact(cwd, now);
  return { flywheel: artifact, retrievalUtilization: utilizationPayload, retrievalActivation };
}

export function runSeoStatus(cwd: string, now = new Date()): SeoStatusResult {
  const gen = path.join(cwd, "generated");
  const heartbeat = readJson<Record<string, unknown> | null>(path.join(gen, "seo-run-heartbeat.json"), null);
  const alerts = readJson<{ alerts?: unknown[] }>(path.join(gen, "seo-alerts.json"), { alerts: [] });
  const risk = readJson<Record<string, unknown> | null>(path.join(gen, "seo-risk-summary.json"), null);
  const critical = readJson<Record<string, unknown> | null>(path.join(gen, "seo-critical-state.json"), null);
  const metrics = readJson<Record<string, unknown> | null>(path.join(gen, "seo-real-metrics.json"), null);
  const retrievalStats = readJson<Record<string, unknown> | null>(
    path.join(gen, "seo-retrieval-stats.json"),
    null
  );

  const { flywheel, retrievalUtilization: utilizationPayload, retrievalActivation } =
    buildFlywheelRampForWorkspace(cwd, now);

  const tNow = now.getTime();
  let hoursSince: number | null = null;
  if (heartbeat?.last_run_at) {
    hoursSince = (tNow - new Date(String(heartbeat.last_run_at)).getTime()) / 3600000;
  }

  const stalled =
    !heartbeat ||
    hoursSince === null ||
    hoursSince > 24 ||
    critical?.critical === true ||
    (alerts.alerts || []).some((a) => (a as { type?: string }).type === "llm_missing") ||
    (alerts.alerts || []).some((a) => (a as { type?: string }).type === "missed_run");

  const state = stalled ? "STALLED" : "ACTIVE";

  const lines: string[] = [];
  lines.push("=== ToolEagle SEO status (V166.1) ===");
  lines.push(`System: ${state}`);
  lines.push(`Last run: ${heartbeat?.last_run_at ?? "(no heartbeat)"}`);
  lines.push(
    `Last success: ${heartbeat?.success === true ? "yes" : heartbeat?.success === false ? "no" : "unknown"}`
  );
  lines.push(`ZH generated (last run): ${String(heartbeat?.zh_generated ?? "—")}`);
  lines.push(`EN generated (last run): ${String(heartbeat?.en_generated ?? "—")}`);
  lines.push(`Stop reason: ${String(heartbeat?.stop_reason ?? "—")}`);
  if (hoursSince != null) lines.push(`Hours since last run: ${Math.round(hoursSince * 10) / 10}`);
  lines.push(`Risk level: ${String(risk?.risk_level ?? "(no seo-risk-summary.json)")}`);
  lines.push(`Risk score: ${String(risk?.risk_score ?? "—")}`);
  lines.push(
    `Alerts: ${(alerts.alerts || []).length ? JSON.stringify(alerts.alerts) : "none"}`
  );
  lines.push(`Critical file: ${critical?.critical === true ? JSON.stringify(critical) : "ok"}`);
  if (metrics) {
    lines.push(
      `Real metrics — pages/run: ${String(metrics.daily_generated_pages)}, retrieval_share: ${String(metrics.retrieval_share)}, success_rate_7d: ${String(metrics.run_success_rate)}`
    );
  }
  if (retrievalStats) {
    lines.push(
      `Retrieval stats — R:${String(retrievalStats.retrieval_count)} AI:${String(retrievalStats.ai_generation_count)} share:${String(retrievalStats.retrieval_share)}`
    );
  }
  lines.push(
    `Retrieval dataset — built: yes, rows: ${flywheel.current_retrieval_dataset_count}, last_built: ${flywheel.retrieval_dataset_last_built_at ?? "—"}, eligible: ${flywheel.retrieval_dataset_ready ? "yes" : "no"} (threshold ${flywheel.retrieval_dataset_threshold})`
  );
  const windowShareStr =
    utilizationPayload.retrieval_hits + utilizationPayload.retrieval_fallbacks > 0
      ? String(utilizationPayload.retrieval_share)
      : "n/a";
  lines.push(
    `Retrieval utilization — window hits: ${flywheel.retrieval_hits_window}, window fallbacks: ${flywheel.retrieval_fallbacks_window}, window_share: ${windowShareStr}, prod_share: ${utilizationPayload.production_retrieval_share}, top_fallback: ${flywheel.fallback_top_reason ?? "n/a"}, sample_topic: ${flywheel.top_retrieval_topic_sample ?? "n/a"}`
  );
  lines.push(`Retrieval utilization artifact: generated/seo-retrieval-utilization.json`);
  const actReady = retrievalActivation.retrieval_activation_ready ? "yes" : "no";
  const actBlocker = retrievalActivation.top_blockers[0] ?? "none";
  const cov = retrievalActivation.workflow_bucket_coverage;
  const covStr = `tiktok=${cov.tiktok ?? 0} youtube=${cov.youtube ?? 0} instagram=${cov.instagram ?? 0}`;
  lines.push(
    `Retrieval activation — ready: ${actReady}, top_blocker: ${actBlocker}, workflow_coverage: ${covStr}`
  );
  lines.push(`Retrieval activation artifact: generated/seo-retrieval-activation.json`);
  lines.push(
    `Flywheel — HQ assets: ${flywheel.current_high_quality_asset_count}, retrieval_share: ${flywheel.retrieval_share}, ai_share: ${flywheel.ai_share}, state: ${flywheel.flywheel_state}, pool_ready: ${flywheel.asset_pool_ready}, ramping: ${flywheel.retrieval_ramping}, active: ${flywheel.flywheel_active}, dataset_ready: ${flywheel.retrieval_dataset_ready}`
  );
  lines.push(`Flywheel artifact: generated/seo-flywheel-ramp.json (updated ${flywheel.updatedAt})`);
  lines.push("=====================================");

  return {
    lines,
    exitCode: stalled ? 1 : 0,
    flywheel,
    retrievalUtilization: utilizationPayload,
    retrievalActivation
  };
}
