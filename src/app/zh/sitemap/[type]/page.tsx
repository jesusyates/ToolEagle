import Link from "next/link";
import { notFound } from "next/navigation";
import { getZhSitemapByPlatform, getAllZhSitemapEntries } from "@/lib/zh-sitemap-data";
import { PLATFORM_NAMES } from "@/lib/zh-hub-data";
import type { GuidePageType } from "@/config/traffic-topics";

const TYPE_MAP: Record<string, { pageType: GuidePageType; label: string }> = {
  "how-to": { pageType: "how-to", label: "涨粉指南" },
  "content-strategy": { pageType: "content-strategy", label: "内容策略" },
  "viral-examples": { pageType: "viral-examples", label: "爆款案例" },
  "ai-prompts": { pageType: "ai-prompts", label: "AI 提示词" }
};

type Props = { params: Promise<{ type: string }> };

export async function generateStaticParams() {
  return Object.keys(TYPE_MAP).map((type) => ({ type }));
}

export async function generateMetadata({ params }: Props) {
  const { type } = await params;
  const config = TYPE_MAP[type];
  if (!config) return { title: "Not Found" };
  return {
    title: `${config.label} 站点地图 | 中文创作者指南`,
    description: `ToolEagle ${config.label} 完整列表，按 TikTok、YouTube、Instagram 分类。`
  };
}

export default async function ZhSitemapTypePage({ params }: Props) {
  const { type } = await params;
  const config = TYPE_MAP[type];
  if (!config) notFound();

  const byPlatform = getZhSitemapByPlatform(config.pageType);
  const allForType = getAllZhSitemapEntries().filter((e) => e.pageType === config.pageType);
  const total = allForType.length;

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">

      <div className="flex-1">
        <article className="container py-12">
          <div className="max-w-4xl">
            <nav className="text-sm text-slate-500 mb-6">
              <Link href="/" className="hover:text-slate-700">首页</Link>
              <span className="mx-2">/</span>
              <Link href="/zh/sitemap" className="hover:text-slate-700">站点地图</Link>
              <span className="mx-2">/</span>
              <span className="text-slate-900">{config.label}</span>
            </nav>

            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
              {config.label} 站点地图
            </h1>
            <p className="mt-4 text-slate-600">
              共 {total} 个页面，按平台分类。
            </p>

            <section className="mt-10">
              {(["tiktok", "youtube", "instagram", "general"] as const).map((platform) => {
                const entries = byPlatform[platform];
                if (entries.length === 0) return null;
                const label = platform === "general" ? "通用" : PLATFORM_NAMES[platform];
                return (
                  <div key={platform} className="mt-8">
                    <h2 className="text-xl font-semibold text-slate-900">{label}</h2>
                    <ul className="mt-3 columns-2 sm:columns-3 lg:columns-4 gap-2 space-y-1">
                      {entries.map((e, i) => (
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
                  </div>
                );
              })}
            </section>

            <div className="mt-10 flex gap-4">
              <Link href="/zh/sitemap" className="text-sky-700 hover:underline">
                ← 返回站点地图
              </Link>
              <Link href="/zh/recent" className="text-sky-700 hover:underline">
                最新发布 →
              </Link>
            </div>
          </div>
        </article>
      </div>

    </main>
  );
}
