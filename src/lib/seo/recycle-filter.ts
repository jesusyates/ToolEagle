/**
 * Heuristic triage for soft-deleted `seo_articles`: which titles are worth restoring to draft vs hard-delete.
 * Does not touch the database.
 */

export type RecycleDecision = "keep" | "delete";

/** Max IDs to restore from recycle → draft in one apply run (see recycle-bin-filter script). */
export const RECYCLE_RESTORE_CAP = 20;

export function shouldKeepFromRecycle(title: string): RecycleDecision {
  const t = (title || "").toLowerCase();

  // 必须像搜索词
  const hasIntent = /^(how to|best|.+ vs .+|.+ examples)/i.test(title);

  // 必须有具体对象
  const hasObject = /(blog|email|copy|ai|content|marketing)/i.test(t);

  // 垃圾特征
  const isTrash =
    /(that works? well|playbook|system|framework|strategy)/i.test(t) || t.split(/\s+/).filter(Boolean).length < 4;

  if (hasIntent && hasObject && !isTrash) {
    return "keep";
  }

  return "delete";
}

export function partitionRecycleIds(rows: { id: string; title: string | null }[]): {
  keep: string[];
  remove: string[];
} {
  const keep: string[] = [];
  const remove: string[] = [];
  for (const row of rows) {
    const decision = shouldKeepFromRecycle(row.title ?? "");
    if (decision === "keep") {
      keep.push(row.id);
    } else {
      remove.push(row.id);
    }
  }
  return { keep, remove };
}
