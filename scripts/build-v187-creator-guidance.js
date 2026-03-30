#!/usr/bin/env node
/**
 * V187 — Creator Guidance: journey manifest + memory schema + optional growth/revenue hints.
 */
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src", "config", "creator-guidance", "v187-journey.source.json");
const OUT = path.join(ROOT, "generated");

function safeReadJson(p) {
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function main() {
  const journey = JSON.parse(fs.readFileSync(SRC, "utf8"));
  const builtAt = new Date().toISOString();

  const v181 = safeReadJson(path.join(OUT, "v181-revenue-growth-control.json"));
  const revenueHint =
    v181 && typeof v181 === "object"
      ? {
          note: "Optional V181 snapshot for operator-facing hints; client guidance uses static rules + user memory.",
          has_file: true
        }
      : { note: "v181-revenue-growth-control.json not found", has_file: false };

  const userMemoryManifest = {
    version: "187.1",
    builtAt,
    storage_primary: "client_localStorage",
    storage_key: "te_v187_creator_memory",
    anonymous_id_key: "te_v187_anon_id",
    server_future: "Supabase table or JSONL recommended for cross-device sync",
    schema: {
      anonymous_id: "string (UUID)",
      user_id: "string | null when logged in",
      platform: "tiktok | mixed | unknown",
      niche_hints: "string[] inferred from recent inputs",
      tool_usage_history: "{ tool_slug, ts, journey_step? }[]",
      generation_history: "{ tool_slug, ts, input_preview }[]",
      copy_events: "{ tool_slug, result_type, ts }[]",
      publish_events: "[] placeholder",
      preferred_content_type: "string | null",
      last_v186_intent_id: "string | null",
      last_v186_scenario_id: "string | null"
    },
    example_profile_inferred: {
      creator_level: "beginner | intermediate | advanced",
      primary_goal: "views | followers | sales",
      dominant_style: "educational | selling | storytelling"
    }
  };

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(
    path.join(OUT, "v187-creator-journey.json"),
    JSON.stringify({ ...journey, builtAt }, null, 2),
    "utf8"
  );
  fs.writeFileSync(
    path.join(OUT, "v187-user-memory.json"),
    JSON.stringify(userMemoryManifest, null, 2),
    "utf8"
  );
  fs.writeFileSync(
    path.join(OUT, "v187-guidance-manifest.json"),
    JSON.stringify(
      {
        version: "187.1",
        builtAt,
        integrates: {
          v186_knowledge_engine: "intent/scenario chips feed last_v186_* in client memory",
          v180_revenue: "telemetry + orders attribution (server); guidance copy nudges upgrade when appropriate",
          v181_growth: revenueHint
        },
        guidance_rules_version: "187.1"
      },
      null,
      2
    ),
    "utf8"
  );
  console.log("[build-v187] wrote v187-creator-journey.json, v187-user-memory.json, v187-guidance-manifest.json");
}

main();
