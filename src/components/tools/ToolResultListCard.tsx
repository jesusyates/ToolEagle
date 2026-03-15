"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Star, Pencil } from "lucide-react";
import { ToolCopyButton } from "./ToolCopyButton";
import { ShareButtons } from "./ShareButtons";
import { DelegatedButton } from "@/components/DelegatedButton";
import { getFavorites } from "@/lib/storage";
import { improveText, type ImproveAction } from "@/lib/ai/improveText";
import { LoginPromptModal } from "@/components/LoginPromptModal";
import { ProjectSelectorModal } from "@/components/ProjectSelectorModal";

type ToolResultListCardProps = {
  title: string;
  items: string[];
  isLoading?: boolean;
  toolSlug?: string;
  toolName?: string;
  input?: string;
  onCopyItem: (index: number) => void;
  onCopyAll: () => void;
  onRegenerate?: () => void;
  onSaveEditedItem?: (index: number, newText: string) => void | Promise<void>;
  onItemsChange?: (index: number, newText: string) => void;
  emptyMessage: string;
  isLoggedIn?: boolean;
  onRequireLogin?: () => void;
};

export function ToolResultListCard({
  title,
  items,
  isLoading = false,
  toolSlug,
  toolName = "",
  input = "",
  onCopyItem,
  onCopyAll,
  onRegenerate,
  onSaveEditedItem,
  onItemsChange,
  emptyMessage,
  isLoggedIn = false,
  onRequireLogin
}: ToolResultListCardProps) {
  const t = useTranslations("common");
  const [savedIds, setSavedIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    const favs = getFavorites();
    return new Set(favs.map((f) => f.text));
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [improvingIndex, setImprovingIndex] = useState<number | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projectModalContent, setProjectModalContent] = useState("");

  const showContent = !isLoading && items.length > 0;
  const showSkeletons = isLoading;

  function handleSaveToFavorites(text: string) {
    if (!toolSlug) return;
    if (!isLoggedIn) {
      onRequireLogin?.() ?? setLoginModalOpen(true);
      return;
    }
    fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ toolSlug, toolName, text })
    })
      .then((r) => {
        if (r.ok) setSavedIds((prev) => new Set(prev).add(text));
        else if (r.status === 401) setLoginModalOpen(true);
      })
      .catch(() => {});
  }

  function handleSaveToProject(text: string) {
    if (!isLoggedIn) {
      onRequireLogin?.() ?? setLoginModalOpen(true);
      return;
    }
    setProjectModalContent(text);
    setProjectModalOpen(true);
  }

  async function handleSelectProject(projectId: string) {
    const res = await fetch(`/api/projects/${projectId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ content: projectModalContent, type: "text" })
    });
    if (res.ok) setProjectModalOpen(false);
  }

  async function handleCreateAndSave(projectName: string) {
    const createRes = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name: projectName })
    });
    const { project } = await createRes.json();
    if (project?.id) {
      await handleSelectProject(project.id);
    }
  }

  function handleSaveClick(text: string) {
    if (isLoggedIn) {
      handleSaveToFavorites(text);
    } else {
      onRequireLogin?.() ?? setLoginModalOpen(true);
    }
  }

  async function handleImprove(index: number, action: ImproveAction) {
    const text = editingIndex === index ? editText : items[index];
    if (!text) return;
    setImprovingIndex(index);
    try {
      const result = await improveText(text, action);
      onItemsChange?.(index, result);
      if (editingIndex === index) setEditText(result);
    } finally {
      setImprovingIndex(null);
    }
  }

  async function handleSaveEdited(index: number) {
    await onSaveEditedItem?.(index, editText);
    setEditingIndex(null);
  }

  function getDisplayText(index: number) {
    if (editingIndex === index) return editText;
    return items[index] ?? "";
  }

  return (
    <>
      <LoginPromptModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        message="Please log in to save to favorites or projects."
      />
      <ProjectSelectorModal
        open={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        content={projectModalContent}
        onSelect={handleSelectProject}
        onCreateAndSave={handleCreateAndSave}
      />
      <div
        className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm transition-shadow duration-150 hover:shadow-md hover:border-slate-300"
        data-result-list
      >
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
                    .map((el) => {
                      const el2 = el as HTMLElement;
                      return "value" in el2 ? (el2 as HTMLTextAreaElement).value : el2.innerText;
                    })
                    .map((s) => (typeof s === "string" ? s.trim() : ""))
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
            items.map((text, index) => {
              const isEditing = editingIndex === index;
              const isImproving = improvingIndex === index;
              const displayText = getDisplayText(index);

              return (
                <div
                  key={index}
                  data-result-item
                  className="rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-4 text-sm text-slate-800 flex flex-col gap-4 transition-shadow duration-150 hover:border-slate-300 hover:shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <textarea
                        data-copy-source
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full min-h-[100px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-sky-500/70"
                        placeholder="Edit your content..."
                      />
                    ) : (
                      <span className="block leading-relaxed whitespace-pre-line" data-copy-source>
                        <span className="text-slate-500 font-semibold mr-2">{index + 1}.</span>
                        {displayText}
                      </span>
                    )}
                  </div>

                  {/* AI Improve buttons */}
                  {!isEditing && (
                    <div className="flex flex-wrap gap-1.5">
                      {(["shorter", "funnier", "viral", "emojis"] as const).map((action) => (
                        <DelegatedButton
                          key={action}
                          onClick={() => handleImprove(index, action)}
                          disabled={isImproving}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                        >
                          {action === "shorter" && t("makeShorter")}
                          {action === "funnier" && t("makeFunnier")}
                          {action === "viral" && t("makeViral")}
                          {action === "emojis" && t("addEmojis")}
                        </DelegatedButton>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    {isEditing ? (
                      <>
                        {onSaveEditedItem && (
                          <DelegatedButton
                            onClick={() => handleSaveEdited(index)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700"
                          >
                            {t("save")}
                          </DelegatedButton>
                        )}
                        <ToolCopyButton
                          onClick={() => onCopyItem(index)}
                          variant="primary"
                          getTextToCopy={() => editText || null}
                        />
                        <DelegatedButton
                          onClick={() => setEditingIndex(null)}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                        >
                          {t("cancel")}
                        </DelegatedButton>
                      </>
                    ) : (
                      <>
                        <DelegatedButton
                          onClick={() => {
                            setEditingIndex(index);
                            setEditText(items[index] ?? "");
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          {t("edit")}
                        </DelegatedButton>
                        {toolSlug && (
                          <DelegatedButton
                            onClick={() => handleSaveClick(displayText)}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition duration-150 ${
                              savedIds.has(displayText)
                                ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                : "border border-slate-300 bg-white text-slate-600 hover:border-amber-400/80 hover:bg-amber-50 hover:text-amber-700"
                            }`}
                            title={savedIds.has(displayText) ? t("unsave") : t("saveToFavorites")}
                          >
                            <Star className={`h-4 w-4 ${savedIds.has(displayText) ? "fill-current" : ""}`} />
                            {savedIds.has(displayText) ? t("saved") : t("saveToFavorites")}
                          </DelegatedButton>
                        )}
                        <DelegatedButton
                          onClick={() => handleSaveToProject(displayText)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                        >
                          {t("saveToProject")}
                        </DelegatedButton>
                        <ToolCopyButton
                          onClick={() => onCopyItem(index)}
                          variant="primary"
                          getTextToCopy={(btn) => {
                            const item = btn.closest("[data-result-item]");
                            const src = item?.querySelector("[data-copy-source]");
                            const el = src as HTMLElement;
                            return el && "value" in el
                              ? (el as HTMLTextAreaElement).value.trim()
                              : el?.innerText?.trim() ?? null;
                          }}
                        />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </>
  );
}
