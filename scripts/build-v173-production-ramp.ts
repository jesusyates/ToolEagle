#!/usr/bin/env npx tsx
/**
 * V173 — Production ramp control artifacts (ops report, degradation summary, topic table, ramp weights, cost efficiency).
 */

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const EVENTS = path.join(ROOT, "logs", "v173-generation-events.jsonl");
const DEG_STATE = path.join(ROOT, "generated", "v173-degradation-state.json");
const HQS = path.join(ROOT, "generated", "high-quality-signals.json");
const DAILY = path.join(ROOT, "logs", "daily-report.json");

const OUT_OPS = path.join(ROOT, "generated", "v173-generation-ops.json");
const OUT_DEG = path.join(ROOT, "generated", "v173-degradation-report.json");
const OUT_TOPIC = path.join(ROOT, "generated", "topic-production-control.json");
const OUT_RAMP = path.join(ROOT, "generated", "v173-ramp-allocation.json");
const OUT_COST = path.join(ROOT, "generated", "v173-cost-efficiency.json");

type Ev = Record<string, unknown> & {
  ts?: string;
  source?: string;
  outcome?: string;
  route?: string;
  topic_preview?: string;
  topic_fp?: string;
  package_count?: number;
  retrieval_used?: boolean;
  heuristic_fill?: boolean;
  via_relaxed_salvage?: boolean;
  strict_effective?: boolean;
};

function readJson<T>(p: string): T | null {
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8")) as T;
  } catch {
    return null;
  }
}

function readEvents(): Ev[] {
  if (!fs.existsSync(EVENTS)) return [];
  const out: Ev[] = [];
  for (const line of fs.readFileSync(EVENTS, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line) as Ev);
    } catch {
      /* skip */
    }
  }
  return out;
}

function topKeys(map: Map<string, number>, n: number): { key: string; count: number }[] {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, count]) => ({ key, count }));
}

