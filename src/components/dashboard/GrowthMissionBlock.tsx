"use client";

/**
 * V91/V92: Daily Growth Mission — lock-in first on dashboard; clickable tasks + execute API
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { GuidedPostingModal } from "@/components/distribution/GuidedPostingModal";

const STORAGE_KEYS = {
  lastActivity: "growth_mission_last_activity",
  lastVisit: "growth_mission_last_visit"
};

const DISMISSED_PREFIX = "growth_mission_dismissed_";

/** 只保留「今天」的跳过记录，避免 localStorage 里堆积往日键 */
function cleanupOldDismissedKeys() {
  if (typeof window === "undefined") return;
  const today = new Date().toISOString().slice(0, 10);
  const keep = `${DISMISSED_PREFIX}${today}`;
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k && k.startsWith(DISMISSED_PREFIX) && k !== keep) {
      localStorage.removeItem(k);
    }
  }
}

function dismissedStorageKey() {
  const today = new Date().toISOString().slice(0, 10);
  return `${DISMISSED_PREFIX}${today}`;
}

function loadDismissedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(dismissedStorageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function saveDismissedIds(ids: string[]) {
  localStorage.setItem(dismissedStorageKey(), JSON.stringify(ids));
}

type MissionTask = {
  id: string;
  slug: string;
  title: string;
  oneLiner: string;
  pageUrl: string;
  platform: "reddit" | "x" | "quora" | "boost";
  redditTitle?: string;
  redditBody?: string;
  xThread?: string;
  quoraAnswer?: string;
};

type MissionData = {
  tasks: MissionTask[];
  todayByPlatform: { reddit: number; x: number; quora: number };
  streak: number;
  targets: { reddit: number; x: number; quora: number; boost: number };
};

export function GrowthMissionBlock({
  distributionHref = "/dashboard/distribution"
}: {
  /** 中文工作台传 `/zh/dashboard/distribution`，避免跳到英文站 */
  distributionHref?: string;
}) {
  const t = useTranslations("growthMission");
  const locale = useLocale();
  const isZh = locale === "zh";
  const [data, setData] = useState<MissionData | null>(null);
  const [executingTask, setExecutingTask] = useState<MissionTask | null>(null);
  const [executingPlatform, setExecutingPlatform] = useState<"reddit" | "x" | "quora">("reddit");
  const [reminderState, setReminderState] = useState<"none" | "12h" | "24h">("none");
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => {
    cleanupOldDismissedKeys();
    setDismissedIds(loadDismissedIds());
  }, []);

  const fetchMission = useCallback(() => {
    const q = locale === "zh" ? "?locale=zh" : "";
    fetch(`/api/growth-mission/today${q}`, { credentials: "include" })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, [locale]);

  useEffect(() => {
    fetchMission();
  }, [fetchMission]);

  useEffect(() => {
    if (!data) return;
    const now = Date.now();
    const lastActivity = parseInt(localStorage.getItem(STORAGE_KEYS.lastActivity) || "0", 10);
    const lastVisit = parseInt(localStorage.getItem(STORAGE_KEYS.lastVisit) || "0", 10);
    localStorage.setItem(STORAGE_KEYS.lastVisit, String(now));

    const totalDone = (data.todayByPlatform?.reddit ?? 0) + (data.todayByPlatform?.x ?? 0) + (data.todayByPlatform?.quora ?? 0);
    const target = 10;
    if (totalDone >= target) return;

    const sinceActivity = lastActivity > 0 ? (now - lastActivity) / (1000 * 60 * 60) : 0;
    const sinceVisit = lastVisit > 0 ? (now - lastVisit) / (1000 * 60 * 60) : 0;
    const inactiveHours = Math.max(sinceActivity, sinceVisit);

    if (inactiveHours >= 24) setReminderState("24h");
    else if (inactiveHours >= 12) setReminderState("12h");
    else setReminderState("none");
  }, [data]);

  const visibleTasks = useMemo(() => {
    if (!data?.tasks?.length) return [];
    return data.tasks.filter((task) => !dismissedIds.includes(task.id));
  }, [data, dismissedIds]);

  const recordActivity = () => {
    localStorage.setItem(STORAGE_KEYS.lastActivity, String(Date.now()));
  };

  function hideTask(taskId: string) {
    if (dismissedIds.includes(taskId)) return;
    const next = [...dismissedIds, taskId];
    setDismissedIds(next);
    saveDismissedIds(next);
  }

  function showAllHidden() {
    setDismissedIds([]);
    saveDismissedIds([]);
  }

  async function logExecute(body: Record<string, unknown>) {
    await fetch("/api/growth-mission/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body)
    });
  }

  async function markAsPosted(task: MissionTask, platform: "reddit" | "x" | "quora") {
    recordActivity();
    const res = await fetch("/api/growth-mission/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "complete_post", platform, slug: task.slug })
    });
    if (res.ok) {
      setExecutingTask(null);
      fetchMission();
    }
  }

  async function startTask(task: MissionTask) {
    recordActivity();
    if (task.platform === "boost") {
      await logExecute({ action: "click_boost", slug: task.slug });
      window.open(task.pageUrl, "_blank", "noopener,noreferrer");
      return;
    }
    await logExecute({ action: "log_start", platform: task.platform, slug: task.slug });
    setExecutingTask(task);
    setExecutingPlatform(task.platform);
  }

  function startNextIncomplete() {
    recordActivity();
    if (!visibleTasks.length) return;
    const postable = visibleTasks.filter((task) => task.platform !== "boost") as (MissionTask & {
      platform: "reddit" | "x" | "quora";
    })[];
    if (!data) return;
    const tday = data.todayByPlatform ?? { reddit: 0, x: 0, quora: 0 };
    const ttargets = data.targets ?? { reddit: 5, x: 3, quora: 2, boost: 2 };
    let next: (typeof postable)[0] | null = null;
    for (const task of postable) {
      const need =
        task.platform === "reddit" ? ttargets.reddit : task.platform === "x" ? ttargets.x : ttargets.quora;
      const done = tday[task.platform] ?? 0;
      if (done < need) {
        next = task;
        break;
      }
    }
    if (next) void startTask(next);
  }

  if (!data) return null;

  const today = data.todayByPlatform ?? { reddit: 0, x: 0, quora: 0 };
  const targets = data.targets ?? { reddit: 5, x: 3, quora: 2, boost: 2 };
  const totalDone = today.reddit + today.x + today.quora;
  const target = 10;
  const pct = Math.min(100, (totalDone / target) * 100);

  const platformClass = isZh
    ? "text-[10px] font-bold tracking-wide text-amber-800"
    : "text-[10px] font-bold uppercase tracking-wide text-amber-800";

  return (
    <div className="mb-10 rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-sm">
      <GuidedPostingModal
        open={!!executingTask}
        onClose={() => setExecutingTask(null)}
        item={
          executingTask
            ? {
                id: executingTask.id,
                title: executingTask.title,
                reddit_title: executingTask.redditTitle,
                reddit_body: executingTask.redditBody,
                x_thread: executingTask.xThread,
                quora_answer: executingTask.quoraAnswer,
                page_url: executingTask.pageUrl
              }
            : null
        }
        platform={executingPlatform}
        onDone={() => executingTask && markAsPosted(executingTask, executingPlatform)}
      />

      <div className="rounded-xl border border-amber-200/80 bg-white/70 px-4 py-3 text-sm text-slate-700 space-y-2 mb-4">
        <p>{t("introP1")}</p>
        <p className="text-slate-600">{t("introP2")}</p>
        <p className="text-slate-600 border-t border-amber-100/80 pt-2 mt-2">{t("introStorage")}</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">🔥 {t("title")}</h2>
          <p className="mt-1 text-sm text-slate-600">
            {t("statsLine", {
              redditDone: today.reddit,
              redditTarget: targets.reddit,
              xDone: today.x,
              xTarget: targets.x,
              quoraDone: today.quora,
              quoraTarget: targets.quora,
              boostPages: targets.boost
            })}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {data.streak > 0 && (
            <span className="rounded-full bg-amber-200 px-3 py-1 text-sm font-semibold text-amber-900">
              {t("streakBadge", { count: data.streak })}
            </span>
          )}
          <button
            type="button"
            onClick={startNextIncomplete}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            👉 {t("startExecution")}
          </button>
          <Link href={distributionHref} className="text-sm font-medium text-sky-600 hover:underline">
            {t("fullDistribution")}
          </Link>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700">{t("progress")}</span>
          <span className="font-semibold text-slate-900">
            {t("completed", { done: totalDone, total: target })}
          </span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {data.tasks && data.tasks.length > 0 && dismissedIds.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white/60 px-3 py-2 text-sm">
          <span className="text-slate-600">{t("hiddenCount", { count: dismissedIds.length })}</span>
          <button
            type="button"
            onClick={showAllHidden}
            className="font-medium text-sky-700 hover:text-sky-900 hover:underline"
          >
            {t("showHidden")}
          </button>
        </div>
      )}

      {data.tasks && data.tasks.length > 0 && (
        <ul className="mt-5 space-y-2" aria-label={t("tasksAriaLabel")}>
          {visibleTasks.length === 0 ? (
            <li className="rounded-xl border border-dashed border-amber-300 bg-amber-50/50 px-3 py-4 text-sm text-slate-600">
              <p className="text-center">{t("allTasksHidden")}</p>
              {dismissedIds.length > 0 && (
                <div className="mt-3 flex justify-center">
                  <button
                    type="button"
                    onClick={showAllHidden}
                    className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                  >
                    {t("showHidden")}
                  </button>
                </div>
              )}
            </li>
          ) : (
            visibleTasks.map((task) => (
              <li
                key={task.id}
                className="flex flex-col gap-2 rounded-xl border border-amber-200/80 bg-white/90 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <span className={platformClass}>
                    {task.platform === "reddit"
                      ? t("platform.reddit")
                      : task.platform === "x"
                        ? t("platform.x")
                        : task.platform === "quora"
                          ? t("platform.quora")
                          : t("platform.boost")}
                  </span>
                  <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2 flex-wrap justify-end">
                  <button
                    type="button"
                    onClick={() => void startTask(task)}
                    className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                  >
                    {task.platform === "boost" ? t("openPage") : t("runTask")}
                  </button>
                  <button
                    type="button"
                    onClick={() => hideTask(task.id)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    {t("hideTask")}
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      )}

      {(reminderState === "12h" || reminderState === "24h") && totalDone < target && (
        <div
          className={`mt-4 rounded-xl border p-4 ${reminderState === "24h" ? "border-rose-300 bg-rose-50" : "border-amber-300 bg-amber-50"}`}
        >
          <p className="font-semibold text-slate-900">⚠️ {t("reminderTitle")}</p>
          {reminderState === "24h" && (
            <p className="mt-1 text-sm text-slate-700">{t("reminderBody24h")}</p>
          )}
        </div>
      )}

      {data.streak > 0 && totalDone < target && (
        <p className="mt-3 text-sm font-medium text-amber-800">{t("dontBreakStreak")}</p>
      )}
    </div>
  );
}
