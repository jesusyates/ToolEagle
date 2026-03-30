#!/usr/bin/env npx tsx
/**
 * V196 — Debug dump: generated/v196-content-sample.json
 * Contains last 10 content_items from Supabase.
 */

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { createAdminClient } from "@/lib/supabase/admin";
// scripts/lib/repo-root is JS (no TS declarations)
const { resolveRepoRoot } = require("./lib/repo-root.js") as { resolveRepoRoot: (startDir?: string) => string };

const REPO = resolveRepoRoot(__dirname);
const OUT_PATH = path.join(REPO, "generated", "v196-content-sample.json");

function loadEnv() {
  dotenv.config({ path: path.join(REPO, ".env.local") });
  dotenv.config({ path: path.join(REPO, ".env") });
}

async function main() {
  loadEnv();
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("content_items")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    const payload = {
      version: "1",
      updated_at: new Date().toISOString(),
      count: Array.isArray(data) ? data.length : 0,
      items: data ?? []
    };

    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    fs.writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2), "utf8");
    console.log("[v196] wrote", OUT_PATH, { count: payload.count });
  } catch (e) {
    const errMsg =
      e && typeof e === "object" && "message" in e && typeof (e as { message: unknown }).message === "string"
        ? (e as { message: string }).message
        : typeof e === "string"
          ? e
          : JSON.stringify(e);
    const payload = {
      version: "1",
      updated_at: new Date().toISOString(),
      count: 0,
      error: errMsg
    };
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    fs.writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2), "utf8");
    console.error("[v196] dump failed", e);
    process.exitCode = 0;
  }
}

main();

