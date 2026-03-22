"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ZhCopyButton } from "@/components/zh/ZhCopyButton";
import { GuidedPostingModal } from "@/components/distribution/GuidedPostingModal";
import { InjectionPriorityPackBlock } from "@/components/traffic/InjectionPriorityPackBlock";
import { ZhDistributionPlatformHub } from "@/components/dashboard/ZhDistributionPlatformHub";

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + "...";
}

type Item = {
  slug: string;
  keyword: string;
  title: string;
  oneLiner: string;
  pageUrl: string;
  embedUrl: string;
};

type BestKeyword = { keyword: string; views: number; clicks: number; generates: number };

type Stats = { postsShared: number; byPlatform: Record<string, number> };

type ExecutionStats = {
  todayByPlatform: { reddit: number; x: number; quora: number };
  streak: number;
  totalPosts: number;
};

type QueueItem = {
  id: string;
  slug: string;
  page_type: string;
  title: string;
  one_liner: string;
  page_url: string;
  reddit_title: string;
  reddit_body: string;
  x_thread: string;
  quora_answer: string;
  status: string;
  priority?: "high" | "normal";
  postedPlatforms?: string[];
};

type TopPage = { slug: string; title: string; url: string };

type Props = {
  items: Item[];
};

const DAILY_TASKS = [
  { platform: "reddit" as const, target: 5, labelKey: "dailyTaskReddit" as const },
  { platform: "x" as const, target: 3, labelKey: "dailyTaskX" as const },
  { platform: "quora" as const, target: 2, labelKey: "dailyTaskQuora" as const }
];

const REWARD_ATS = [5, 10, 20] as const;

function rewardMessageKey(at: number): "rewardAt5" | "rewardAt10" | "rewardAt20" {
  if (at === 5) return "rewardAt5";
  if (at === 10) return "rewardAt10";
  return "rewardAt20";
}

/** 中文站：本土增长与 SEO 枢纽；海外 Reddit/X/Quora 分发见 `OverseasDistributionClient`（locale=en）。 */
export function DistributionClient(props: Props) {
  const locale = useLocale();
  if (locale === "zh") {
    return <ZhDistributionPlatformHub />;
  }
  return <OverseasDistributionClient {...props} />;
}

