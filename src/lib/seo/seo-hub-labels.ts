/** User-facing labels for SEO admin hub (no internal field names in UI). */

export function friendlySeoListLabel(row: {
  status: string;
  deleted?: boolean;
  review_status?: string | null;
}): string {
  if (row.deleted) return "已删除";
  if (row.status === "scheduled") return "已排期";
  if (row.status === "published") return "已发布";
  if (row.status === "draft") {
    if (row.review_status === "publish_ready") return "可发布";
    if (row.review_status === "needs_revision") return "待修改";
    return "草稿";
  }
  return row.status;
}
