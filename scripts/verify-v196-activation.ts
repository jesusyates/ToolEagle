#!/usr/bin/env npx tsx
/**
 * V196.1 — Activation check: generated/v196-activation-check.json
 * Also refreshes generated/v196-content-sample.json (same query as v196:dump-sample).
 */

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";

const { resolveRepoRoot } = require("./lib/repo-root.js") as { resolveRepoRoot: (startDir?: string) => string };

const REPO = resolveRepoRoot(__dirname);
const OUT_ACTIVATION = path.join(REPO, "generated", "v196-activation-check.json");
const OUT_SAMPLE = path.join(REPO, "generated", "v196-content-sample.json");

function loadEnv() {
  dotenv.config({ path: path.join(REPO, ".env.local") });
  dotenv.config({ path: path.join(REPO, ".env") });
}

type ActivationPayload = {
  version: "1";
  updated_at: string;
  /** Repo-relative SQL to run in Supabase when tables are missing */
  migration_sql_reference: string;
  migration_applied: boolean;
  content_items_ok: boolean;
  content_events_ok: boolean;
  content_items_row_count: number | null;
  content_events_row_count: number | null;
  sample_dump_ok: boolean;
  has_service_role_env: boolean;
  verified_flow: {
    path: string;
    same_content_id_tracked: boolean;
    example_content_id: string | null;
    event_types_present: string[];
  };
  activation_status: "ok" | "partial" | "failed";
  notes: string[];
};

function formatErr(err: unknown): string {
  return err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string"
    ? (err as { message: string }).message
    : typeof err === "string"
      ? err
      : JSON.stringify(err);
}

function writeSampleError(err: unknown) {
  const payload = {
    version: "1",
    updated_at: new Date().toISOString(),
    count: 0,
    error: formatErr(err)
  };
  fs.mkdirSync(path.dirname(OUT_SAMPLE), { recursive: true });
  fs.writeFileSync(OUT_SAMPLE, JSON.stringify(payload, null, 2), "utf8");
}

async function main() {
  loadEnv();

  const notes: string[] = [];
  let migration_applied = false;
  let content_items_ok = false;
  let content_events_ok = false;
  let content_items_row_count: number | null = null;
  let content_events_row_count: number | null = null;
  let sample_dump_ok = false;
  const has_service_role_env = hasServiceRoleKey();

  let event_types_present: string[] = [];
  let same_content_id_tracked = false;
  let example_content_id: string | null = null;

  try {
    const supabase = createAdminClient();

    const probeCi = await supabase.from("content_items").select("id").limit(1);
    if (probeCi.error) {
      notes.push(`content_items: ${probeCi.error.message}`);
      content_items_ok = false;
    } else {
      content_items_ok = true;
    }

    const probeCe = await supabase.from("content_events").select("id").limit(1);
    if (probeCe.error) {
      notes.push(`content_events: ${probeCe.error.message}`);
      content_events_ok = false;
    } else {
      content_events_ok = true;
    }

    migration_applied = content_items_ok && content_events_ok;

    if (content_items_ok) {
      const { count: ciCount, error: ciCountErr } = await supabase
        .from("content_items")
        .select("*", { count: "exact", head: true });
      if (!ciCountErr && typeof ciCount === "number") {
        content_items_row_count = ciCount;
      }
    }

    if (content_events_ok) {
      const { count: ceCount, error: ceCountErr } = await supabase
        .from("content_events")
        .select("*", { count: "exact", head: true });
      if (!ceCountErr && typeof ceCount === "number") {
        content_events_row_count = ceCount;
      }
    }

    if (content_items_ok && content_events_ok) {
      const { data: evRows, error: evListErr } = await supabase
        .from("content_events")
        .select("content_id, event_type")
        .order("created_at", { ascending: false })
        .limit(2000);

      if (evListErr) {
        notes.push(`content_events list: ${evListErr.message}`);
      } else if (evRows?.length) {
        const byContent = new Map<string, Set<string>>();
        for (const row of evRows) {
          const cid = String(row.content_id);
          if (!byContent.has(cid)) byContent.set(cid, new Set());
          byContent.get(cid)!.add(String(row.event_type));
        }
        const allTypes = new Set<string>();
        for (const s of byContent.values()) {
          for (const t of s) allTypes.add(t);
        }
        event_types_present = Array.from(allTypes).sort();

        for (const [cid, types] of byContent) {
          if (types.has("generate") && types.has("copy") && types.has("upload_redirect")) {
            same_content_id_tracked = true;
            example_content_id = cid;
            break;
          }
        }
      }
    }

    if (content_items_ok) {
      const { data, error } = await supabase
        .from("content_items")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        notes.push(`sample select: ${error.message}`);
        writeSampleError(error);
      } else {
        const payload = {
          version: "1",
          updated_at: new Date().toISOString(),
          count: Array.isArray(data) ? data.length : 0,
          items: data ?? []
        };
        fs.mkdirSync(path.dirname(OUT_SAMPLE), { recursive: true });
        fs.writeFileSync(OUT_SAMPLE, JSON.stringify(payload, null, 2), "utf8");
        sample_dump_ok = true;
        console.log("[v196.1] wrote", OUT_SAMPLE, { count: payload.count });
      }
    } else {
      writeSampleError(new Error("content_items table not reachable"));
    }
  } catch (e) {
    const errMsg =
      e && typeof e === "object" && "message" in e && typeof (e as { message: unknown }).message === "string"
        ? (e as { message: string }).message
        : typeof e === "string"
          ? e
          : JSON.stringify(e);
    notes.push(errMsg);
    writeSampleError(e instanceof Error ? e : new Error(errMsg));
    console.error("[v196.1] activation check error", e);
  }

  let activation_status: ActivationPayload["activation_status"] = "failed";
  if (migration_applied && content_items_ok && content_events_ok && sample_dump_ok) {
    if (same_content_id_tracked && (content_items_row_count ?? 0) > 0) {
      activation_status = "ok";
    } else {
      activation_status = "partial";
      if (!same_content_id_tracked) {
        notes.push(
          "No single content_id found with generate + copy + upload_redirect; run hook-generator flow once."
        );
      }
      if ((content_items_row_count ?? 0) === 0) {
        notes.push("content_items is empty; generate once to verify persistence.");
      }
    }
  } else {
    activation_status = "failed";
    if (!has_service_role_env && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) {
      notes.push("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY for server parity).");
    }
  }

  const out: ActivationPayload = {
    version: "1",
    updated_at: new Date().toISOString(),
    migration_sql_reference: "supabase/migrations/0038_v196_content_memory.sql",
    migration_applied,
    content_items_ok,
    content_events_ok,
    content_items_row_count,
    content_events_row_count,
    sample_dump_ok,
    has_service_role_env,
    verified_flow: {
      path: "hook-generator → generate → copy → upload_redirect",
      same_content_id_tracked,
      example_content_id,
      event_types_present
    },
    activation_status,
    notes
  };

  fs.mkdirSync(path.dirname(OUT_ACTIVATION), { recursive: true });
  fs.writeFileSync(OUT_ACTIVATION, JSON.stringify(out, null, 2), "utf8");
  console.log("[v196.1] wrote", OUT_ACTIVATION, { activation_status });
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
