/**
 * Run ONE migration file against Supabase Postgres.
 * Usage: node scripts/run-single-migration.js 0032_v100_3_user_feedback.sql
 *
 * Requires SUPABASE_DB_URL in .env.local (same as db:migrate).
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env.local") });

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const arg = process.argv[2];
if (!arg) {
  console.error(
    "Usage: node scripts/run-single-migration.js <filename.sql>\n" +
      "Example: node scripts/run-single-migration.js 0032_v100_3_user_feedback.sql"
  );
  process.exit(1);
}

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error(
    "Missing SUPABASE_DB_URL in .env.local.\n" +
      "Supabase Dashboard → Settings → Database → Connection string (URI)"
  );
  process.exit(1);
}

const migrationsDir = path.join(__dirname, "..", "supabase", "migrations");
const migrationPath = path.isAbsolute(arg) ? arg : path.join(migrationsDir, arg);

if (!fs.existsSync(migrationPath)) {
  console.error("File not found:", migrationPath);
  process.exit(1);
}

const sql = fs.readFileSync(migrationPath, "utf8");

async function run() {
  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    await client.query(sql);
    console.log("✓ Applied:", path.basename(migrationPath));
  } catch (err) {
    if (err.message && err.message.includes("already exists")) {
      console.log("○ Skipped (already applied):", path.basename(migrationPath));
    } else {
      console.error("Migration failed:", err.message);
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

run();
