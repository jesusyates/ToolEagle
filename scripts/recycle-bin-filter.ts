#!/usr/bin/env npx tsx
/**
 * Recycle bin value filter: classify soft-deleted seo_articles → keep (restore to draft) vs delete (hard delete).
 *
 * Default: dry-run only — logs counts and caps.
 *
 *   npx tsx scripts/recycle-bin-filter.ts
 *
 * After reviewing output, apply (requires --yes):
 *
 *   npx tsx scripts/recycle-bin-filter.ts --apply-restore --yes
 *   npx tsx scripts/recycle-bin-filter.ts --apply-delete --yes
 *
 * Restore is capped at RECYCLE_RESTORE_CAP (20) IDs per run; overflow "keep" rows stay in trash until next run.
 *
 * Env: same as other admin scripts (.env.local with service role).
 */

import dotenv from "dotenv";
import path from "path";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  partitionRecycleIds,
  RECYCLE_RESTORE_CAP,
  shouldKeepFromRecycle
} from "@/lib/seo/recycle-filter";

const { resolveRepoRoot } = require("./lib/repo-root.js") as { resolveRepoRoot: (startDir?: string) => string };

const REPO = resolveRepoRoot(__dirname);
dotenv.config({ path: path.join(REPO, ".env.local") });
dotenv.config({ path: path.join(REPO, ".env") });

async function main() {
  const applyRestore = process.argv.includes("--apply-restore");
  const applyDelete = process.argv.includes("--apply-delete");
  const yes = process.argv.includes("--yes");

  const supabase = createAdminClient();

  const { data, error } = await supabase.from("seo_articles").select("id,title").eq("deleted", true);

  if (error) {
    console.error("[recycle-bin-filter] fetch error:", error.message);
    process.exit(1);
  }

  const rows = (data ?? []) as { id: string; title: string | null }[];
  const { keep, remove } = partitionRecycleIds(rows);
  const limitedKeep = keep.slice(0, RECYCLE_RESTORE_CAP);
  const keepOverflow = keep.length - limitedKeep.length;

  console.log("[RECYCLE FILTER]", {
    total: rows.length,
    keep: keep.length,
    delete: remove.length,
    restoreCap: RECYCLE_RESTORE_CAP,
    willRestoreIfApply: limitedKeep.length,
    keepOverflowRemainInTrash: keepOverflow
  });

  if (rows.length > 0 && process.argv.includes("--sample-titles")) {
    const sample = rows.slice(0, 15).map((r) => ({
      id: r.id,
      decision: shouldKeepFromRecycle(r.title ?? ""),
      title: (r.title ?? "").slice(0, 80)
    }));
    console.log("[RECYCLE FILTER] sample:", sample);
  }

  if (!applyRestore && !applyDelete) {
    console.log(
      "[recycle-bin-filter] dry-run only. To apply: --apply-restore --yes and/or --apply-delete --yes"
    );
    return;
  }

  if (!yes) {
    console.error("[recycle-bin-filter] refusing destructive steps: add --yes after reviewing the counts above.");
    process.exit(1);
  }

  if (applyRestore && limitedKeep.length > 0) {
    const { error: upErr } = await supabase
      .from("seo_articles")
      .update({ deleted: false, status: "draft" })
      .in("id", limitedKeep);
    if (upErr) {
      console.error("[recycle-bin-filter] apply-restore error:", upErr.message);
      process.exit(1);
    }
    console.log("[recycle-bin-filter] restored to draft:", limitedKeep.length, "ids");
  } else if (applyRestore) {
    console.log("[recycle-bin-filter] apply-restore: nothing to restore (empty capped list).");
  }

  if (applyDelete && remove.length > 0) {
    const { error: delErr } = await supabase.from("seo_articles").delete().in("id", remove);
    if (delErr) {
      console.error("[recycle-bin-filter] apply-delete error:", delErr.message);
      process.exit(1);
    }
    console.log("[recycle-bin-filter] hard-deleted:", remove.length, "rows");
  } else if (applyDelete) {
    console.log("[recycle-bin-filter] apply-delete: nothing to delete.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
