"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ZhCopyButton } from "@/components/zh/ZhCopyButton";
import { templateReddit, templateX, templateQuora } from "@/lib/distribution-templates";

const REDDIT_TITLE_LIMIT = 300;
const X_TWEET_LIMIT = 280;

type GeneratedContent = {
  reddit: { title: string; body: string };
  x: { tweet1: string; tweet2: string; tweet3: string; tweet4: string; tweet5: string };
  quora: { answer: string };
};

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 3) + "...";
}

export function DistributionGenerateClient() {
  const t = useTranslations("distributionGenerate");
  const tCommon = useTranslations("common");
  const searchParams = useSearchParams();
  const initialKeyword = searchParams?.get("keyword") ?? "";
  const [keyword, setKeyword] = useState(initialKeyword);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checklist, setChecklist] = useState({ reddit: false, x: false, quora: false });

  useEffect(() => {
    const k = searchParams?.get("keyword");
    if (k) setKeyword(k);
  }, [searchParams]);

  async function handleGenerate() {
    const trimmed = keyword.trim();
    if (!trimmed) return;

    setIsGenerating(true);
    setError(null);
    setContent(null);
    setChecklist({ reddit: false, x: false, quora: false });

    try {
      const res = await fetch("/api/distribution/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ keyword: trimmed })
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error) {
          setError(data.error);
          setContent({
            reddit: templateReddit(trimmed),
            x: templateX(trimmed),
            quora: templateQuora(trimmed)
          });
        } else {
          setError(t("errorGenerationFailed"));
          setContent({
            reddit: templateReddit(trimmed),
            x: templateX(trimmed),
            quora: templateQuora(trimmed)
          });
        }
      } else {
        setContent(data);
      }
    } catch {
      setError("Network error");
      setContent({
        reddit: templateReddit(trimmed),
        x: templateX(trimmed),
        quora: templateQuora(trimmed)
      });
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleConfirmPost(platform: "reddit" | "x" | "quora") {
    const trimmed = keyword.trim();
    if (!trimmed) return;

    try {
      await fetch("/api/distribution/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ platform, keyword: trimmed })
      });
      setChecklist((c) => ({ ...c, [platform]: true }));
    } catch {
      // silent fail
    }
  }

  if (!content) {
    return (
      <div className="mt-8 max-w-2xl">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
          <label className="block text-sm font-medium text-slate-700">{t("keywordLabel")}</label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={t("keywordPlaceholder")}
            className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          />
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !keyword.trim()}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isGenerating ? t("generating") : t("generateContent")}
          </button>
        </div>
      </div>
    );
  }

  const redditTitle = truncate(content.reddit.title, REDDIT_TITLE_LIMIT);
  const redditFull = `Title: ${redditTitle}\n\nBody:\n${content.reddit.body}`;

  return (
    <div className="mt-8 space-y-8">
      {error && (
        <p className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">
          {error} {t("errorShowingTemplate")}
        </p>
      )}

      {/* Manual Publish Checklist */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold text-slate-900">{t("postTrackingTitle")}</h3>
        <p className="mt-1 text-sm text-slate-600">{t("postTrackingSubtitle")}</p>
        <div className="mt-4 flex flex-wrap gap-4">
          <label className="inline-flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={checklist.reddit}
              onChange={(e) => {
                if (e.target.checked) handleConfirmPost("reddit");
              }}
              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <span>{t("checklistReddit")}</span>
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={checklist.x}
              onChange={(e) => {
                if (e.target.checked) handleConfirmPost("x");
              }}
              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <span>{t("checklistX")}</span>
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={checklist.quora}
              onChange={(e) => {
                if (e.target.checked) handleConfirmPost("quora");
              }}
              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <span>{t("checklistQuora")}</span>
          </label>
        </div>
      </div>

      {/* Reddit */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-slate-900">{t("redditBlock")}</h3>
          <ZhCopyButton text={redditFull} label={tCommon("copy")} />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {t("titleLength", { current: content.reddit.title.length, max: REDDIT_TITLE_LIMIT })}
        </p>
        <div className="mt-3 space-y-2 text-sm">
          <p className="font-medium text-slate-700">{t("titleField")}</p>
          <p className="whitespace-pre-line text-slate-800">{redditTitle}</p>
          <p className="mt-2 font-medium text-slate-700">{t("bodyField")}</p>
          <p className="whitespace-pre-line text-slate-800">{content.reddit.body}</p>
        </div>
      </div>

      {/* X Thread */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h3 className="font-semibold text-slate-900">{t("xThread")}</h3>
        <p className="mt-1 text-xs text-slate-500">{t("eachTweetMax", { n: X_TWEET_LIMIT })}</p>
        <div className="mt-4 space-y-3">
          {(["tweet1", "tweet2", "tweet3", "tweet4", "tweet5"] as const).map((key, i) => {
            const text = content.x[key];
            const copyText = truncate(text, X_TWEET_LIMIT);
            return (
              <div key={key} className="flex items-start justify-between gap-3 rounded-lg bg-white p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-500">{t("tweetN", { n: i + 1 })}</p>
                  <p className="mt-0.5 whitespace-pre-line text-sm text-slate-800">{copyText}</p>
                  <p className="mt-1 text-xs text-slate-400">{copyText.length}/{X_TWEET_LIMIT}</p>
                </div>
                <ZhCopyButton text={copyText} label={tCommon("copy")} className="shrink-0" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Quora */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-slate-900">{t("quoraBlock")}</h3>
          <ZhCopyButton text={content.quora.answer} label={tCommon("copy")} />
        </div>
        <div className="mt-3">
          <p className="whitespace-pre-line text-sm text-slate-800">{content.quora.answer}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          setContent(null);
          setKeyword("");
        }}
        className="text-sm font-medium text-sky-600 hover:text-sky-800"
      >
        {t("generateAnother")}
      </button>
    </div>
  );
}
