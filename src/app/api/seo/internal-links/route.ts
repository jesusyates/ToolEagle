/**
 * V93 / V93.1: Locale-safe internal links for programmatic slugs
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchInternalLinksForSlug, keywordToSlug, type PseoLocale } from "@/lib/programmatic-seo";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slugRaw = searchParams.get("slug") || "";
    const slug = keywordToSlug(slugRaw);
    if (!slug || slug === "keyword") {
      return NextResponse.json({ error: "Missing or invalid slug" }, { status: 400 });
    }

    const localeParam = (searchParams.get("locale") || "en").toLowerCase();
    const locale: PseoLocale = localeParam === "zh" ? "zh" : "en";

    const limit = Math.min(30, Math.max(4, parseInt(searchParams.get("limit") || "12", 10)));
    const admin = createAdminClient();
    const { primary, crossLocale } = await fetchInternalLinksForSlug(admin, slug, limit, locale);

    return NextResponse.json({
      slug,
      locale,
      count: primary.length,
      links: primary,
      crossLocaleLinks: crossLocale
    });
  } catch (e) {
    console.error("[seo/internal-links]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