function OverseasDistributionClient({ items }: Props) {
  const t = useTranslations("distributionDashboard");
  const dashBase = "/dashboard/distribution";
  const [bestKeywords, setBestKeywords] = useState<BestKeyword[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [execution, setExecution] = useState<ExecutionStats | null>(null);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [guidedItem, setGuidedItem] = useState<QueueItem | null>(null);
  const [guidedPlatform, setGuidedPlatform] = useState<"reddit" | "x" | "quora">("reddit");

  useEffect(() => {
    fetch("/api/distribution/keywords")
      .then((r) => r.json())
      .then((d) => setBestKeywords(d.keywords ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/distribution/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/distribution/execution")
      .then((r) => r.json())
      .then(setExecution)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/distribution/queue")
      .then((r) => r.json())
      .then((d) => setQueueItems(d.items ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/distribution/top-pages")
      .then((r) => r.json())
      .then((d) => setTopPages(d.topPages ?? []))
      .catch(() => {});
  }, []);

  async function markAsPosted(id: string, platform: "reddit" | "x" | "quora") {
    const res = await fetch("/api/distribution/queue/mark-posted", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, platform })
    });
    if (res.ok) {
      setQueueItems((prev) =>
        prev.map((q) =>
          q.id === id
            ? { ...q, postedPlatforms: [...(q.postedPlatforms ?? []), platform] }
            : q
        )
      );
      fetch("/api/distribution/stats")
        .then((r) => r.json())
        .then(setStats)
        .catch(() => {});
      fetch("/api/distribution/execution")
        .then((r) => r.json())
        .then(setExecution)
        .catch(() => {});
    }
  }

  function openGuided(item: QueueItem, platform: "reddit" | "x" | "quora") {
    setGuidedItem(item);
    setGuidedPlatform(platform);
  }

  const today = execution?.todayByPlatform ?? { reddit: 0, x: 0, quora: 0 };
  const totalToday = today.reddit + today.x + today.quora;
  const nextRewardAt = REWARD_ATS.find((m) => (execution?.totalPosts ?? 0) < m);
  const postsToUnlock = nextRewardAt
    ? nextRewardAt - (execution?.totalPosts ?? 0)
    : 0;

  return (
    <div className="mt-8 space-y-8">
      <GuidedPostingModal
        open={!!guidedItem}
        onClose={() => setGuidedItem(null)}
        item={guidedItem}
        platform={guidedPlatform}
        onDone={() => guidedItem && markAsPosted(guidedItem.id, guidedPlatform)}
      />

      {/* What this page is + where 抖音/小红书/快手 live */}
      <div className="rounded-xl border border-violet-200 bg-violet-50/90 p-5 text-sm text-slate-800">
        <h3 className="font-semibold text-slate-900">{t("tutorialTitle")}</h3>
        <p className="mt-2 leading-relaxed">{t("tutorialP1")}</p>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-slate-700">
          <li>{t("tutorialStep1")}</li>
          <li>{t("tutorialStep2")}</li>
          <li>{t("tutorialStep3")}</li>
        </ol>
        <p className="mt-3 border-t border-violet-200/80 pt-3 leading-relaxed text-slate-700">
          {t("tutorialDomesticP1")}
        </p>
      </div>

      {/* Daily Task List + Progress */}
      <div className="rounded-xl border-2 border-sky-200 bg-sky-50 p-6">
        <h3 className="font-semibold text-slate-900">{t("dailyTaskTitle")}</h3>
        <p className="mt-1 text-sm text-slate-600">{t("dailyTaskSubtitle")}</p>
        <div className="mt-4 space-y-3">
          {DAILY_TASKS.map(({ platform, target, labelKey }) => {
            const completed = today[platform] ?? 0;
            const pct = Math.min(100, (completed / target) * 100);
            return (
              <div key={platform} className="flex items-center gap-4">
                <div className="w-40 text-sm font-medium text-slate-700 sm:w-44">
                  {t(labelKey)}
                </div>
                <div className="flex-1">
                  <div className="h-2 rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <span className="w-16 text-right text-sm font-medium text-slate-800">
                  {completed} / {target}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-sm font-medium text-slate-700">
          {t("progressToday", { done: totalToday })}
        </p>
      </div>

      <InjectionPriorityPackBlock />

      {/* Streak */}
      {execution && execution.streak > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="font-semibold text-amber-900">
            🔥 {t("streakTitle", { days: execution.streak })}
          </p>
          <p className="mt-1 text-sm text-amber-800">{t("streakSubtitle")}</p>
        </div>
      )}

      {/* Reward Loop */}
      {nextRewardAt && (
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-5">
          <p className="font-medium text-violet-900">{t(rewardMessageKey(nextRewardAt))}</p>
          <p className="mt-1 text-sm text-violet-700">
            {t("morePostsToUnlock", { n: postsToUnlock })}
          </p>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <h3 className="font-semibold text-slate-900">{t("statsTitle")}</h3>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            {t("statsPostsShared", { n: stats.postsShared })}
          </p>
          {stats.postsShared > 0 && (
            <p className="mt-1 text-sm text-slate-600">
              {t("statsByPlatform", {
                reddit: stats.byPlatform.reddit ?? 0,
                x: stats.byPlatform.x ?? 0,
                quora: stats.byPlatform.quora ?? 0
              })}
            </p>
          )}
        </div>
      )}

      {/* Top Performing Content */}
      {topPages.length > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5">
          <h3 className="font-semibold text-slate-900">{t("topContentTitle")}</h3>
          <p className="mt-1 text-sm text-slate-600">{t("topContentSubtitle")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {topPages.slice(0, 8).map((p) => (
              <a
                key={p.slug}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-emerald-400 hover:bg-emerald-50"
              >
                {p.title}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Pending posts with priority + guided mode */}
      {queueItems.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="font-semibold text-slate-900">{t("pendingTitle")}</h3>
          <p className="mt-1 text-sm text-slate-600">{t("pendingSubtitle")}</p>
          <div className="mt-4 space-y-4">
            {queueItems.slice(0, 25).map((q) => (
              <div
                key={q.id}
                className={`rounded-lg border bg-white p-4 ${
                  q.priority === "high" ? "border-amber-400 ring-1 ring-amber-200" : "border-amber-200"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {q.priority === "high" && (
                        <span className="rounded bg-amber-200 px-1.5 py-0.5 text-xs font-bold text-amber-900">
                          {t("highValueBadge")}
                        </span>
                      )}
                      <h4 className="font-medium text-slate-900">{q.title}</h4>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      {q.page_type} · {q.slug}
                    </p>
                    <a
                      href={q.page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block text-xs text-sky-600 hover:underline truncate"
                    >
                      {q.page_url}
                    </a>
                    {(q.postedPlatforms?.length ?? 0) > 0 && (
                      <p className="mt-2 text-xs text-emerald-600">
                        {t("postedLabel")}{" "}
                        {(q.postedPlatforms ?? [])
                          .map((p) => {
                            if (p === "reddit") return t("platformReddit");
                            if (p === "x") return t("platformX");
                            if (p === "quora") return t("platformQuora");
                            return p;
                          })
                          .join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {q.reddit_title && (
                      <button
                        type="button"
                        onClick={() => openGuided(q, "reddit")}
                        className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-medium ${
                          q.postedPlatforms?.includes("reddit")
                            ? "bg-emerald-100 text-emerald-700"
                            : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {t("platformReddit")} {q.postedPlatforms?.includes("reddit") && "✓"}
                      </button>
                    )}
                    {q.x_thread && (
                      <button
                        type="button"
                        onClick={() => openGuided(q, "x")}
                        className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-medium ${
                          q.postedPlatforms?.includes("x")
                            ? "bg-emerald-100 text-emerald-700"
                            : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {t("platformX")} {q.postedPlatforms?.includes("x") && "✓"}
                      </button>
                    )}
                    {q.quora_answer && (
                      <button
                        type="button"
                        onClick={() => openGuided(q, "quora")}
                        className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-medium ${
                          q.postedPlatforms?.includes("quora")
                            ? "bg-emerald-100 text-emerald-700"
                            : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {t("platformQuora")} {q.postedPlatforms?.includes("quora") && "✓"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Posting Plan */}
      <div className="rounded-xl border border-sky-200 bg-sky-50 p-5">
        <h3 className="font-semibold text-slate-900">{t("generateSectionTitle")}</h3>
        <p className="mt-1 text-sm text-slate-600">{t("generateSectionDesc")}</p>
        <Link
          href={`${dashBase}/generate`}
          className="mt-3 inline-block text-sm font-medium text-sky-700 hover:text-sky-800"
        >
          {t("generateLink")}
        </Link>
      </div>

      {/* Best Performing Keywords */}
      {bestKeywords.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold text-slate-900">{t("bestKeywordsTitle")}</h3>
          <p className="mt-1 text-sm text-slate-600">{t("bestKeywordsSubtitle")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {bestKeywords.slice(0, 10).map((k) => (
              <Link
                key={k.keyword}
                href={`${dashBase}/generate?keyword=${encodeURIComponent(k.keyword)}`}
                className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800"
              >
                {k.keyword}
                <span className="ml-1.5 text-xs text-slate-500">
                  {t("clicksSuffix", { n: k.clicks })}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Latest Keywords */}
      <div className="space-y-6">
        {items.map((item) => {
          const redditTitle = truncate(item.title, 300);
          const redditBody = `${item.oneLiner}\n\n来源：${item.pageUrl}`;
          const redditFull = `标题: ${redditTitle}\n\n正文:\n${redditBody}`;
          const xVersion = truncate(`${item.title}\n\n${item.oneLiner}\n\n${item.pageUrl}`, 280);
          const quoraVersion = `${item.title}\n\n${item.oneLiner}\n\n完整指南：${item.pageUrl}`;

          return (
            <div key={item.slug} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-900">{item.keyword}</h3>
                  <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                    {item.oneLiner || item.title}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Link href={`/zh/search/${item.slug}`} className="text-xs text-sky-600 hover:underline">
                      {t("pageLink")}
                    </Link>
                    <span className="text-slate-400">|</span>
                    <span className="text-xs text-slate-500 truncate max-w-[200px]" title={item.pageUrl}>
                      {t("externalLinkPrefix")}: {item.pageUrl}
                    </span>
                    <span className="text-slate-400">|</span>
                    <span className="text-xs text-slate-500 truncate max-w-[180px]" title={item.embedUrl}>
                      {t("embedPrefix")}: {item.embedUrl}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <ZhCopyButton text={redditFull} label={t("platformReddit")} />
                  <ZhCopyButton text={xVersion} label={t("platformX")} />
                  <ZhCopyButton text={quoraVersion} label={t("platformQuora")} />
                  <ZhCopyButton text={item.embedUrl} label={t("embedUrlButton")} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
