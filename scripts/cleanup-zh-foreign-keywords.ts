#!/usr/bin/env npx tsx
/**
 * Remove English-site platform keywords from zh cache.
 * Marks entries as unpublished instead of deleting keys for safe rollback/audit.
 */
import fs from "fs";
import path from "path";

const REPO = process.cwd();
const CACHE_PATH = path.join(REPO, "data", "zh-keywords.json");
const REPORT_PATH = path.join(REPO, "generated", "zh-keyword-platform-cleanup.json");
const FOREIGN_PLATFORM_RE = /\b(tiktok|youtube|instagram)\b/i;
const FOREIGN_PLATFORM_NAMES_RE = /(TikTok|YouTube|Instagram|抖音国际版)/i;

type CacheEntry = {
  keyword?: string;
  platform?: string;
  published?: boolean;
  lastModified?: number;
  [k: string]: unknown;
};

function shouldDisable(slug: string, item: CacheEntry): boolean {
  const p = String(item.platform || "").toLowerCase();
  if (p === "tiktok" || p === "youtube" || p === "instagram") return true;
  if (FOREIGN_PLATFORM_RE.test(slug)) return true;
  if (FOREIGN_PLATFORM_NAMES_RE.test(String(item.keyword || ""))) return true;
  return false;
}

function main() {
  if (!fs.existsSync(CACHE_PATH)) {
    const payload = { ok: false, reason: "missing_cache", path: CACHE_PATH, updatedAt: new Date().toISOString() };
    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
    fs.writeFileSync(REPORT_PATH, JSON.stringify(payload, null, 2), "utf8");
    console.log("[zh-cleanup] cache not found:", CACHE_PATH);
    return;
  }

  const raw = fs.readFileSync(CACHE_PATH, "utf8");
  const cache = JSON.parse(raw) as Record<string, CacheEntry>;
  let disabled = 0;
  const affectedSlugs: string[] = [];
  const now = Date.now();

  for (const [slug, item] of Object.entries(cache)) {
    if (!item || item.published === false) continue;
    if (!shouldDisable(slug, item)) continue;
    cache[slug] = { ...item, published: false, lastModified: now };
    disabled += 1;
    affectedSlugs.push(slug);
  }

  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), "utf8");
  const payload = {
    ok: true,
    updatedAt: new Date().toISOString(),
    cachePath: CACHE_PATH,
    disabled_count: disabled,
    affected_slugs_sample: affectedSlugs.slice(0, 50)
  };
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(payload, null, 2), "utf8");
  console.log("[zh-cleanup] disabled:", disabled);
  console.log("[zh-cleanup] report:", REPORT_PATH);
}

main();
