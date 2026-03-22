/**
 * V105.2 — China-local tool paths: Douyin stack lives at /zh/douyin-*-generator, not under /zh/tools/.
 */
export function zhToolHrefFromSlug(slug: string): string {
  if (slug.startsWith("douyin-")) {
    return `/zh/${slug}`;
  }
  return `/zh/tools/${slug}`;
}
