/**
 * V82: Daily Content + Distribution Pipeline
 * Run: node scripts/run-daily-pipeline.js
 * Schedule: daily (e.g. 0 2 * * * for 2am)
 *
 * Pipeline: zh:auto → auto-distribute → (optional en:auto)
 * Generate pages → generate share content → store in distribution_queue
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
  console.log("\n===== V82 Daily Pipeline =====");
  console.log(new Date().toISOString());

  run("zh:auto", "node scripts/auto-generate-zh.js");
  run("auto-distribute", "node scripts/auto-distribute.js");

  const runEn = process.argv.includes("--en");
  if (runEn) {
    run("en:auto", "node scripts/en-auto.js");
  }

  console.log("\n===== Pipeline complete =====\n");
}

main().catch((e) => {
  console.error("Pipeline failed:", e);
  process.exit(1);
});
