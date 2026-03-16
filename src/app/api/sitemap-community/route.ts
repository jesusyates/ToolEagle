import { NextResponse } from "next/server";
import { BASE_URL, sitemapToXml } from "@/lib/sitemap-data";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

const TYPE_ROUTES: Record<string, string> = {
  prompt: "prompts",
  idea: "ideas",
  guide: "guides"
};

export async function GET() {
  try {
    const now = new Date();
    const urls: { url: string; lastModified: Date; changeFrequency: "weekly"; priority: number }[] = [];

    const supabase = createAdminClient();
    const { data: posts } = await supabase
      .from("creator_posts")
      .select("type, slug, created_at")
      .eq("status", "published");

    if (posts) {
      for (const p of posts) {
        const route = TYPE_ROUTES[p.type] ?? "prompts";
        urls.push({
          url: `${BASE_URL}/community/${route}/${p.slug}`,
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.75
        });
      }
    }

    const { data: creators } = await supabase.from("creators").select("username");
    if (creators) {
      for (const c of creators) {
        urls.push({
          url: `${BASE_URL}/creators/${c.username}`,
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.8
        });
      }
    }

    const xml = sitemapToXml(urls);
    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600"
      }
    });
  } catch (err) {
    console.error("[sitemap-community]", err);
    return new NextResponse("Sitemap temporarily unavailable", { status: 500 });
  }
}
