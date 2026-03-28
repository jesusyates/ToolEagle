/**
 * V82 + V153 + V154: Daily Content + Distribution Pipeline
 * Run: node scripts/run-daily-pipeline.js
 * Schedule: daily (e.g. 0 2 * * * for 2am)
 *
 * Default: V154 orchestrator (health, retries, daily report) → V153 tick (ZH+EN batches).
 * `--zh-only` — ZH lane only (cheaper). `--bg-only` — thin V153 engine only (no orchestrator).
 * `--sync` — legacy full zh:auto + distribute + optional --en en:auto.
 */

const { execSync } = require("child_process");
const path = require("path");

const CWD = process.cwd();

function run(name, cmd) {
  console.log(`\n===== ${name} =====\n`);
  try {
    execSync(cmd, { cwd: CWD, stdio: "inherit" });
  } catch (e) {
    console.error(`${name} failed:`, e.message);
    throw e;
  }
}

async function main() {
  console.log("\n===== V82/V153/V154 Daily Pipeline =====");
  console.log(new Date().toISOString());

  const syncLegacy = process.argv.includes("--sync");
  const argv = process.argv.slice(2);
  const dryLegacy = argv.includes("--dry-run") || argv.includes("--sandbox");
  if (dryLegacy) {
    process.env.SEO_DRY_RUN = "1";
  }

  if (syncLegacy) {
    run("zh:auto (legacy full batch)", "node scripts/auto-generate-zh.js");
    run("auto-distribute", "node scripts/auto-distribute.js");
    if (argv.includes("--en")) {
      run("en:auto", "node scripts/en-auto.js");
    }
  } else if (argv.includes("--bg-only")) {
    const wantEn = argv.includes("--en");
    let scope = wantEn ? "--once" : "--once --zh-only";
    if (argv.includes("--dry-run") || argv.includes("--sandbox")) scope += " --dry-run";
    run("V153 background SEO (thin tick)", `npx tsx scripts/run-background-seo-engine.ts ${scope}`);
  } else {
    let cmd = "npx tsx scripts/run-daily-orchestrator.ts";
    if (argv.includes("--zh-only")) cmd += " --zh-only";
    if (argv.includes("--en-only")) cmd += " --en-only";
    if (argv.includes("--dry-run") || argv.includes("--sandbox")) cmd += " --dry-run";
    if (argv.includes("--check-only") || argv.includes("--check")) cmd += " --check-only";
    run("V154 daily orchestrator", cmd);
  }

  const skipLedger =
    argv.includes("--dry-run") ||
    argv.includes("--sandbox") ||
    argv.includes("--check-only") ||
    argv.includes("--check");

  // Daily SEO ledger: keep operator "in my head" checks automatic.
  if (!skipLedger) {
    try {
      const { recordSeoLedger } = require("./seo-ledger");
      recordSeoLedger({ reason: "daily-pipeline" });
    } catch (e) {
      console.warn("[seo-ledger] skipped:", e?.message || String(e));
    }
  } else {
    console.log("[daily-pipeline] V157: skipping seo-ledger (dry-run / check-only).");
  }

  console.log("\n===== Pipeline complete =====\n");
}

main().catch((e) => {
  console.error("Pipeline failed:", e);
  process.exit(1);
});
