import * as dotenv from "dotenv";
/**
 * Builds generated/seo-history-ledger.json from published seo_articles (lightweight summaries only).
 * Run: npm run seo:history-ledger
 */
import fs from "node:fs/promises";
import path from "node:path";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  articleRowToLedgerItem,
  ledgerRelativePath,
  type SeoHistoryLedger
} from "@/lib/seo-draft-generation/seo-history-ledger";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

console.log("[SEO HISTORY LEDGER] env url:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("[SEO HISTORY LEDGER] env service:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log("[SEO HISTORY LEDGER] env anon:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function isWeakHistoricalTitle(title: string): boolean {
  const t = (title || "").toLowerCase();

  return (
    t.includes("from messy to manageable") ||
    t.includes("beginner's guide") ||
    t.includes("beginners guide") ||
    t.includes("real talk") ||
    t.includes("build a sustainable") ||
    t.includes("a clear ") ||
    t.includes("stop guessing") ||
    t.includes("roadmap") ||
    t.includes("goals") ||
    t.includes("systems")
  );
}

async function main() {
  const root = process.cwd();
  const admin = createAdminClient();

  const { count: publishedTotal, error: countErr } = await admin
    .from("seo_articles")
    .select("*", { count: "exact", head: true })
    .eq("status", "published")
    .eq("deleted", false);

  if (countErr) {
    console.error("[SEO HISTORY LEDGER] count error:", countErr.message);
    process.exit(1);
  }

  const { data, error } = await admin
    .from("seo_articles")
    .select("id,title,slug,status,description,content,review_status")
    .eq("status", "published")
    .eq("deleted", false)
    .eq("review_status", "publish_ready");

  if (error) {
    console.error("[SEO HISTORY LEDGER] query error:", error.message);
    process.exit(1);
  }

  const rows = (data ?? []) as Record<string, unknown>[];
  const publishedTotalN = typeof publishedTotal === "number" ? publishedTotal : 0;
  console.log("[SEO HISTORY LEDGER] published_ready_count:", rows.length);

  const itemsBeforeClean = rows
    .filter((r) => String(r.id ?? "").trim() && String(r.title ?? "").trim())
    .map((r) =>
      articleRowToLedgerItem({
        id: String(r.id ?? ""),
        title: String(r.title ?? ""),
        slug: String(r.slug ?? ""),
        status: String(r.status ?? "published"),
        description: r.description != null ? String(r.description) : null,
        content: String(r.content ?? "")
      })
    );

  const rawCount = itemsBeforeClean.length;
  const items = itemsBeforeClean.filter((item) => !isWeakHistoricalTitle(item.title));

  console.log("[SEO HISTORY LEDGER] before title-clean:", rawCount);
  console.log("[SEO HISTORY LEDGER] after title-clean:", items.length);

  const out: SeoHistoryLedger = {
    updatedAt: new Date().toISOString(),
    totalPublished: items.length,
    items
  };

  const outPath = path.join(root, ledgerRelativePath());
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(out, null, 2)}\n`, "utf8");

  console.log("[SEO HISTORY LEDGER] built:", items.length);
  if (items.length === 0) {
    if (rawCount > 0) {
      console.log(
        "[SEO HISTORY LEDGER] why_zero: all publish_ready ledger candidates were removed by title-clean (raw=",
        rawCount,
        ")"
      );
    } else if (publishedTotalN > 0) {
      console.log(
        "[SEO HISTORY LEDGER] why_zero: no rows match review_status=publish_ready (published_deleted_false=",
        publishedTotalN,
        ") — backfill review_status or publish only QA-ready articles"
      );
    } else {
      console.log("[SEO HISTORY LEDGER] why_zero: no published rows (deleted=false) in database");
    }
  }
}

main().catch((e) => {
  console.error("[SEO HISTORY LEDGER] fatal:", e);
  process.exit(1);
});
