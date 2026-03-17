import Link from "next/link";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { SiteFooter } from "@/app/_components/SiteFooter";
import { getAllZhSitemapEntries, getZhSitemapByPlatform } from "@/lib/zh-sitemap-data";
import { PLATFORM_NAMES } from "@/lib/zh-hub-data";
import type { GuidePageType } from "@/config/traffic-topics";

const SITEMAP_TYPES: { slug: string; label: string; pageType: GuidePageType }[] = [
  { slug: "how-to", label: "涨粉指南", pageType: "how-to" },
  { slug: "content-strategy", label: "内容策略", pageType: "content-strategy" },
  { slug: "viral-examples", label: "爆款案例", pageType: "viral-examples" },
  { slug: "ai-prompts", label: "AI 提示词", pageType: "ai-prompts" }
];

export const metadata = {
  title: "中文站点地图 | 创作者指南与工具",
  description: "ToolEagle 中文创作者指南完整站点地图，涵盖 TikTok、YouTube、Instagram 涨粉、内容策略、AI 提示词与爆款案例。"
};

export default function ZhSitemapPage() {
  const byPlatform = getZhSitemapByPlatform();
  const total = getAllZhSitemapEntries().length;

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <article className="container py-12">
          <div className="max-w-4xl">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
              中文站点地图
            </h1>
            <p className="mt-4 text-slate-600">
              共 {total} 个页面，按平台分类。所有页面可在 3 次点击内从本页到达。
            </p>

            <section className="mt-10">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">按类型浏览</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {SITEMAP_TYPES.map((t) => (
                  <li key={t.slug}>
                    <Link
                      href={`/zh/sitemap/${t.slug}`}
                      className="text-sky-700 hover:text-sky-800 hover:underline font-medium"
                    >
                      {t.label} →
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-12">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">按平台浏览</h2>
              {(["tiktok", "youtube", "instagram", "general"] as const).map((platform) => {
                const entries = byPlatform[platform];
                if (entries.length === 0) return null;
                const label = platform === "general" ? "通用" : PLATFORM_NAMES[platform];
                return (
                  <div key={platform} className="mt-6">
                    <h3 className="text-lg font-medium text-slate-800">{label}</h3>
                    <ul className="mt-3 columns-2 sm:columns-3 gap-2 space-y-1">
                      {entries.slice(0, 150).map((e, i) => (
                        <li key={i}>
                          <Link
                            href={e.href}
                            className="text-sm text-sky-700 hover:text-sky-800 hover:underline"
                          >
                            {e.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    {entries.length > 150 && (
                      <p className="mt-2 text-sm text-slate-500">
                        还有 {entries.length - 150} 个页面，请按类型浏览
                      </p>
                    )}
                  </div>
                );
              })}
            </section>

            <div className="mt-10">
              <Link href="/zh/recent" className="text-sky-700 hover:underline">
                最新发布 →
              </Link>
            </div>
          </div>
        </article>
      </div>

      <SiteFooter />
    </main>
  );
}
