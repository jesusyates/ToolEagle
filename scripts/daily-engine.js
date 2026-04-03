#!/usr/bin/env node
/**
 * V167 + V170 — Daily SEO / content automation hub (sequential); **single production entry**.
 * SEO cluster guide publish (`npm run seo:cluster-publish`) runs **once on process exit** (success or mustStop), non-fatal; health: `generated/seo-guides-publish-health.json` (also `cluster-publish-daily-status.json`).
 *
 * CLI:
 *   --dry-run          set SEO_DRY_RUN=1 for children where respected
 *   --skip-quality     skip seo-quality-scan --fail-on-violations
 *   --max-retry=N      indexing retries (default 3)
 *   --no-stop-on-error continue after step failure (not recommended)
 *
 * Execution: sequential | parallel (parallel reserved; always sequential for safety)
 */

const fs = require("fs");
const path = require("path");
const { execSync, spawnSync } = require("child_process");
const { resolveRepoRoot } = require("./lib/repo-root");

/** Canonical repo root — not process.cwd() (scheduler cwd may differ). */
const REPO_ROOT = resolveRepoRoot(__dirname);
require("dotenv").config({ path: path.join(REPO_ROOT, ".env.local") });
require("dotenv").config({ path: path.join(REPO_ROOT, ".env") });

const CWD = REPO_ROOT;

/** Legacy Chinese SEO (v63/v153 keyword + retrieval auto-gen). Off = skip step2_zh in this engine. */
const ENABLE_LEGACY_ZH_SEO = false;

function initLogPaths(dryRun) {
  const logDir = dryRun ? path.join(REPO_ROOT, "logs", "sandbox") : path.join(REPO_ROOT, "logs");
  return {
    LOG_DIR: logDir,
    LOG_JSONL: path.join(logDir, "daily-engine-log.jsonl"),
    DAILY_REPORT: path.join(logDir, "daily-report.json")
  };
}

let { LOG_DIR, LOG_JSONL, DAILY_REPORT } = initLogPaths(false);

function parseArgs() {
  const argv = process.argv.slice(2);
  let dryRun = false;
  let skipQuality = false;
  let maxRetry = 3;
  let stopOnError = true;
  for (const a of argv) {
    if (a === "--dry-run") dryRun = true;
    if (a === "--skip-quality") skipQuality = true;
    if (a.startsWith("--max-retry=")) maxRetry = Math.max(1, parseInt(a.split("=")[1], 10) || 3);
    if (a === "--no-stop-on-error") stopOnError = false;
  }
  return {
    dryRun,
    skipQuality,
    maxRetry,
    stopOnError,
    mode: "sequential",
    retry: true
  };
}

function appendEngineLog(row) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  fs.appendFileSync(LOG_JSONL, JSON.stringify({ ts: new Date().toISOString(), ...row }) + "\n", "utf8");
}

function resolveNpmCmd() {
  if (process.platform !== "win32") return "npm";
  // Ensure we spawn the correct npm.cmd even when PATH differs between shells
  // (e.g. called from PowerShell wrapper / scheduled jobs).
  try {
    const out = execSync("where npm.cmd", {
      cwd: CWD,
      stdio: ["ignore", "pipe", "ignore"],
      env: process.env
    })
      .toString("utf8")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)[0];
    if (out) return out;
  } catch {}
  return "npm.cmd";
}

/**
 * Registers a one-shot exit hook so cluster publish runs after the rest of the pipeline
 * (including when mustStop calls process.exit). Skipped in --dry-run. Never throws.
 */
function registerClusterPublishOnExit(opts) {
  if (global.__teClusterPublishExitRegistered) return;
  global.__teClusterPublishExitRegistered = true;
  process.on("exit", () => {
    if (opts.dryRun) return;
    try {
      const npmBin = resolveNpmCmd();
      const r =
        process.platform === "win32"
          ? spawnSync(process.env.ComSpec || "cmd.exe", ["/c", `${npmBin} run seo:cluster-publish`], {
              cwd: CWD,
              stdio: "inherit",
              env: { ...process.env, SEO_CLUSTER_PUBLISH_SOURCE: "daily-engine" }
            })
          : spawnSync(npmBin, ["run", "seo:cluster-publish"], {
              cwd: CWD,
              stdio: "inherit",
              env: { ...process.env, SEO_CLUSTER_PUBLISH_SOURCE: "daily-engine" }
            });
      appendEngineLog({
        step: "cluster_publish",
        event: r.status === 0 ? "ok" : "fail_nonfatal",
        exitCode: r.status,
        note: "exit hook; see generated/cluster-publish-daily-status.json"
      });
    } catch (e) {
      try {
        appendEngineLog({ step: "cluster_publish", event: "fail_nonfatal", err: String(e) });
      } catch {}
    }
  });
}

