import type { SupabaseClient } from "@supabase/supabase-js";
import type { SeoArticleCorpusRow } from "./types";

/**
 * Load non-deleted seo_articles for gap analysis (titles + slugs; no separate keyword column in DB).
 */
export async function fetchSeoArticlesCorpus(db: SupabaseClient): Promise<SeoArticleCorpusRow[]> {
  const { data, error } = await db
    .from("seo_articles")
    .select("slug,title,description,status")
    .eq("deleted", false);

  if (error) {
    throw new Error(`fetchSeoArticlesCorpus: ${error.message}`);
  }

  return (data ?? []).map((r) => ({
    slug: String((r as { slug?: unknown }).slug ?? ""),
    title: String((r as { title?: unknown }).title ?? ""),
    description: (r as { description?: unknown }).description != null ? String((r as { description: unknown }).description) : null,
    status: String((r as { status?: unknown }).status ?? "")
  })) as SeoArticleCorpusRow[];
}

/** Published / scheduled / draft rows — used to build historical topic exclusion (not gap coverage). */
export function filterCorpusForHistoricalTopicExclusion(rows: SeoArticleCorpusRow[]): SeoArticleCorpusRow[] {
  return rows.filter((r) => {
    const s = r.status.toLowerCase();
    return s === "published" || s === "scheduled" || s === "draft";
  });
}
