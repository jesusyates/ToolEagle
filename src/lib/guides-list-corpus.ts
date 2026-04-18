import { createClient } from "@/lib/supabase/server";

/**
 * `/guides` list row: **only** published `seo_articles` (no legacy markdown / auto-posts merge).
 */
export type GuidesListItem = {
  slug: string;
  title: string;
  description: string;
  /** ISO string from `created_at` (list sort key). */
  publishedAt: string;
  hashtags: string[];
  /** Reserved for future list thumbnails; list query does not load covers. */
  coverImage?: string | null;
};

export const GUIDES_LIST_PAGE_SIZE = 20;

export type GuidesListPageResult = {
  items: GuidesListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

/**
 * Paginated `/guides` index: `seo_articles` where `status = published` and `deleted = false`,
 * ordered by `created_at` DESC. Legacy markdown/json auto-post sources are not used.
 */
export async function getGuidesListPaginated(
  requestedPage: number,
  pageSize: number = GUIDES_LIST_PAGE_SIZE
): Promise<GuidesListPageResult> {
  const pageSizeClamped = Math.max(1, pageSize);
  try {
    const supabase = await createClient();

    const { count: rawCount, error: countErr } = await supabase
      .from("seo_articles")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .eq("deleted", false);

    if (countErr) {
      console.error("[guides-list-corpus] count error:", countErr.message);
      return {
        items: [],
        page: 1,
        pageSize: pageSizeClamped,
        total: 0,
        totalPages: 1
      };
    }

    const total = rawCount ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSizeClamped));
    const page = Math.min(Math.max(1, requestedPage), totalPages);
    const from = (page - 1) * pageSizeClamped;
    const to = from + pageSizeClamped - 1;

    const { data, error } = await supabase
      .from("seo_articles")
      .select("title, slug, description, created_at")
      .eq("status", "published")
      .eq("deleted", false)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("[guides-list-corpus] select error:", error.message);
      return {
        items: [],
        page,
        pageSize: pageSizeClamped,
        total,
        totalPages
      };
    }

    const items: GuidesListItem[] = (data ?? []).map((row) => {
      const created = row.created_at != null ? String(row.created_at) : "";
      return {
        slug: String(row.slug ?? "").trim(),
        title: String(row.title ?? "").trim() || String(row.slug ?? ""),
        description: typeof row.description === "string" ? row.description : "",
        publishedAt: created || new Date().toISOString(),
        hashtags: [] as string[],
        coverImage: null
      };
    }).filter((r) => r.slug.length > 0);

    return { items, page, pageSize: pageSizeClamped, total, totalPages };
  } catch (e) {
    console.error("[guides-list-corpus]", e instanceof Error ? e.message : e);
    return {
      items: [],
      page: 1,
      pageSize: pageSizeClamped,
      total: 0,
      totalPages: 1
    };
  }
}
