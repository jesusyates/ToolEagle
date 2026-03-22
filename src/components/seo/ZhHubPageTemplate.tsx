import Link from "next/link";
import {
  getHubOverview,
  getHubChildTopics,
  getHubInternalLinks,
  PLATFORM_NAMES,
  ZH_BASE_PATHS
} from "@/lib/zh-hub-data";
import { getRecentZhLinks } from "@/lib/zh-sitemap-data";
import { getZhHubCuriosityLinks } from "@/lib/zh-ctr";
import { DirectAnswerBlock } from "@/components/seo/DirectAnswerBlock";
import type { GuidePageType } from "@/config/traffic-topics";
import type { ZhPlatform } from "@/config/traffic-topics";

function getHubTitle(pageType: GuidePageType, platform: ZhPlatform): string {
  const pName = PLATFORM_NAMES[platform];
  const ctrTitles: Record<GuidePageType, string> = {
    "how-to": `${pName}涨粉的7个方法（2026最新完整指南合集）`,
    "ai-prompts": `${pName} AI 提示词50个（2026最新完整指南）`,
    "content-strategy": `${pName}内容策略的5个方法（2026最新完整指南）`,
    "viral-examples": `${pName}爆款案例10个（2026最新完整指南）`
  };
  return ctrTitles[pageType];
}

type Props = {
  pageType: GuidePageType;
  platform: ZhPlatform;
};

export function ZhHubPageTemplate({ pageType, platform }: Props) {
  const overview = getHubOverview(pageType, platform);
  const children = getHubChildTopics(pageType, platform);
  const internalLinks = getHubInternalLinks(pageType, platform);
  const recentLinks = getRecentZhLinks(8);
  const curiosityLinks = getZhHubCuriosityLinks(pageType, platform, 6);
  const title = getHubTitle(pageType, platform);

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <div className="flex-1">
        <article className="container py-12">
          <div className="max-w-3xl">
            <nav className="text-sm text-slate-500 mb-6" aria-label="面包屑">
              <Link href="/" className="hover:text-slate-700">
                首页
              </Link>
              <span className="mx-2">/</span>
              <Link href={`${ZH_BASE_PATHS[pageType]}/${platform}`} className="hover:text-slate-700">
                {PLATFORM_NAMES[platform]}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-slate-900">
                {pageType === "how-to" ? "涨粉指南" : pageType === "ai-prompts" ? "AI 提示词" : pageType === "content-strategy" ? "内容策略" : "爆款案例"}
              </span>
            </nav>

            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900">
              {title}
            </h1>

            <DirectAnswerBlock answer={overview} lang="zh" />

            <section className="mt-12">
              <h2 className="text-xl font-semibold text-slate-900">最新发布</h2>
              <p className="mt-2 text-slate-600">最近更新的创作者指南</p>
              <ul className="mt-4 space-y-2">
                {recentLinks.map((link, i) => (
                  <li key={i}>
                    <Link
                      href={link.href}
                      className="text-sm text-sky-700 hover:text-sky-800 hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            {children.length > 0 && (
              <section className="mt-12">
                <h2 className="text-xl font-semibold text-slate-900">
                  {PLATFORM_NAMES[platform]} 相关指南
                </h2>
                <ul className="mt-4 space-y-2">
                  {children.map((c) => (
                    <li key={c.topic}>
                      <Link
                        href={`${ZH_BASE_PATHS[pageType]}/${c.topic}`}
                        className="text-sky-700 hover:text-sky-800 hover:underline"
                      >
                        {c.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="mt-12">
              <h2 className="text-xl font-semibold text-slate-900">你可能还想看</h2>
              <p className="mt-2 text-slate-600">更多创作者必读指南</p>
              <ul className="mt-4 space-y-2">
                {curiosityLinks.map((link, i) => (
                  <li key={i}>
                    <Link
                      href={link.href}
                      className="text-sm text-sky-700 hover:text-sky-800 hover:underline font-medium"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-12">
              <h2 className="text-xl font-semibold text-slate-900">相关合集与资源</h2>
              <p className="mt-2 text-slate-600">更多平台指南、内容策略与工具</p>
              <ul className="mt-4 space-y-2 columns-1 sm:columns-2 gap-4">
                {internalLinks.map((link, i) => (
                  <li key={i}>
                    <Link
                      href={link.href}
                      className="text-sm text-sky-700 hover:text-sky-800 hover:underline block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/tools"
                className="text-sm font-medium text-sky-700 hover:text-sky-800 underline-offset-2 hover:underline"
              >
                浏览全部工具 →
              </Link>
              <Link
                href="/blog"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 underline-offset-2 hover:underline"
              >
                创作者指南 →
              </Link>
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}
