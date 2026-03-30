/**
 * V196.1 — One command: optional DB migration (SUPABASE_DB_URL) + activation check + sample dump.
 * Usage: npm run v196:activate
 */
const path = require("path");
const { spawnSync } = require("child_process");

require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const repoRoot = path.join(__dirname, "..");
const migrateScript = path.join(__dirname, "run-single-migration.js");
const migrationFile = "0038_v196_content_memory.sql";

if (process.env.SUPABASE_DB_URL) {
  const r = spawnSync(process.execPath, [migrateScript, migrationFile], {
    cwd: repoRoot,
    stdio: "inherit",
    env: process.env
  });
  if (r.status !== 0) {
    console.error(
      "[v196] Migration step failed (exit " +
        r.status +
        "). If tables already exist, you can ignore. Continuing to activation-check."
    );
  }
} else {
  console.warn(
    "[v196] SUPABASE_DB_URL not set — skipped automatic SQL. Add database URI to .env.local, or apply SQL manually:\n" +
      "  supabase/migrations/0038_v196_content_memory.sql"
  );
}

const check = spawnSync("npx", ["tsx", "scripts/verify-v196-activation.ts"], {
  cwd: repoRoot,
  stdio: "inherit",
  shell: true,
  env: process.env
});

process.exit(check.status === null ? 1 : check.status);
