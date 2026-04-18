import type { SupabaseClient } from "@supabase/supabase-js";
import type { SeoPreflightCandidateResult, SeoPreflightContentType } from "@/lib/seo-preflight/types/preflight";
import { classifyDraftForRecycle } from "./seo-draft-quality";

const DEFAULT_OUTLINE_HEADINGS = [
  "Problem framing",
  "Principles",
  "Playbook steps",
  "Real-world cues",
  "Pitfalls",
  "What to do next"
];

function extractH2Headings(content: string): string[] {
  const out: string[] = [];
  for (const line of content.split(/\n/)) {
    const m = /^##\s+(.+)$/.exec(line.trim());
    if (m) out.push(m[1]!.trim());
  }
  return out;
}

function parseQualityReasons(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x));
  }
  return [];
}

type DraftRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string;
  quality_reasons: unknown;
  publish_scheduled_at: string | null;
};

/**
 * Load saved `draft` + `needs_revision` rows that classify as `needs_rewrite`, not yet retried, not scheduled.
 * Capped by `maxCount` (oldest `updated_at` first).
 */
export async function fetchNeedsRewriteRetryDrafts(
  db: SupabaseClient,
  retriedIds: Set<string>,
  input: {
    market: string;
    locale: string;
    contentLanguage: string;
    contentType: SeoPreflightContentType;
  },
  maxCount: number
): Promise<SeoPreflightCandidateResult[]> {
  if (maxCount <= 0) return [];

  const { data, error } = await db
    .from("seo_articles")
    .select("id,slug,title,description,content,quality_reasons,publish_scheduled_at,updated_at")
    .eq("status", "draft")
    .eq("deleted", false)
    .eq("review_status", "needs_revision")
    .order("updated_at", { ascending: true });

  if (error) {
    console.log("[SEO RECYCLE] fetch_needs_rewrite_failed:", error.message);
    return [];
  }

  const rows = (data ?? []) as DraftRow[];
  const candidates: SeoPreflightCandidateResult[] = [];

  for (const row of rows) {
    if (candidates.length >= maxCount) break;
    if (row.publish_scheduled_at) continue;
    if (retriedIds.has(row.id)) continue;

    const reasons = parseQualityReasons(row.quality_reasons);
    const cls = classifyDraftForRecycle({ title: row.title, quality_reasons: reasons });
    if (cls !== "needs_rewrite") continue;

    const h2 = extractH2Headings(String(row.content || ""));
    const outlineHeadings = h2.length >= 4 ? h2 : DEFAULT_OUTLINE_HEADINGS;

    candidates.push({
      topic: row.title,
      approved: true,
      rejectReason: null,
      title: row.title,
      slug: row.slug,
      description: row.description ?? "",
      outlineHeadings,
      estimatedCost: 0.12,
      market: input.market,
      locale: input.locale,
      contentLanguage: input.contentLanguage,
      contentType: input.contentType,
      existingArticleId: row.id
    });
  }

  return candidates;
}
