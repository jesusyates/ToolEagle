/** Slugs that belong to platform hubs, not generic category buckets. */
export function isPlatformHubScopedSlug(slug: string): boolean {
  return /^(tiktok|youtube|instagram)-/.test(slug);
}