function runNpm(script, step) {
  const npmBin = resolveNpmCmd();
  appendEngineLog({ step, event: "start", cmd: `${npmBin} run ${script}` });

  // On Windows, npm.cmd is a batch file; spawnSync(npm.cmd, ...) may fail with EINVAL.
  // Use cmd.exe /c so Windows can execute the batch correctly.
  const r =
    process.platform === "win32"
      ? spawnSync(process.env.ComSpec || "cmd.exe", ["/c", `${npmBin} run ${script}`], {
          cwd: CWD,
          stdio: "inherit",
          env: process.env
        })
      : spawnSync(npmBin, ["run", script], { cwd: CWD, stdio: "inherit", env: process.env });
  const ok = r.status === 0;
  appendEngineLog({
    step,
    event: ok ? "ok" : "fail",
    exitCode: r.status,
    spawnError: r.error ? (r.error.message || String(r.error)) : undefined
  });
  return ok;
}

function runNode(relScript, args = [], step) {
  const cmd = path.join(CWD, relScript);
  appendEngineLog({ step, event: "start", cmd: `${relScript} ${args.join(" ")}` });
  const r = spawnSync("node", [cmd, ...args], { cwd: CWD, stdio: "inherit", env: process.env });
  const ok = r.status === 0;
  appendEngineLog({ step, event: ok ? "ok" : "fail", exitCode: r.status });
  return ok;
}

function loadJson(p, fb) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return fb;
  }
}

function applyOptimizerEnvFromDisk() {
  const p = path.join(CWD, "generated", "retrieval-optimization-plan.json");
  const plan = loadJson(p, null);
  if (!plan || !plan.env_suggestions) return;
  const allow = new Set(["RETRIEVAL_SCORE_THRESHOLD_MULT", "RETRIEVAL_BIAS_EXTRA"]);
  for (const [k, v] of Object.entries(plan.env_suggestions)) {
    if (allow.has(k) && v != null) process.env[k] = String(v);
  }
}

function assessHighFallbackAndScaleBatch() {
  const utilPath = path.join(CWD, "generated", "seo-retrieval-utilization.json");
  const u = loadJson(utilPath, null);
  if (!u) return;
  const h = Number(u.retrieval_hits) || 0;
  const f = Number(u.retrieval_fallbacks) || 0;
  const t = h + f;
  if (t < 5) return;
  const ratio = f / t;
  if (ratio > 0.8) {
    process.env.DAILY_ENGINE_BATCH_SCALE = "0.2";
    appendEngineLog({
      step: "preflight",
      event: "batch_scale_reduced",
      reason: "retrieval_fallback_ratio_high",
      ratio: Math.round(ratio * 1000) / 1000
    });
  }
}

function countIndexingOkToday() {
  const logp = path.join(CWD, "logs", "indexing-submissions.jsonl");
  if (!fs.existsSync(logp)) return 0;
  const day = new Date().toISOString().slice(0, 10);
  let n = 0;
  for (const line of fs.readFileSync(logp, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      const o = JSON.parse(line);
      if (o.ok && String(o.at || "").startsWith(day)) n++;
    } catch {
      /* skip */
    }
  }
  return n;
}

function runIndexingWithRetries(maxRetry, step) {
  let lastOk = false;
  let attempts = 0;
  for (let i = 0; i < maxRetry; i++) {
    attempts++;
    appendEngineLog({ step, event: "indexing_attempt", attempt: i + 1 });
    try {
      execSync("npm run en:indexing:queue", { cwd: CWD, stdio: "inherit", env: process.env });
      lastOk = true;
      break;
    } catch {
      lastOk = false;
      appendEngineLog({ step, event: "indexing_retry_scheduled", attempt: i + 1 });
    }
  }
  appendEngineLog({ step, event: "indexing_done", ok: lastOk, attempts });
  return lastOk;
}

