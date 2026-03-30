#!/usr/bin/env npx tsx
/**
 * V196.1 — Insert one minimal content_items row + generate/copy/upload_redirect events
 * so npm run v196:activation-check can reach activation_status "ok" without a browser.
 *
 * Requires same env as API: NEXT_PUBLIC_SUPABASE_URL + (SUPABASE_SERVICE_ROLE_KEY | ANON_KEY).
 * Skips if content_items already has rows unless --force.
 *
 * Usage: npx tsx scripts/seed-v196-smoke.ts [--force]
 */

import dotenv from "dotenv";
import path from "path";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const { resolveRepoRoot } = require("./lib/repo-root.js") as { resolveRepoRoot: (startDir?: string) => string };

const REPO = resolveRepoRoot(__dirname);
dotenv.config({ path: path.join(REPO, ".env.local") });
dotenv.config({ path: path.join(REPO, ".env") });

const force = process.argv.includes("--force");

async function main() {
  const supabase = createAdminClient();

  if (!force) {
    const { count, error } = await supabase.from("content_items").select("*", { count: "exact", head: true });
    if (error) {
      console.error("[v196:smoke-seed] count failed:", error.message);
      process.exit(1);
    }
    if ((count ?? 0) > 0) {
      console.log(
        "[v196:smoke-seed] content_items already has rows; skipping (use --force to insert another smoke chain)."
      );
      process.exit(0);
    }
  }

  const content_id = randomUUID();
  const anonymous_id = `smoke-${Date.now()}`;
  const chain_session_id = `chain-smoke-${Date.now()}`;

  const { error: ciErr } = await supabase.from("content_items").insert({
    id: content_id,
    user_id: null,
    anonymous_id,
    tool_type: "hook",
    platform: "tiktok",
    input_text: "[v196 smoke seed] hook-generator activation probe",
    generated_output: { smoke: true, packages: [] },
    chain_session_id
  });

  if (ciErr) {
    console.error("[v196:smoke-seed] content_items insert failed:", ciErr.message);
    process.exit(1);
  }

  const events = ["generate", "copy", "upload_redirect"] as const;
  for (const event_type of events) {
    const { error: evErr } = await supabase.from("content_events").insert({
      content_id,
      event_type
    });
    if (evErr) {
      console.error("[v196:smoke-seed] content_events insert failed:", evErr.message);
      process.exit(1);
    }
  }

  console.log("[v196:smoke-seed] ok content_id=", content_id);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