function main() {
  const events = readEvents();
  const pkg = events.filter((e) => e.source === "generate_package");
  const blog = events.filter((e) => e.source === "blog_seo");

  const success = pkg.filter((e) => e.outcome === "success");
  const pregen = pkg.filter((e) => e.outcome === "pregen_block").length;
  const dedup = pkg.filter((e) => e.outcome === "dedup_block").length;
  const strict503 = pkg.filter((e) => e.outcome === "strict_503").length;
  const routerErr = pkg.filter((e) => e.outcome === "router_error").length;
  const relaxedStill = pkg.filter((e) => e.outcome === "relaxed_once_still_failed").length;
  const legacyFallback =
    pkg.filter((e) => e.outcome === "success" && e.heuristic_fill === true).length +
    pkg.filter((e) => e.outcome === "success" && e.via_relaxed_salvage === true).length;

  const pkgCounts = success.map((e) => Number(e.package_count) || 0).filter((n) => n > 0);
  const avgExamples =
    pkgCounts.length > 0 ? pkgCounts.reduce((a, b) => a + b, 0) / pkgCounts.length : 0;
  const retOk = success.filter((e) => e.retrieval_used === true).length;
  const retrievalRate = success.length > 0 ? retOk / success.length : 0;

  const blockedTopics = new Map<string, number>();
  for (const e of pkg) {
    if (e.outcome === "pregen_block" || e.outcome === "dedup_block") {
      const k = String(e.topic_preview || e.topic_fp || "unknown").slice(0, 80);
      blockedTopics.set(k, (blockedTopics.get(k) ?? 0) + 1);
    }
  }

  const failedRoutes = new Map<string, number>();
  for (const e of pkg) {
    if (e.outcome === "strict_503" || e.outcome === "router_error") {
      const r = String(e.route || "unknown");
      failedRoutes.set(r, (failedRoutes.get(r) ?? 0) + 1);
    }
  }

  const blogSuccess = blog.filter((e) => e.outcome === "success").length;
  const blogReject = blog.filter((e) => e.outcome === "blog_reject").length;
  const blogPregenSkip = blog.filter((e) => e.outcome === "blog_skip_v172_pregen").length;
  const blogDedupSkip = blog.filter((e) => e.outcome === "blog_skip_v172_dedup").length;

  const totalRequests = pkg.length + blog.length;
  const successCount = success.length + blogSuccess;

  const ops = {
    version: "173",
    builtAt: new Date().toISOString(),
    window_note: "All events in logs/v173-generation-events.jsonl (rotate externally if needed).",
    total_requests: totalRequests,
    success_count: successCount,
    post_package: {
      total: pkg.length,
      success: success.length,
      pregen_block_count: pregen,
      dedup_block_count: dedup,
      strict_503_count: strict503,
      router_error_count: routerErr,
      relaxed_once_still_failed: relaxedStill,
      legacy_fallback_mode_count: legacyFallback,
      avg_examples_generated: Math.round(avgExamples * 1000) / 1000,
      retrieval_used_rate: Math.round(retrievalRate * 1000) / 1000
    },
    blog_seo: {
      total: blog.length,
      success: blogSuccess,
      reject: blogReject,
      skip_pregen: blogPregenSkip,
      skip_dedup: blogDedupSkip
    },
    top_blocked_topics: topKeys(blockedTopics, 15),
    top_failed_routes: topKeys(failedRoutes, 15),
    daily_engine_touch: fs.existsSync(DAILY)
      ? { path: "logs/daily-report.json", present: true }
      : { path: "logs/daily-report.json", present: false }
  };

  const degState = readJson<{ strict_fail_streak?: Record<string, number> }>(DEG_STATE);
  const streaks = degState?.strict_fail_streak ?? {};
  const streakList = Object.entries(streaks)
    .map(([key, n]) => ({ key, streak: n }))
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 40);
  const th = parseInt(process.env.V173_RELAX_STREAK_THRESHOLD ?? "3", 10) || 3;

  const degReport = {
    version: "173",
    builtAt: new Date().toISOString(),
    relax_streak_threshold: th,
    strict_fail_streak_keys: streakList.length,
    top_streaks: streakList,
    events_last_window: {
      strict_503: strict503,
      router_error: routerErr,
      relaxed_salvage_success: pkg.filter((e) => e.outcome === "success" && e.via_relaxed_salvage === true).length,
      relaxed_salvage_failed: relaxedStill
    },
    state_path: "generated/v173-degradation-state.json"
  };

  const hqs = readJson<{
    topic_demote?: string[];
    min_pregen_score?: number;
    generation_strict?: boolean;
  }>(HQS);

  const fpStats = new Map<string, { ok: number; bad: number; preview?: string }>();
  for (const e of pkg) {
    const fp = String(e.topic_fp || "");
    if (!fp) continue;
    if (!fpStats.has(fp)) fpStats.set(fp, { ok: 0, bad: 0, preview: String(e.topic_preview || "") });
    const row = fpStats.get(fp)!;
    if (e.outcome === "success") row.ok++;
    else if (e.outcome === "strict_503" || e.outcome === "router_error" || e.outcome === "relaxed_once_still_failed")
      row.bad++;
  }

  const demoteSet = new Set((hqs?.topic_demote ?? []).map((s) => String(s).toLowerCase()));

  const topicRows: {
    topic: string;
    route_type: string;
    status: "active" | "demoted" | "blocked" | "relaxed";
    reason: string;
    fail_rate: number;
    last_decision_at: string;
    topic_fp?: string;
  }[] = [];

  for (const [fp, st] of fpStats.entries()) {
    const total = st.ok + st.bad;
    const failRate = total > 0 ? st.bad / total : 0;
    let status: "active" | "demoted" | "blocked" | "relaxed" = "active";
    let reason = "";
    const pv = (st.preview || fp).toLowerCase();
    if ([...demoteSet].some((d) => d && (pv.includes(d) || fp.includes(d)))) {
      status = "blocked";
      reason = "high-quality-signals.topic_demote";
    } else if (failRate >= 0.55 && total >= 3) {
      status = "blocked";
      reason = "fail_rate>=0.55";
    } else if (failRate >= 0.35 && total >= 3) {
      status = "demoted";
      reason = "fail_rate>=0.35";
    } else if (failRate > 0 && failRate < 0.15 && total >= 5) {
      status = "active";
      reason = "recovered_low_fail_rate";
    }
    topicRows.push({
      topic: st.preview || fp,
      route_type: "post_package",
      status,
      reason,
      fail_rate: Math.round(failRate * 1000) / 1000,
      last_decision_at: ops.builtAt,
      topic_fp: fp
    });
  }

  for (const d of hqs?.topic_demote ?? []) {
    const ds = String(d);
    if (!topicRows.some((r) => r.topic.toLowerCase().includes(ds.toLowerCase()))) {
      topicRows.push({
        topic: ds,
        route_type: "slug_signal",
        status: "demoted",
        reason: "high-quality-signals.topic_demote",
        fail_rate: 0,
        last_decision_at: ops.builtAt
      });
    }
  }

  topicRows.sort((a, b) => b.fail_rate - a.fail_rate);

  const topicDoc = {
    version: "173",
    builtAt: ops.builtAt,
    min_pregen_score_from_signals: hqs?.min_pregen_score ?? null,
    generation_strict_from_signals: hqs?.generation_strict ?? null,
    topics: topicRows.slice(0, 200)
  };

  /** Tail token = last segment of `platform-contentType-topic` blog keys — matches allocation `topic` param */
  const topicTailMultipliers: Record<string, number> = {};
  for (const row of topicDoc.topics) {
    const raw = row.topic.trim();
    const tail = raw.includes("-") ? raw.split("-").pop() || raw : raw;
    if (!tail || tail.length < 2) continue;
    let m = 1;
    if (row.status === "blocked") m = 0.18;
    else if (row.status === "demoted") m = 0.48;
    else if (row.status === "relaxed") m = 0.88;
    else m = 1 + (1 - row.fail_rate) * 0.28;
    const prev = topicTailMultipliers[tail] ?? 1;
    topicTailMultipliers[tail] = Math.min(1.48, Math.max(0.1, Math.min(prev, m)));
  }

  const blogByTail = new Map<string, { ok: number; bad: number }>();
  for (const e of blog) {
    const p = String(e.topic_preview || "");
    if (!p.includes("-")) continue;
    const tail = p.split("-").pop() || p;
    if (tail.length < 2) continue;
    if (!blogByTail.has(tail)) blogByTail.set(tail, { ok: 0, bad: 0 });
    const z = blogByTail.get(tail)!;
    if (e.outcome === "success") z.ok++;
    else if (e.outcome === "blog_reject") z.bad++;
  }
  for (const [tail, z] of blogByTail.entries()) {
    const tot = z.ok + z.bad;
    if (tot < 2) continue;
    const fr = z.bad / tot;
    if (fr >= 0.45) {
      const prev = topicTailMultipliers[tail] ?? 1;
      topicTailMultipliers[tail] = Math.min(prev, 0.52);
    } else if (fr <= 0.12 && z.ok >= 4) {
      const prev = topicTailMultipliers[tail] ?? 1;
      topicTailMultipliers[tail] = Math.max(prev, 1.08);
    }
  }

  const priorityRanked = [...topicDoc.topics]
    .filter((t) => t.status === "active")
    .sort((a, b) => a.fail_rate - b.fail_rate)
    .slice(0, 40)
    .map((t) => t.topic);

  const deferredTopics = topicDoc.topics
    .filter((t) => t.status === "blocked" || t.status === "demoted")
    .slice(0, 40)
    .map((t) => t.topic);

  const ramp = {
    version: "173",
    builtAt: ops.builtAt,
    note: "content-allocation computeTripleWeight multiplies weight by topicTailMultipliers[topic] when present (topic = slug tail in EN blog grid).",
    topicTailMultipliers,
    priority_topics_ranked: priorityRanked,
    deferred_topics: deferredTopics,
    signals_path: "generated/high-quality-signals.json",
    topic_control_path: "generated/topic-production-control.json"
  };

  const blockedBeforeGen = pregen + dedup + blogPregenSkip + blogDedupSkip;
  const rejectedAfter = blogReject + relaxedStill;
  const wastedCalls = strict503 + routerErr;
  const savedCalls = blockedBeforeGen;
  const strictDenom = success.filter((e) => e.strict_effective === true).length + strict503 + routerErr;
  const strictNum = success.filter((e) => e.strict_effective === true).length;

  const cost = {
    version: "173",
    builtAt: ops.builtAt,
    generated_count: successCount,
    blocked_before_generation: blockedBeforeGen,
    rejected_after_generation: rejectedAfter,
    estimated_saved_calls: savedCalls,
    estimated_wasted_calls: wastedCalls,
    strict_mode_efficiency:
      strictDenom > 0 ? Math.round((strictNum / strictDenom) * 1000) / 1000 : null,
    notes: {
      saved_calls: "pregen/dedup/blog V172 skips avoid model invocation.",
      wasted_calls: "Model ran but post_package returned strict 503 or router_error.",
      blog_reject: "Counted in rejected_after_generation (quality gate after LLM)."
    }
  };

  fs.mkdirSync(path.dirname(OUT_OPS), { recursive: true });
  fs.writeFileSync(OUT_OPS, JSON.stringify(ops, null, 2), "utf8");
  fs.writeFileSync(OUT_DEG, JSON.stringify(degReport, null, 2), "utf8");
  fs.writeFileSync(OUT_TOPIC, JSON.stringify(topicDoc, null, 2), "utf8");
  fs.writeFileSync(OUT_RAMP, JSON.stringify(ramp, null, 2), "utf8");
  fs.writeFileSync(OUT_COST, JSON.stringify(cost, null, 2), "utf8");

  console.log(
    "[build-v173-production-ramp]",
    OUT_OPS,
    "| events=",
    events.length,
    "pkg_success=",
    success.length
  );
}

main();
