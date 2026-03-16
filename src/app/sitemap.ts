/**
 * Sitemap - delegates to sitemap index.
 * The actual sitemap is served via /api/sitemap-index (rewritten from /sitemap.xml).
 * This file returns a minimal fallback for Next.js sitemap convention.
 */
import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/sitemap-data";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 }];
}
