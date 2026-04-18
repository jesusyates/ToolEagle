/** Publish / quality gates shared by draft generation and automation pipeline (no circular imports). */

export type AutoFixArticle = {
  title?: string;
  content?: string;
  articleId?: string | null;
};

export function isAllowedGenerationTitle(title: string): boolean {
  const t = title.toLowerCase();

  if (
    t.includes("messy") ||
    t.includes("sustainable") ||
    t.includes("real talk") ||
    t.includes("beginner")
  ) {
    return false;
  }

  if (
    t.startsWith("how to") ||
    t.startsWith("best") ||
    t.includes(" vs ") ||
    t.includes("example") ||
    t.includes("compared")
  ) {
    return true;
  }

  return false;
}

export function autoFixSeoDraft(
  article: AutoFixArticle | null
): (AutoFixArticle & { title: string; content: string }) | null {
  if (!article) return null;

  let title = (article.title || "").trim();
  let content = (article.content || "").trim();

  title = title.replace(/\s+/g, " ").trim();
  content = content.replace(/\n{3,}/g, "\n\n").trim();

  if (content.length < 1200) return null;

  if (!content.includes("##")) return null;

  if (!isAllowedGenerationTitle(title)) return null;

  return {
    ...article,
    title,
    content
  };
}

export function isPublishReadyArticle(article: AutoFixArticle | null): boolean {
  if (!article) return false;
  const title = (article.title || "").trim();
  const content = (article.content || "").trim().toLowerCase();

  if (!isAllowedGenerationTitle(title)) return false;
  if (content.length < 1200) return false;
  if (!content.includes("##")) return false;

  const tl = title.toLowerCase();
  if (tl.includes("messy") || tl.includes("sustainable") || tl.includes("real talk")) {
    return false;
  }

  return true;
}
