/**
 * Cap App Router `generateStaticParams` output on Vercel (and optional local CI)
 * to avoid 45m+ build timeouts. Uncapped paths still render on-demand when
 * `dynamicParams` is true (Next.js default).
 *
 * Env (Vercel sets VERCEL=1 automatically):
 * - NEXT_LIMIT_STATIC_PARAMS=1 — force cap locally
 * - NEXT_STATIC_PAGE_CAP — default 80
 * - NEXT_STATIC_BLOG_MDX_CAP — default 400
 * - NEXT_STATIC_BLOG_PROGRAMMATIC_CAP — default 96
 */

export function shouldLimitStaticParamBuild(): boolean {
  return process.env.VERCEL === "1" || process.env.NEXT_LIMIT_STATIC_PARAMS === "1";
}

/** Max static paths per segment when limiting (Vercel / NEXT_LIMIT_STATIC_PARAMS). */
export function getBuildStaticPageCap(): number {
  if (!shouldLimitStaticParamBuild()) return Number.POSITIVE_INFINITY;
  return Math.max(1, parseInt(process.env.NEXT_STATIC_PAGE_CAP || "80", 10) || 80);
}

export function limitBuildStaticParams<T extends Record<string, unknown>>(items: T[]): T[] {
  const cap = getBuildStaticPageCap();
  if (cap === Number.POSITIVE_INFINITY) return items;
  return items.slice(0, cap);
}

export function limitBuildStaticBlogMdx<T extends Record<string, string>>(items: T[]): T[] {
  if (!shouldLimitStaticParamBuild()) return items;
  const cap = Math.max(50, parseInt(process.env.NEXT_STATIC_BLOG_MDX_CAP || "400", 10) || 400);
  return items.slice(0, cap);
}

export function limitBuildStaticBlogProgrammatic<T extends Record<string, string>>(items: T[]): T[] {
  if (!shouldLimitStaticParamBuild()) return items;
  const cap = Math.max(16, parseInt(process.env.NEXT_STATIC_BLOG_PROGRAMMATIC_CAP || "96", 10) || 96);
  return items.slice(0, cap);
}