function buildDailyReport(ctx) {
  const pipeline = loadJson(path.join(CWD, "generated", "seo-pipeline-state.json"), {});
  const util = loadJson(path.join(CWD, "generated", "seo-retrieval-utilization.json"), {});
  const zh = Number(pipeline.zh_progress_count) || 0;
  const en = Number(pipeline.en_progress_count) || 0;
  const topTopics = (util.top_retrieval_topics || []).slice(0, 8).map((t) => t.topic_key);
  const fb = util.fallback_reason_breakdown || {};
  const fbEntries = Object.entries(fb).sort((a, b) => b[1] - a[1]);
  const fallback_reason_top = fbEntries.length ? fbEntries[0][0] : null;

  const dryReport = process.env.SEO_DRY_RUN === "1" || process.env.SEO_SANDBOX === "1";
  const report = {
    version: "170",
    production_entry: dryReport ? "daily-engine-dry-run" : "daily-engine",
    report_source: dryReport ? "logs/sandbox/daily-report.json" : "logs/daily-report.json",
    generatedAt: new Date().toISOString(),
    generated_pages: zh + en,
    generated_pages_detail: { zh, en },
    indexed_pages: ctx.indexedOkApprox,
    retrieval_share: typeof util.retrieval_share === "number" ? util.retrieval_share : null,
    production_retrieval_share:
      typeof util.production_retrieval_share === "number" ? util.production_retrieval_share : null,
    top_topics: topTopics,
    fallback_reason_top,
    execution: ctx.execution,
    steps_ok: ctx.stepsOk,
    failure_policy: { stop_on_error: ctx.stopOnError, fallback: "log_and_optional_continue" }
  };
  fs.mkdirSync(LOG_DIR, { recursive: true });
  fs.writeFileSync(DAILY_REPORT, JSON.stringify(report, null, 2), "utf8");
  appendEngineLog({ step: "report", event: "wrote", path: DAILY_REPORT });
  appendProductionHistoryLine(ctx);
}

/** V170 — keep watchdog / missed-run timeline aligned when orchestrator is not the entry. */
function appendProductionHistoryLine(ctx) {
  const dry = process.env.SEO_DRY_RUN === "1" || process.env.SEO_SANDBOX === "1";
  const genDir = dry ? path.join(REPO_ROOT, "generated", "sandbox") : path.join(REPO_ROOT, "generated");
  const p = path.join(genDir, "seo-production-history.jsonl");
  const enOk = ctx.stepsOk.step2_en === true;
  const zhOk = ctx.stepsOk.step2_zh === true;
  const enFail = ctx.stepsOk.step2_en === false;
  const zhFail = ctx.stepsOk.step2_zh === false;
  const entry = {
    date: new Date().toISOString().slice(0, 10),
    updatedAt: new Date().toISOString(),
    en_status: enOk ? "ok" : enFail ? "failed" : "partial",
    zh_status: zhOk ? "ok" : zhFail ? "failed" : "partial",
    retries_count: 0,
    production_entry: dry ? "daily-engine-dry-run" : "daily-engine",
    orchestrator_exit_code: 0,
    ...(dry ? { dry_run: true } : {})
  };
  try {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.appendFileSync(p, JSON.stringify(entry) + "\n", "utf8");
  } catch (e) {
    appendEngineLog({ step: "report", event: "history_append_skipped", err: String(e) });
  }
}

