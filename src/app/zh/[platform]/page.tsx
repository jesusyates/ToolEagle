/**
 * v62: Topic Hub Pages - /zh/tiktok, /zh/youtube, /zh/instagram
 * 50-100 related keyword links, grouped by goal (涨粉, 变现, 做爆款, 引流)
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getKeywordsByPlatformGroupedByGoal,
  getKeywordsByPlatformGroupedByAudience,
  getKeywordsByPlatformGroupedByFormat
} from "@/lib/zh-keyword-data";
import { PLATFORM_NAMES } from "@/lib/keyword-patterns";
import { getZhPageMetadata } from "@/lib/zh-metadata";
import { ZhRelatedRecommendations } from "@/components/zh/ZhRelatedRecommendations";
import { BASE_URL } from "@/config/site";

const PLATFORMS = ["tiktok", "youtube", "instagram"] as const;
const GOALS = ["涨粉", "变现", "做爆款", "引流", "做内容", "提高完播率", "直播带货", "私域引流", "品牌打造", "算法优化", "数据分析"] as const;
const AUDIENCES = ["新手", "小白", "个人", "博主", "商家"] as const;
const FORMATS = ["教程", "方法", "技巧", "指南", "模板"] as const;

type Props = { params: Promise<{ platform: string }> };

export async function generateStaticParams() {
  return PLATFORMS.map((platform) => ({ platform }));
}

export async function generateMetadata({ params }: Props) {
  const { platform } = await params;
  if (!PLATFORMS.includes(platform as (typeof PLATFORMS)[number])) return { title: "Not Found" };
  const pName = PLATFORM_NAMES[platform as keyof typeof PLATFORM_NAMES];
  return getZhPageMetadata(`${pName} 创作者指南`, `${BASE_URL}/zh/${platform}`);
}

export default async function ZhPlatformHubPage({ params }: Props) {
  const { platform } = await params;
  if (!PLATFORMS.includes(platform as (typeof PLATFORMS)[number])) notFound();

  const byGoal = getKeywordsByPlatformGroupedByGoal(
    platform as "tiktok" | "youtube" | "instagram",
    100
  );
  const byAudience = getKeywordsByPlatformGroupedByAudience(
    platform as "tiktok" | "youtube" | "instagram",
    100
  );
  const byFormat = getKeywordsByPlatformGroupedByFormat(
    platform as "tiktok" | "youtube" | "instagram",
    100
  );
  const allSlugs = new Set([
    ...Object.values(byGoal).flatMap((a) => a.map((e) => e.slug)),
    ...Object.values(byAudience).flatMap((a) => a.map((e) => e.slug)),
    ...Object.values(byFormat).flatMap((a) => a.map((e) => e.slug))
  ]);
  const total = allSlugs.size;
  const pName = PLATFORM_NAMES[platform as keyof typeof PLATFORM_NAMES];

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">

      <div className="flex-1">
        <article className="container py-12">
          <div className="max-w-4xl">
            <nav className="text-sm text-slate-500 mb-6">
              <Link href="/zh" className="hover:text-slate-700">
                首页
              </Link>
              <span className="mx-2">/</span>
              <Link href="/zh/sitemap" className="hover:text-slate-700">中文指南</Link>
              <span className="mx-2">/</span>
              <span className="text-slate-900">{pName}</span>
            </nav>

            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
              {pName} 创作者指南
            </h1>
            <p className="mt-4 text-slate-600">
              共 {total} 篇 {pName} 相关指南，按目标分类
            </p>

            <section className="mt-10 space-y-10">
              <h2 className="text-xl font-semibold text-slate-900">按目标</h2>
              {GOALS.map((goal) => {
                const entries = byGoal[goal] ?? [];
                if (entries.length === 0) return null;
                return (
                  <div key={`goal-${goal}`}>
                    <h3 className="text-lg font-medium text-slate-800 mb-3">{goal}</h3>
                    <ul className="columns-2 sm:columns-3 gap-4 space-y-2">
                      {entries.map((e) => (
                        <li key={e.slug}>
                          <Link
                            href={`/zh/search/${e.slug}`}
                            className="text-sm text-sky-700 hover:text-sky-800 hover:underline"
                          >
                            {e.keyword}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </section>

            <section className="mt-10 space-y-10">
              <h2 className="text-xl font-semibold text-slate-900">按受众 (v63)</h2>
              {AUDIENCES.map((audience) => {
                const entries = byAudience[audience] ?? [];
                if (entries.length === 0) return null;
                return (
                  <div key={`aud-${audience}`}>
                    <h3 className="text-lg font-medium text-slate-800 mb-3">{audience}</h3>
                    <ul className="columns-2 sm:columns-3 gap-4 space-y-2">
                      {entries.map((e) => (
                        <li key={e.slug}>
                          <Link
                            href={`/zh/search/${e.slug}`}
                            className="text-sm text-sky-700 hover:text-sky-800 hover:underline"
                          >
                            {e.keyword}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </section>

            <section className="mt-10 space-y-10">
              <h2 className="text-xl font-semibold text-slate-900">按格式 (v63)</h2>
              {FORMATS.map((format) => {
                const entries = byFormat[format] ?? [];
                if (entries.length === 0) return null;
                return (
                  <div key={`fmt-${format}`}>
                    <h3 className="text-lg font-medium text-slate-800 mb-3">{format}</h3>
                    <ul className="columns-2 sm:columns-3 gap-4 space-y-2">
                      {entries.map((e) => (
                        <li key={e.slug}>
                          <Link
                            href={`/zh/search/${e.slug}`}
                            className="text-sm text-sky-700 hover:text-sky-800 hover:underline"
                          >
                            {e.keyword}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </section>

            <ZhRelatedRecommendations context={{ platform }} limit={15} />

            <div className="mt-10 flex gap-4">
              <Link href="/zh/sitemap" className="text-sky-700 hover:underline">
                ← 完整站点地图
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
