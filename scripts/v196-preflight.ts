#!/usr/bin/env npx tsx
/**
 * V196.1 Preflight checks (env + Supabase reachability + table existence).
 *
 * Contract:
 * - Write machine-readable JSON to generated/v196-preflight.json
 * - Terminal output must be very short (only conclusion)
 */
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { createAdminClient } from "@/lib/supabase/admin";

// scripts/lib/repo-root is JS (no TS declarations)
const { resolveRepoRoot } = require("./lib/repo-root.js") as { resolveRepoRoot: (startDir?: string) => string };

const REPO = resolveRepoRoot(__dirname);
const OUT_JSON = path.join(REPO, "generated", "v196-preflight.json");

function loadEnv() {
  dotenv.config({ path: path.join(REPO, ".env.local") });
  dotenv.config({ path: path.join(REPO, ".env") });
}

function presentEnv(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function isMissingRelationError(msg: string, tableName: string): boolean {
  const m = msg.toLowerCase();
  // Supabase PostgREST / Postgres errors usually contain these fragments.
  const missing =
    m.includes("does not exist") ||
    m.includes("relation") ||
    m.includes("undefined table") ||
    m.includes("the relation") ||
    m.includes("invalid relation");
  const includesTable = m.includes(tableName.toLowerCase());
  return missing && includesTable;
}

type PreflightPayload = {
  version: "1";
  updated_at: string;
  env: {
    NEXT_PUBLIC_SUPABASE_URL: { present: boolean };
    NEXT_PUBLIC_SUPABASE_ANON_KEY: { present: boolean };
    SUPABASE_SERVICE_ROLE_KEY: { present: boolean };
  };
  supabase_connection_ok: boolean;
  tables: {
    content_items_ok: boolean;
    content_events_ok: boolean;
  };
  migration_hint: string | null;
  preflight_status: "ready" | "blocked";
  blocking_reason: string | null;
  notes: string[];
};

async function checkTableExists(supabase: ReturnType<typeof createAdminClient>, tableName: string) {
  const { data, error } = await supabase.from(tableName).select("id").limit(1);

  if (error) {
    const msg = error.message ?? "";
    if (isMissingRelationError(msg, tableName)) return { ok: false, reason: "missing_relation" as const };
    // If keys are only anon, RLS/permission errors may happen even when the table exists.
    // For preflight we only need existence; treat permission errors as "exists but not readable".
    return { ok: true, reason: "permission_or_other_error" as const };
  }

  return { ok: true, reason: "query_ok" as const };
}

async function main() {
  loadEnv();

  const notes: string[] = [];
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: { present: presentEnv(process.env.NEXT_PUBLIC_SUPABASE_URL) },
    NEXT_PUBLIC_SUPABASE_ANON_KEY: { present: presentEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) },
    SUPABASE_SERVICE_ROLE_KEY: { present: presentEnv(process.env.SUPABASE_SERVICE_ROLE_KEY) }
  };

  let supabase_connection_ok = false;
  let content_items_ok = false;
  let content_events_ok = false;
  let migration_hint: string | null = null;
  let blocking_reason: string | null = null;

  try {
    const supabase = createAdminClient();
    supabase_connection_ok = true;

    const ci = await checkTableExists(supabase, "content_items");
    content_items_ok = ci.ok;
    if (!ci.ok) notes.push("content_items: missing_relation");

    const ce = await checkTableExists(supabase, "content_events");
    content_events_ok = ce.ok;
    if (!ce.ok) notes.push("content_events: missing_relation");

    if (!content_items_ok || !content_events_ok) {
      migration_hint = "migration 未执行：content_items / content_events 表不存在";
      blocking_reason = "missing required content tables";
    }
  } catch (e) {
    supabase_connection_ok = false;
    const errMsg =
      e && typeof e === "object" && "message" in e && typeof (e as { message: unknown }).message === "string"
        ? (e as { message: string }).message
        : typeof e === "string"
          ? e
          : JSON.stringify(e);
    notes.push(errMsg);
    blocking_reason = "missing supabase env keys (createAdminClient failed)";
  }

  const preflight_status: PreflightPayload["preflight_status"] =
    supabase_connection_ok && content_items_ok && content_events_ok ? "ready" : "blocked";

  if (preflight_status === "blocked" && !blocking_reason) blocking_reason = "preflight checks failed";

  const payload: PreflightPayload = {
    version: "1",
    updated_at: new Date().toISOString(),
    env,
    supabase_connection_ok,
    tables: {
      content_items_ok,
      content_events_ok
    },
    migration_hint,
    preflight_status,
    blocking_reason,
    notes
  };

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");

  // Very short terminal output (conclusion only)
  console.log(
    `[v196.1] preflight ${payload.preflight_status}${payload.blocking_reason ? `: ${payload.blocking_reason}` : ""}`
  );
}

main().catch((e) => {
  const msg =
    e && typeof e === "object" && "message" in e && typeof (e as { message: unknown }).message === "string"
      ? (e as { message: string }).message
      : typeof e === "string"
        ? e
        : JSON.stringify(e);
  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(
    OUT_JSON,
    JSON.stringify(
      {
        version: "1",
        updated_at: new Date().toISOString(),
        env: {
          NEXT_PUBLIC_SUPABASE_URL: { present: presentEnv(process.env.NEXT_PUBLIC_SUPABASE_URL) },
          NEXT_PUBLIC_SUPABASE_ANON_KEY: { present: presentEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) },
          SUPABASE_SERVICE_ROLE_KEY: { present: presentEnv(process.env.SUPABASE_SERVICE_ROLE_KEY) }
        },
        supabase_connection_ok: false,
        tables: { content_items_ok: false, content_events_ok: false },
        migration_hint: null,
        preflight_status: "blocked",
        blocking_reason: "script error",
        notes: [msg]
      },
      null,
      2
    ),
    "utf8"
  );
  console.log(`[v196.1] preflight blocked: script error`);
  process.exitCode = 1;
});