function main() {
  const opts = parseArgs();
  process.env.ENABLE_LEGACY_ZH_SEO = ENABLE_LEGACY_ZH_SEO ? "1" : "0";
  if (opts.dryRun) process.env.SEO_DRY_RUN = "1";
  ({ LOG_DIR, LOG_JSONL, DAILY_REPORT } = initLogPaths(opts.dryRun));

  const stepsOk = {};
  const execution = {
    type: opts.mode,
    retry: opts.retry,
    max_retry: opts.maxRetry,
    stop_on_error: opts.stopOnError,
    dependencies: ["npm scripts", "Node", "optional GSC for indexing"],
    output_artifacts: [
      "logs/daily-report.json",
      "logs/daily-engine-log.jsonl",
      "generated/v185-first-payment.json",
      "generated/v185-revenue-system-state.json",
      "generated/system-map.json",
      "generated/cluster-publish-last-run.json",
      "generated/cluster-publish-daily-status.json",
      "generated/cluster-priority-state.json"
    ]
  };

  appendEngineLog({
    event: "daily_engine_start",
    execution,
    automation_hook: { cron: "daily (recommended)", note: "0 2 * * * UTC example" }
  });

  registerClusterPublishOnExit(opts);

  applyOptimizerEnvFromDisk();
  assessHighFallbackAndScaleBatch();

  if (!opts.skipQuality) {
    try {
      execSync("node scripts/seo-quality-scan.js --fail-on-violations", {
        cwd: CWD,
        stdio: "inherit",
        env: process.env
      });
      stepsOk.quality = true;
    } catch {
      stepsOk.quality = false;
      appendEngineLog({ step: "quality", event: "blocked_generation" });
      if (opts.stopOnError) {
        buildDailyReport({
          stepsOk,
          execution,
          stopOnError: opts.stopOnError,
          indexedOkApprox: 0
        });
        process.exit(1);
      }
    }
  } else {
    stepsOk.quality = "skipped";
  }

  const mustStop = (name) => {
    if (!opts.stopOnError) return false;
    appendEngineLog({ step: name, event: "abort_pipeline" });
    buildDailyReport({
      stepsOk,
      execution,
      stopOnError: opts.stopOnError,
      indexedOkApprox: countIndexingOkToday()
    });
    process.exit(1);
  };

  /** V175 — GSC pull + conversion aggregate before growth merge (search:growth reads generated JSON). */
  if (!runNpm("search:performance", "step0a_gsc")) mustStop("step0a_gsc");
  stepsOk.step0a_gsc = true;
  if (!runNpm("search:conversion", "step0b_conversion")) mustStop("step0b_conversion");
  stepsOk.step0b_conversion = true;
  /** V174 — growth + V172/V173 before allocation so EN blog batch uses fresh ramp weights */
  if (!runNpm("search:growth", "step0_growth")) mustStop("step0_growth");
  stepsOk.step0_growth = true;

  try {
    execSync("npx tsx scripts/build-high-quality-signals.ts", { cwd: CWD, stdio: "inherit", env: process.env });
    stepsOk.v172_signals = true;
  } catch {
    stepsOk.v172_signals = false;
    appendEngineLog({ step: "v172_signals", event: "fail_nonfatal" });
  }

  try {
    execSync("npx tsx scripts/build-content-deduplication.ts", { cwd: CWD, stdio: "inherit", env: process.env });
    stepsOk.v172_dedup = true;
  } catch {
    stepsOk.v172_dedup = false;
    appendEngineLog({ step: "v172_dedup", event: "fail_nonfatal" });
  }

  try {
    execSync("npx tsx scripts/build-v173-production-ramp.ts", { cwd: CWD, stdio: "inherit", env: process.env });
    stepsOk.v173_ramp = true;
  } catch {
    stepsOk.v173_ramp = false;
    appendEngineLog({ step: "v173_ramp", event: "fail_nonfatal" });
  }

  try {
    execSync("npx tsx scripts/build-v174-controlled-scale.ts", { cwd: CWD, stdio: "inherit", env: process.env });
    stepsOk.v174_scale = true;
  } catch {
    stepsOk.v174_scale = false;
    appendEngineLog({ step: "v174_scale", event: "fail_nonfatal" });
  }

  try {
    execSync("npx tsx scripts/build-v176-growth-execution.ts", { cwd: CWD, stdio: "inherit", env: process.env });
    stepsOk.v176_execution = true;
  } catch {
    stepsOk.v176_execution = false;
    appendEngineLog({ step: "v176_execution", event: "fail_nonfatal" });
  }

  if (process.env.V177_AUTO_EXECUTION === "1") {
    try {
      execSync("node scripts/run-v177-auto-execution.js", { cwd: CWD, stdio: "inherit", env: process.env });
      stepsOk.v177_auto = true;
    } catch {
      stepsOk.v177_auto = false;
      appendEngineLog({ step: "v177_auto", event: "fail_nonfatal" });
    }
  } else {
    stepsOk.v177_auto = "skipped_env";
  }

  try {
    execSync("node scripts/run-v179-revenue-optimization.js", { cwd: CWD, stdio: "inherit", env: process.env });
    stepsOk.v179_revenue = true;
  } catch {
    stepsOk.v179_revenue = false;
    appendEngineLog({ step: "v179_revenue", event: "fail_nonfatal" });
  }

  try {
    execSync("npx tsx scripts/build-v180-payment-snapshot.ts", { cwd: CWD, stdio: "inherit", env: process.env });
    execSync("node scripts/run-v180-revenue-attribution.js", { cwd: CWD, stdio: "inherit", env: process.env });
    stepsOk.v180_revenue_paywall = true;
  } catch {
    stepsOk.v180_revenue_paywall = false;
    appendEngineLog({ step: "v180_revenue_paywall", event: "fail_nonfatal" });
  }

  try {
    execSync("node scripts/run-v181-revenue-growth-control.js", { cwd: CWD, stdio: "inherit", env: process.env });
    stepsOk.v181_revenue_growth = true;
  } catch {
    stepsOk.v181_revenue_growth = false;
    appendEngineLog({ step: "v181_revenue_growth", event: "fail_nonfatal" });
  }

  try {
    execSync("node scripts/run-v182-revenue-amplification.js", { cwd: CWD, stdio: "inherit", env: process.env });
    stepsOk.v182_revenue_amplification = true;
  } catch {
    stepsOk.v182_revenue_amplification = false;
    appendEngineLog({ step: "v182_revenue_amplification", event: "fail_nonfatal" });
  }

  try {
    execSync("node scripts/run-v183-revenue-signal-diagnosis.js", { cwd: CWD, stdio: "inherit", env: process.env });
    stepsOk.v183_revenue_signal_activation = true;
  } catch {
    stepsOk.v183_revenue_signal_activation = false;
    appendEngineLog({ step: "v183_revenue_signal_activation", event: "fail_nonfatal" });
  }

  try {
    execSync("node scripts/run-v184-payment-diagnostics.js", { cwd: CWD, stdio: "inherit", env: process.env });
    stepsOk.v184_payment_diagnostics = true;
  } catch {
    stepsOk.v184_payment_diagnostics = false;
    appendEngineLog({ step: "v184_payment_diagnostics", event: "fail_nonfatal" });
  }

  // Daily report observability: show whether V182 amplification can/should be activated.
  try {
    const diag = loadJson(path.join(CWD, "generated", "v183-revenue-signal-diagnosis.json"), null);
    const th = loadJson(path.join(CWD, "generated", "v183-v182-activation-threshold.json"), null);

    stepsOk.payment_snapshot_status = diag?.payment_snapshot_status ?? null;
    stepsOk.exact_revenue_status = diag
      ? {
          exact_revenue_empty_reason: diag.exact_revenue_empty_reason,
          orders_found: diag.orders_found,
          callbacks_found: diag.callbacks_found,
          activations_found: diag.activations_found,
          exact_attributed_orders_count: diag.exact_attributed_orders?.count,
          inferred_only_orders_count: diag.inferred_only_orders?.count,
          unattributed_orders_count: diag.unattributed_orders?.count
        }
      : null;

    stepsOk.v182_activation_status = th?.current_status ?? null;
  } catch {
    stepsOk.payment_snapshot_status = null;
    stepsOk.exact_revenue_status = null;
    stepsOk.v182_activation_status = null;
  }

  if (!runNpm("build-content-allocation-plan", "step1_allocation")) mustStop("step1_allocation");

  try {
    execSync("npx tsx scripts/run-retrieval-optimizer.ts --apply", {
      cwd: CWD,
      stdio: "inherit",
      env: process.env
    });
    stepsOk.step1b_retrieval_optimizer = true;
  } catch {
    stepsOk.step1b_retrieval_optimizer = false;
    appendEngineLog({ step: "step1b_retrieval_optimizer", event: "fail_nonfatal" });
  }

  if (!runNpm("seo:generate:en", "step2_en")) mustStop("step2_en");
  if (!ENABLE_LEGACY_ZH_SEO) {
    console.log("[skip] legacy zh seo disabled");
    stepsOk.step2_zh = "skipped_legacy_disabled";
  } else if (!runNpm("seo:generate:zh", "step2_zh")) {
    mustStop("step2_zh");
  }

  try {
    execSync("npx tsx scripts/build-content-quality-status.ts", {
      cwd: CWD,
      stdio: "inherit",
      env: process.env
    });
    stepsOk.v171_quality_eval = true;
  } catch {
    stepsOk.v171_quality_eval = false;
    appendEngineLog({ step: "v171_quality_eval", event: "fail_nonfatal" });
  }

  try {
    execSync("npx tsx scripts/build-internal-link-priority-report.ts", {
      cwd: CWD,
      stdio: "inherit",
      env: process.env
    });
    stepsOk.v171_link_report = true;
  } catch {
    stepsOk.v171_link_report = false;
    appendEngineLog({ step: "v171_link_report", event: "fail_nonfatal" });
  }

  if (!runNode("scripts/en-internal-linking.js", [], "step3_en_links")) mustStop("step3_en_links");
  if (!runNode("scripts/zh-internal-linking.js", [], "step3_zh_links")) mustStop("step3_zh_links");

  const idxOk = runIndexingWithRetries(opts.maxRetry, "step4_indexing");
  stepsOk.indexing = idxOk;
  if (!idxOk && opts.stopOnError) {
    mustStop("step4_indexing");
  }

  try {
    execSync("npm run zh:indexing:queue", { cwd: CWD, stdio: "inherit", env: process.env });
    stepsOk.zh_indexing_queue = true;
  } catch {
    stepsOk.zh_indexing_queue = false;
    appendEngineLog({ step: "zh_indexing", event: "fail_nonfatal" });
  }

  if (!runNpm("write-retrieval-utilization-summary", "step5_retrieval")) mustStop("step5_retrieval");

  try {
    execSync("npx tsx scripts/run-retrieval-optimizer.ts", { cwd: CWD, stdio: "inherit", env: process.env });
    stepsOk.step6b_retrieval_optimizer = true;
  } catch {
    stepsOk.step6b_retrieval_optimizer = false;
  }

  try {
    execSync("node scripts/run-v185-first-revenue-acquisition.js --skip-verify", {
      cwd: CWD,
      stdio: "inherit",
      env: process.env
    });
    stepsOk.v185_first_revenue = true;
  } catch {
    stepsOk.v185_first_revenue = false;
    appendEngineLog({ step: "v185_first_revenue", event: "fail_nonfatal" });
  }

  try {
    execSync("npx tsx scripts/write-system-map.ts", { cwd: CWD, stdio: "inherit", env: process.env });
    stepsOk.system_map = true;
  } catch {
    stepsOk.system_map = false;
  }

  try {
    execSync("npm run v171:conversion-audit", { cwd: CWD, stdio: "inherit", env: process.env });
    stepsOk.v171_conversion_audit = true;
  } catch {
    stepsOk.v171_conversion_audit = false;
    appendEngineLog({ step: "v171_conversion_audit", event: "fail_nonfatal" });
  }

  try {
    execSync("npm run v171:cta-report", { cwd: CWD, stdio: "inherit", env: process.env });
    stepsOk.v171_cta_report = true;
  } catch {
    stepsOk.v171_cta_report = false;
    appendEngineLog({ step: "v171_cta_report", event: "fail_nonfatal" });
  }

  try {
    execSync("npm run v171.1:artifacts", { cwd: CWD, stdio: "inherit", env: process.env });
    stepsOk.v171_1_artifacts = true;
  } catch {
    stepsOk.v171_1_artifacts = false;
    appendEngineLog({ step: "v171_1_artifacts", event: "fail_nonfatal" });
  }

  buildDailyReport({
    stepsOk,
    execution,
    stopOnError: opts.stopOnError,
    indexedOkApprox: countIndexingOkToday()
  });

  appendEngineLog({ event: "daily_engine_complete", stepsOk });
  console.log("\n[daily-engine] complete. Report:", DAILY_REPORT);
}

try {
  main();
} catch (e) {
  console.error("[daily-engine] fatal", e);
  process.exit(1);
}
