/**
 * Run Supabase migration by executing SQL via direct PostgreSQL connection.
 * Requires: SUPABASE_DB_URL in .env.local
 * Get it from: Supabase Dashboard → Settings → Database → Connection string (URI)
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env.local") });

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

async function run() {
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error(
      "Missing SUPABASE_DB_URL. Add to .env.local:\n" +
        "SUPABASE_DB_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres\n\n" +
        "Get it from: Supabase Dashboard → Settings → Database → Connection string (URI)"
    );
    process.exit(1);
  }

  const migrationsDir = path.join(__dirname, "..", "supabase", "migrations");
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    for (const file of files) {
      const migrationPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(migrationPath, "utf8");
      try {
        await client.query(sql);
        console.log("✓ " + file + " applied successfully.");
      } catch (err) {
        if (err.message.includes("already exists")) {
          console.log("○ " + file + " skipped (already applied).");
        } else {
          throw err;
        }
      }
    }
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
