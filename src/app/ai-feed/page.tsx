/**
 * V79: AI Feed - dense, link-rich page for AI crawlers.
 * Simple HTML, no heavy UI, pure links + short summaries.
 */

import { Metadata } from "next";
import Link from "next/link";
import { getKeywordContent } from "@/lib/zh-keyword-content";
import { getAllEnHowToSlugs, getEnHowToContent } from "@/lib/en-how-to-content";
import { getLatestKeywordPages } from "@/lib/zh-keyword-data";
import { BASE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "AI Feed - Latest Answers & Guides | ToolEagle",
  description: "Continuously updated index of creator guides, how-to answers, and keyword pages. TikTok, YouTube, Instagram.",
  robots: { index: true, follow: true }
};

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function AiFeedPage() {
  const enSlugs = getAllEnHowToSlugs();
  const latest = getLatestKeywordPages(50);

  const zhEntries = latest.map((k) => {
    const content = getKeywordContent(k.slug);
    return {
      href: `/zh/search/${k.slug}`,
      label: k.keyword,
      summary: content?.directAnswer?.slice(0, 80) || content?.description?.slice(0, 80) || ""
    };
  });

  const enEntries = enSlugs.slice(0, 50).map((slug) => {
    const content = getEnHowToContent(slug);
    return {
      href: `/en/how-to/${slug}`,
      label: content?.title ?? slug,
      summary: content?.directAnswer?.slice(0, 80) || content?.description?.slice(0, 80) || ""
    };
  });

  return (
    <main className="min-h-screen bg-page text-slate-900 p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">AI Feed</h1>
      <p className="text-slate-600 text-sm mb-8">
        Latest answers and guides. Updated frequently. Dense link index for discovery.
      </p>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">Latest Keyword Pages (ZH)</h2>
        <ul className="space-y-3">
          {zhEntries.map((e) => (
            <li key={e.href}>
              <Link href={e.href} className="text-sky-700 hover:underline font-medium">
                {e.label}
              </Link>
              {e.summary && (
                <p className="text-sm text-slate-600 mt-0.5">{e.summary}…</p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">EN How-To Guides</h2>
        <ul className="space-y-3">
          {enEntries.map((e) => (
            <li key={e.href}>
              <Link href={e.href} className="text-sky-700 hover:underline font-medium">
                {e.label}
              </Link>
              {e.summary && (
                <p className="text-sm text-slate-600 mt-0.5">{e.summary}…</p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">Question Hubs</h2>
        <ul className="space-y-2">
          <li>
            <Link href="/questions/tiktok" className="text-sky-700 hover:underline">
              TikTok Questions (50–200 links)
            </Link>
          </li>
          <li>
            <Link href="/questions/youtube" className="text-sky-700 hover:underline">
              YouTube Questions (50–200 links)
            </Link>
          </li>
          <li>
            <Link href="/questions/instagram" className="text-sky-700 hover:underline">
              Instagram Questions (50–200 links)
            </Link>
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Tools</h2>
        <ul className="space-y-2">
          <li>
            <Link href="/tools/tiktok-caption-generator" className="text-sky-700 hover:underline">
              TikTok Caption Generator
            </Link>
          </li>
          <li>
            <Link href="/tools/youtube-title-generator" className="text-sky-700 hover:underline">
              YouTube Title Generator
            </Link>
          </li>
          <li>
            <Link href="/tools/hook-generator" className="text-sky-700 hover:underline">
              Hook Generator
            </Link>
          </li>
          <li>
            <Link href="/zh/sitemap" className="text-sky-700 hover:underline">
              Chinese Sitemap
            </Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
