import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isSafePublicImageUrl } from "@/lib/seo/article-cover";

export type PublishedGuideArticle = {
  title: string;
  content: string;
  description: string | null;
  cover_image: string | null;
  cover_image_alt: string | null;
  created_at?: string;
  updated_at?: string;
};

/** 用 `*`：远端若未跑 0044 等迁移，显式列名会报「column … does not exist」；`*` 只返回实际存在的列。 */
function mapRow(
  data: Record<string, unknown>,
  slugHint: string
): PublishedGuideArticle | null {
  if (data.content == null) return null;
  const content = String(data.content);
  const rawTitle = data.title != null ? String(data.title).trim() : "";
  const slug = data.slug != null ? String(data.slug).trim() : "";
  const title =
    rawTitle ||
    slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ||
    slugHint ||
    "Untitled";

  const coverRaw = data.cover_image != null ? String(data.cover_image) : "";
  const cover_image =
    coverRaw && isSafePublicImageUrl(coverRaw) ? coverRaw.trim() : null;
  const altRaw = data.cover_image_alt != null ? String(data.cover_image_alt).trim() : "";
  return {
    title,
    content,
    description: data.description != null ? String(data.description) : null,
    cover_image,
    cover_image_alt: altRaw.length > 0 ? altRaw : null,
    created_at: data.created_at != null ? String(data.created_at) : undefined,
    updated_at: data.updated_at != null ? String(data.updated_at) : undefined
  };
}

/** URL 段解码、trim、Unicode NFC（避免 NFC/NFD 与库内 slug 不一致） */
export function normalizeGuideSlugFromUrl(raw: string): string {
  let s = raw.trim();
  try {
    s = decodeURIComponent(s);
  } catch {
    /* 已是解码 */
  }
  s = s.trim();
  try {
    s = s.normalize("NFC");
  } catch {
    /* ignore */
  }
  return s;
}

/**
 * 读取已发布且未删除的 SEO 文章（供 /guides/[slug]）。
 * 多路径：anon → admin 同 key → ilike 大小写不敏感（仅 ASCII slug，避免 LIKE 特殊字符问题）。
 */
export async function getPublishedGuideArticleFromDb(
  slugFromRoute: string
): Promise<PublishedGuideArticle | null> {
  const normalized = normalizeGuideSlugFromUrl(slugFromRoute);
  if (!normalized) return null;

  const adminEq = () =>
    createAdminClient()
      .from("seo_articles")
      .select("*")
      .eq("slug", normalized)
      .eq("status", "published")
      .eq("deleted", false)
      .maybeSingle();

  /** 仅 [a-zA-Z0-9-]；无 %/_ 则可用 ILIKE 做大小写不敏感精确匹配 */
  const adminIlikeCaseInsensitive = () => {
    if (!/^[a-zA-Z0-9-]+$/.test(normalized)) return Promise.resolve({ data: null, error: null });
    return createAdminClient()
      .from("seo_articles")
      .select("*")
      .ilike("slug", normalized)
      .eq("status", "published")
      .eq("deleted", false)
      .maybeSingle();
  };

  try {
    const supabase = await createClient();
    const first = await supabase
      .from("seo_articles")
      .select("*")
      .eq("slug", normalized)
      .eq("status", "published")
      .eq("deleted", false)
      .maybeSingle();
    if (!first.error && first.data) {
      const out = mapRow(first.data as Record<string, unknown>, normalized);
      if (out) return out;
    }

    const second = await adminEq();
    if (!second.error && second.data) {
      const out = mapRow(second.data as Record<string, unknown>, normalized);
      if (out) return out;
    }

    const third = await adminIlikeCaseInsensitive();
    if (!third.error && third.data) {
      const out = mapRow(third.data as Record<string, unknown>, normalized);
      if (out) return out;
    }
  } catch (e) {
    console.error("[getPublishedGuideArticleFromDb]", e);
  }

  return null;
}
