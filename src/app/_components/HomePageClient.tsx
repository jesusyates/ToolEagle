"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { tools, popularToolSlugs, type ToolConfig } from "@/config/tools";
import { ToolCard } from "@/components/tools/ToolCard";
import { CreatorModeDemo } from "@/components/CreatorModeDemo";
import { HomeHeroGenerate } from "./HomeHeroGenerate";
import { TopResultsShowcase } from "./TopResultsShowcase";
import { ValueProofBlock } from "@/components/value/ValueProofBlock";

const popularTools = popularToolSlugs
  .map((slug) => tools.find((t) => t.slug === slug))
  .filter((t): t is ToolConfig => t != null)
  .slice(0, 6);

const PLATFORM_OPEN_URLS: Record<string, string> = {
  tiktok: "https://www.tiktok.com/",
  youtube: "https://www.youtube.com/",
  instagram: "https://www.instagram.com/"
};

const PLATFORM_DISPLAY_NAMES: Record<string, string> = {
  tiktok: "TikTok",
  youtube: "YouTube",
  instagram: "Instagram"
};

const platformTools: Record<string, { href: string; name: string }[]> = {
  tiktok: [
    { href: "/tiktok/captions/funny", name: "Caption Generator" },
    { href: "/tiktok/hashtags/funny", name: "Hashtag Generator" },
    { href: "/tiktok/titles/gaming", name: "Title Generator" },
    { href: "/tiktok/hooks/funny", name: "Hook Generator" },
    { href: "/tiktok/bio/aesthetic", name: "Bio Generator" }
  ],
  youtube: [
    { href: "/youtube/titles/gaming", name: "Title Generator" },
    { href: "/youtube/captions/funny", name: "Caption Generator" },
    { href: "/youtube/hashtags/funny", name: "Hashtag Generator" },
    { href: "/youtube/hooks/funny", name: "Hook Generator" },
    { href: "/youtube/bio/aesthetic", name: "Bio Generator" }
  ],
  instagram: [
    { href: "/instagram/captions/funny", name: "Caption Generator" },
    { href: "/instagram/hashtags/funny", name: "Hashtag Generator" },
    { href: "/instagram/titles/gaming", name: "Title Generator" },
    { href: "/instagram/hooks/funny", name: "Hook Generator" },
    { href: "/instagram/bio/aesthetic", name: "Bio Generator" }
  ]
};

const latestArticles = [
  { href: "/blog/tiktok-caption-ideas", titleKey: "article1Title", tagKey: "article1Tag" },
  { href: "/blog/how-to-go-viral-on-tiktok", titleKey: "article2Title", tagKey: "article2Tag" },
  { href: "/blog/youtube-title-formulas", titleKey: "article3Title", tagKey: "article3Tag" }
];

type Props = {
  children?: React.ReactNode;
  /** V91: Traffic injection block (e.g. TrendingMakeMoneySection) — rendered after hero showcase */
  trendingInjection?: React.ReactNode;
};

