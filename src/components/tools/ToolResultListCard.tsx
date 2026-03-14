"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { ToolCopyButton } from "./ToolCopyButton";
import { ShareButtons } from "./ShareButtons";
import { DelegatedButton } from "@/components/DelegatedButton";
import { addFavorite, getFavorites, removeFavorite } from "@/lib/storage";

type ToolResultListCardProps = {
  title: string;
  items: string[];
  isLoading?: boolean;
  toolSlug?: string;
  toolName?: string;
  onCopyItem: (index: number) => void;
  onCopyAll: () => void;
  onRegenerate?: () => void;
  emptyMessage: string;
};

export function ToolResultListCard({
  title,
  items,
  isLoading = false,
  toolSlug,
  toolName = "",
  onCopyItem,
  onCopyAll,
  onRegenerate,
  emptyMessage
}: ToolResultListCardProps) {
  const t = useTranslations("common");
  const [savedIds, setSavedIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    const favs = getFavorites();
    return new Set(favs.map((f) => f.text));
  });

  const showContent = !isLoading && items.length > 0;
  const showSkeletons = isLoading;

  function handleSave(text: string) {
    if (!toolSlug) return;
    const favs = getFavorites();
    const existing = favs.find((f) => f.text === text);
    if (existing) {
      removeFavorite(existing.id);
      setSavedIds((prev) => {
        const next = new Set(prev);
        next.delete(text);
        return next;
      });
    } else {
      addFavorite({ toolSlug, toolName, text });
      setSavedIds((prev) => new Set(prev).add(text));
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm transition-shadow duration-150 hover:shadow-md hover:border-slate-300" data-result-list>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        {showContent && (
          <div className="flex items-center gap-2 flex-wrap">
            {toolSlug && <ShareButtons toolSlug={toolSlug} items={items} />}
            {onRegenerate && (
              <DelegatedButton
                onClick={onRegenerate}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:border-sky-500/80 hover:bg-sky-50 hover:text-sky-700 transition duration-150"
              >
                {t("regenerate")}
              </DelegatedButton>
            )}
            <ToolCopyButton
              labelKey="copyAll"
              onClick={onCopyAll}
              variant="primary"
              getTextToCopy={(btn) => {
                const list = btn.closest("[data-result-list]");
                const sources = list?.querySelectorAll("[data-copy-source]");
                if (!sources?.length) return null;
                return Array.from(sources)
                  .map((el) => (el as HTMLElement).innerText?.trim() ?? "")
                  .filter(Boolean)
                  .join("\n\n---\n\n");
              }}
            />
          </div>
        )}
      </div>
      <div className="space-y-5 min-h-[80px]">
        {showSkeletons && (
          <>
            <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
              Generating...
            </p>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </>
        )}
        {!showSkeletons && items.length === 0 && (
          <p className="text-sm text-slate-500 py-4">{emptyMessage}</p>
        )}
        {showContent &&
          items.map((text, index) => (
            <div
              key={index}
              data-result-item
              className="rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-4 text-sm text-slate-800 whitespace-pre-line flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 transition-shadow duration-150 hover:border-slate-300 hover:shadow-sm"
            >
              <span className="flex-1 min-w-0 leading-relaxed" data-copy-source>
                <span className="text-slate-500 font-semibold mr-2">{index + 1}.</span>
                {text}
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                {toolSlug && (
                  <DelegatedButton
                    onClick={() => handleSave(text)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition duration-150 ${
                      savedIds.has(text)
                        ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                        : "border border-slate-300 bg-white text-slate-600 hover:border-amber-400/80 hover:bg-amber-50 hover:text-amber-700"
                    }`}
                    title={savedIds.has(text) ? t("unsave") : t("save")}
                  >
                    <Star className={`h-4 w-4 ${savedIds.has(text) ? "fill-current" : ""}`} />
                    {savedIds.has(text) ? t("saved") : t("save")}
                  </DelegatedButton>
                )}
                <ToolCopyButton
                  onClick={() => onCopyItem(index)}
                  variant="primary"
                  getTextToCopy={(btn) => {
                    const item = btn.closest("[data-result-item]");
                    const src = item?.querySelector("[data-copy-source]");
                    return (src as HTMLElement)?.innerText?.trim() ?? null;
                  }}
                />
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