export function HomePageClient({ children, trendingInjection }: Props) {
  const t = useTranslations("home");
  const tLearn = useTranslations("learnAi");
  const tNav = useTranslations("nav");
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <HomeHeroGenerate />

        <TopResultsShowcase />

        <section className="container py-8 max-w-3xl">
          <ValueProofBlock variant="home" />
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/tiktok-growth-kit"
              className="inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
            >
              TikTok Growth Kit — workflow →
            </Link>
            <Link
              href="/ai-caption-generator"
              className="inline-flex rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              AI Caption Generator
            </Link>
          </div>
        </section>

        {trendingInjection}

        <section className="container pt-4 pb-8">
          <div className="max-w-3xl">
            <p className="text-xs text-slate-500">{t("popularForCreators")}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Link
                href="/tools/tiktok-caption-generator"
                className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition duration-150"
              >
                {t("tiktokCaptions")}
              </Link>
              <Link
                href="/tools/hook-generator"
                className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition duration-150"
              >
                {t("hooks")}
              </Link>
              <Link
                href="/tools/hashtag-generator"
                className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition duration-150"
              >
                {t("hashtags")}
              </Link>
              <Link
                href="/ai-prompts"
                className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-700 hover:bg-sky-100 transition duration-150"
              >
                {t("aiPrompts")}
              </Link>
              <Link
                href="/ai-prompt-improver"
                className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-700 hover:bg-sky-100 transition duration-150"
              >
                {t("promptImprover")}
              </Link>
              <Link
                href="/zh/recent"
                className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-100 transition duration-150"
              >
                最新中文指南
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 pt-2">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm hover:shadow-md transition duration-150">
                <p className="text-sm font-semibold text-slate-900">{t("noSignup")}</p>
                <p className="mt-1 text-sm text-slate-600 leading-relaxed">{t("noSignupDesc")}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm hover:shadow-md transition duration-150">
                <p className="text-sm font-semibold text-slate-900">{t("creatorFirst")}</p>
                <p className="mt-1 text-sm text-slate-600 leading-relaxed">{t("creatorFirstDesc")}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm hover:shadow-md transition duration-150">
                <p className="text-sm font-semibold text-slate-900">{t("alwaysFree")}</p>
                <p className="mt-1 text-sm text-slate-600 leading-relaxed">{t("alwaysFreeDesc")}</p>
              </div>
            </div>
          </div>
        </section>

        <CreatorModeDemo />

        <section className="container py-12">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm hover:border-sky-300 hover:shadow-md transition">
              <h2 className="text-lg font-semibold text-slate-900">{t("createViralContent")}</h2>
              <p className="mt-2 text-sm text-slate-600">{t("createViralDesc")}</p>
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href="/tools/tiktok-caption-generator"
                  className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 transition"
                >
                  {t("tiktokCaptions")}
                </Link>
                <Link
                  href="/tools/hook-generator"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  {t("youtubeHooks")}
                </Link>
                <Link
                  href="/tools/instagram-caption-generator"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  {t("instagramCaptions")}
                </Link>
              </div>
            </div>
            <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm hover:border-sky-300 hover:shadow-md transition">
              <h2 className="text-lg font-semibold text-slate-900">{tLearn("title")}</h2>
              <p className="mt-2 text-sm text-slate-600">{tLearn("cardSubtitle")}</p>
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href="/ai-prompt-improver"
                  className="inline-flex items-center justify-center rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700 hover:bg-sky-100 transition"
                >
                  {tLearn("improvePrompts")}
                </Link>
                <Link
                  href="/ai-prompts"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  {tLearn("promptLibrary")}
                </Link>
                <Link
                  href="/learn-ai"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  {tNav("learnAi")}
                </Link>
              </div>
            </div>
            <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm hover:border-sky-300 hover:shadow-md transition">
              <h2 className="text-lg font-semibold text-slate-900">{t("creatorInspiration")}</h2>
              <p className="mt-2 text-sm text-slate-600">{t("creatorInspirationDesc")}</p>
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href="/examples"
                  className="inline-flex items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 hover:bg-amber-100 transition"
                >
                  {t("creatorExamples")}
                </Link>
                <Link
                  href="/creators"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  {tNav("creators")}
                </Link>
                <Link
                  href="/leaderboard"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  {t("leaderboard")}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 border-y border-slate-200">
          <div className="container py-12">
            <h2 className="text-lg font-semibold text-slate-900">{t("platformTools")}</h2>
            <p className="mt-2 text-sm text-slate-600 max-w-2xl">{t("platformToolsDesc")}</p>
            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              {(["tiktok", "youtube", "instagram"] as const).map((platform) => (
                <div
                  key={platform}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <Link href={`/${platform}-tools`} className="group block">
                    <h3 className="text-base font-semibold text-slate-900 group-hover:text-sky-700 transition">
                      {PLATFORM_DISPLAY_NAMES[platform]} {tNav("tools")} →
                    </h3>
                  </Link>
                  <ul className="mt-3 space-y-2">
                    {platformTools[platform].map(({ href, name }) => {
                      const key =
                        name === "Caption Generator"
                          ? "captionGenerator"
                          : name === "Hashtag Generator"
                            ? "hashtagGenerator"
                            : name === "Title Generator"
                              ? "titleGenerator"
                              : name === "Hook Generator"
                                ? "hookGenerator"
                                : "bioGenerator";
                      return (
                        <li key={`${platform}-${name}`}>
                          <Link
                            href={href}
                            className="text-sm text-sky-700 hover:text-sky-800 hover:underline"
                          >
                            {t(key)}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href={`/${platform}/captions/funny`}
                      className="text-xs font-medium text-slate-600 hover:text-slate-900"
                    >
                      {t("browseIdeas", { platform: PLATFORM_DISPLAY_NAMES[platform] })}
                    </Link>
                    <a
                      href={PLATFORM_OPEN_URLS[platform]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-sky-600 hover:text-sky-800"
                    >
                      {t("openPlatform", { platform: PLATFORM_DISPLAY_NAMES[platform] })}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container py-12">
          <h2 className="text-lg font-semibold text-slate-900">{t("popularTools")}</h2>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl">{t("popularToolsDesc")}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popularTools.map((tool) => (
              <ToolCard
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                icon={tool.icon}
                name={tool.name}
                description={tool.description}
                category={tool.category}
              />
            ))}
          </div>
        </section>

        <section className="container py-12">
          <h2 className="text-lg font-semibold text-slate-900">{t("whyToolEagle")}</h2>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl">{t("whyToolEagleDesc")}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">{t("builtForSpeed")}</p>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{t("builtForSpeedDesc")}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">{t("creatorNativeUx")}</p>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{t("creatorNativeUxDesc")}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">{t("alwaysImproving")}</p>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{t("alwaysImprovingDesc")}</p>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 border-t border-slate-200">
          <div className="container py-12">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{t("latestArticles")}</h2>
                <p className="mt-2 text-sm text-slate-600">{t("latestArticlesDesc")}</p>
              </div>
              <Link
                href="/blog"
                className="text-sm text-sky-700 hover:text-sky-800 underline-offset-2 hover:underline transition duration-150"
              >
                {t("viewAllArticles")}
              </Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {latestArticles.map((article) => (
                <Link
                  key={article.href}
                  href={article.href}
                  className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition duration-150"
                >
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <span className="px-2 py-1 rounded-full border border-slate-200 bg-slate-50">
                      {t(article.tagKey)}
                    </span>
                    <span>{t("playbook")}</span>
                  </div>
                  <p className="text-base font-semibold text-slate-900">{t(article.titleKey)}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {children}
      </div>

      <SiteFooter />
    </main>
  );
}
